import { ObjectId } from 'mongodb';
import type { Collection, Document } from 'mongodb';
import { getDatabase } from './index.ts';
import type { ChatMessageItem, ChatPersonaId } from '../types/resume.ts';

interface ChatMessageDocument extends Document {
  _id: ObjectId;
  userId: ObjectId;
  role: 'user' | 'model';
  persona: ChatPersonaId;
  modelUsed: string;
  content: string;
  createdAt: Date;
}

function chatCollection(): Promise<Collection<ChatMessageDocument>> {
  return getDatabase().then((database) =>
    database.collection<ChatMessageDocument>('chatMessages')
  );
}

function toChatMessage(document: ChatMessageDocument): ChatMessageItem {
  return {
    id: document._id.toHexString(),
    role: document.role,
    persona: document.persona,
    modelUsed: document.modelUsed,
    content: document.content,
    createdAt: document.createdAt.toISOString(),
  };
}

export async function getUserChatMessages(
  userId: ObjectId
): Promise<ChatMessageItem[]> {
  const messages = await chatCollection();
  const documents = await messages
    .find({ userId })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  return documents.map(toChatMessage);
}

export async function appendChatMessage(
  userId: ObjectId,
  message: Omit<ChatMessageItem, 'id' | 'createdAt'>
): Promise<ChatMessageItem> {
  const messages = await chatCollection();
  const document: ChatMessageDocument = {
    _id: new ObjectId(),
    userId,
    role: message.role,
    persona: message.persona,
    modelUsed: message.modelUsed,
    content: message.content,
    createdAt: new Date(),
  };
  await messages.insertOne(document);
  return toChatMessage(document);
}

export async function clearUserChatMessages(userId: ObjectId): Promise<void> {
  const messages = await chatCollection();
  await messages.deleteMany({ userId });
}
