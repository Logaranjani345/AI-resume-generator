import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexPromise: Promise<void> | undefined;
}

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error('MONGODB_URI must be set in environment variables.');
  }
  if (!databaseName) {
    throw new Error('MONGODB_DB_NAME must be set in environment variables.');
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    global._mongoClientPromise = client.connect();
  }

  try {
    const client = await global._mongoClientPromise;
    const database = client.db(databaseName);

    if (!global._mongoIndexPromise) {
      global._mongoIndexPromise = Promise.all([
        database.collection('users').createIndex({ email: 1 }, { unique: true }),
        database.collection('sessions').createIndex(
          { tokenHash: 1 },
          { unique: true }
        ),
        database.collection('sessions').createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 }
        ),
        database.collection('resumes').createIndex({
          userId: 1,
          updatedAt: -1,
        }),
        database.collection('chatMessages').createIndex({
          userId: 1,
          createdAt: 1,
        }),
      ]).then(() => undefined);
    }

    await global._mongoIndexPromise;
    return database;
  } catch (error) {
    global._mongoClientPromise = undefined;
    global._mongoIndexPromise = undefined;
    throw new Error('Unable to connect to or initialize MongoDB.', {
      cause: error,
    });
  }
}
