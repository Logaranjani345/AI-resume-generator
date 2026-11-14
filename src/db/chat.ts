import { asc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { chatMessages } from './schema.ts';
import type { ChatMessageItem, ChatPersonaId } from '../types/resume.ts';

export async function getUserChatMessages(
  userId: number
): Promise<ChatMessageItem[]> {
  try {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(asc(chatMessages.id));

    return rows.map((row) => ({
      id: row.id,
      role: row.role === 'model' ? 'model' : 'user',
      persona: (row.persona as ChatPersonaId) || 'career-coach',
      modelUsed: row.modelUsed,
      content: row.content,
      createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('Database error in getUserChatMessages:', error);
    throw new Error('Unable to load conversation history.', { cause: error });
  }
}

export async function appendChatMessage(
  userId: number,
  message: Omit<ChatMessageItem, 'id' | 'createdAt'>
): Promise<ChatMessageItem> {
  try {
    const [inserted] = await db
      .insert(chatMessages)
      .values({
        userId,
        role: message.role,
        persona: message.persona,
        modelUsed: message.modelUsed,
        content: message.content,
      })
      .returning();

    return {
      id: inserted.id,
      role: inserted.role === 'model' ? 'model' : 'user',
      persona: (inserted.persona as ChatPersonaId) || 'career-coach',
      modelUsed: inserted.modelUsed,
      content: inserted.content,
      createdAt: inserted.createdAt ? inserted.createdAt.toISOString() : undefined,
    };
  } catch (error) {
    console.error('Database error in appendChatMessage:', error);
    throw new Error('Unable to save chat message.', { cause: error });
  }
}

export async function clearUserChatMessages(userId: number): Promise<void> {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  } catch (error) {
    console.error('Database error in clearUserChatMessages:', error);
    throw new Error('Unable to clear chat history.', { cause: error });
  }
}
