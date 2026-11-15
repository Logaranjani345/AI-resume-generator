import { ObjectId } from 'mongodb';
import type { Collection, Document } from 'mongodb';
import { getDatabase } from './index.ts';

export interface UserDocument extends Document {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

function usersCollection(): Promise<Collection<UserDocument>> {
  return getDatabase().then((database) =>
    database.collection<UserDocument>('users')
  );
}

export async function findUserByEmail(
  email: string
): Promise<UserDocument | null> {
  const users = await usersCollection();
  return users.findOne({ email });
}

export async function findUserById(
  id: ObjectId
): Promise<UserDocument | null> {
  const users = await usersCollection();
  return users.findOne({ _id: id });
}

export async function createUserAccount(
  email: string,
  passwordHash: string
): Promise<UserDocument> {
  const users = await usersCollection();
  const user: UserDocument = {
    _id: new ObjectId(),
    email,
    passwordHash,
    createdAt: new Date(),
  };
  await users.insertOne(user);
  return user;
}
