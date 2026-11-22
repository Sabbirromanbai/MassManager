import { MongoClient, Db } from "mongodb";
import { ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const client = new MongoClient(MONGODB_URI);

interface SeedMember {
  name: string;
  type: "regular" | "eggOnly" | "guest";
  rotationOrder: number | null;
}

const membersToSeed: SeedMember[] = [
  { name: "Md Sabbir Hossen", type: "regular", rotationOrder: 0 },
  { name: "Arif", type: "regular", rotationOrder: 1 },
  { name: "Ashraful", type: "regular", rotationOrder: 2 },
  { name: "Chaitway Marma", type: "regular", rotationOrder: 3 },
  { name: "Jahid Sir", type: "regular", rotationOrder: null },
  { name: "Symon Sir", type: "regular", rotationOrder: null },
  { name: "Rana Bai", type: "eggOnly", rotationOrder: null },
  { name: "Rasel", type: "guest", rotationOrder: null },
];

async function seedMembers(): Promise<void> {
  await client.connect();
  const db = client.db("mess-manager");
  const collection = db.collection("members");

  let inserted = 0;
  let updated = 0;

  for (const member of membersToSeed) {
    const existing = await collection.findOne({ name: member.name });

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            type: member.type,
            rotationOrder: member.rotationOrder,
            isActive: true,
          },
        }
      );
      updated++;
    } else {
      await collection.insertOne({
        userId: null,
        email: null,
        name: member.name,
        type: member.type,
        isActive: true,
        rotationOrder: member.rotationOrder,
        createdAt: new Date(),
      });
      inserted++;
    }
  }

  console.log(`Seeding complete: ${inserted} inserted, ${updated} updated`);

  await client.close();
}

seedMembers().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});