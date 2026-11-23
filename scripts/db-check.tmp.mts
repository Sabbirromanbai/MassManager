/* Read-only connectivity check for the report debugging session. */
import { readFileSync } from "node:fs";

for (const line of readFileSync("E:/MassManager/apps/web/.env", "utf8").split(/\r?\n/)) {
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) {
    process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const { MongoClient } = await import("mongodb");
const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const db = client.db("mess-manager");
  const users = await db.collection("user").find({}, { projection: { name: 1, email: 1 } }).limit(10).toArray();
  const members = await db.collection("members").find({}, { projection: { name: 1, userId: 1, rotationOrder: 1, whatsappNumber: 1, type: 1, isActive: 1 } }).toArray();
  console.log("USERS:", JSON.stringify(users, null, 1));
  console.log("MEMBERS:", JSON.stringify(members, null, 1));
} catch (e) {
  console.log("DB ERROR:", (e as Error).message);
} finally {
  await client.close();
}
