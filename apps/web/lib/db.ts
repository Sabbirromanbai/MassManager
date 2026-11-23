import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}
const uri: string = MONGODB_URI;
const DB_NAME = "mess-manager";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise: Promise<MongoClient> | undefined;
  mongoDb: Db | undefined;
};

/**
 * The single MongoClient for the process. The connect() promise is cached on
 * globalThis so every caller (Better Auth, route handlers, ...) shares one
 * topology.
 *
 * Never close this client: it is reused for the lifetime of the process, and
 * closing it makes every later operation fail with MongoTopologyClosedError.
 */
export function getClient(): Promise<MongoClient> {
  const existing = globalForMongo.mongoClientPromise;
  if (existing) {
    return existing;
  }

  const client = new MongoClient(uri);
  const connectPromise = client.connect().catch((error) => {
    // The driver closes the topology when the initial connect fails, leaving
    // the client unusable. Drop it so the next request builds a fresh client
    // instead of reusing a permanently closed topology.
    globalForMongo.mongoClientPromise = undefined;
    globalForMongo.mongoDb = undefined;
    throw error;
  });

  globalForMongo.mongoClientPromise = connectPromise;
  return connectPromise;
}

export async function getDb(): Promise<Db> {
  if (globalForMongo.mongoDb) {
    return globalForMongo.mongoDb;
  }

  const client = await getClient();
  const db = client.db(DB_NAME);
  globalForMongo.mongoDb = db;
  return db;
}
