import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}
const uri: string = MONGODB_URI;

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined;
  mongoDb: Db | undefined;
};

export async function getDb(): Promise<Db> {
  if (globalForMongo.mongoDb) {
    return globalForMongo.mongoDb;
  }

  const client = globalForMongo.mongoClient ?? new MongoClient(uri);
  globalForMongo.mongoClient = client;

  await client.connect();
  const db = client.db("mess-manager");
  globalForMongo.mongoDb = db;

  return db;
}