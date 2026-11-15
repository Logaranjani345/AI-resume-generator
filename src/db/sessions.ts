import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Collection, Document } from 'mongodb';
import { getDatabase } from './index.ts';
import { findUserById, UserDocument } from './users.ts';

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionDocument extends Document {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

function sessionsCollection(): Promise<Collection<SessionDocument>> {
  return getDatabase().then((database) =>
    database.collection<SessionDocument>('sessions')
  );
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: ObjectId): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const sessions = await sessionsCollection();
  await sessions.insertOne({
    _id: new ObjectId(),
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
  });
  return token;
}

export async function findSessionUser(
  token: string
): Promise<UserDocument | null> {
  const sessions = await sessionsCollection();
  const session = await sessions.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  return session ? findUserById(session.userId) : null;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await sessionsCollection();
  await sessions.deleteOne({ tokenHash: hashToken(token) });
}
