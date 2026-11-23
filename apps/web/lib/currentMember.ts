import { ObjectId } from "mongodb";
import { COLLECTIONS, Member } from "./models";
import { getManagerRotationIndex, getCurrentMonth } from "./manager";
import { getDb } from "./db";

export async function getOrLinkMember(user: {
  id: string;
  name: string;
  email: string;
}): Promise<Member | null> {
  const db = await getDb();
  const collection = db.collection<Member>("members");

  const byUserId = await collection.findOne({ userId: user.id });
  if (byUserId) {
    return byUserId;
  }

  const byName = await collection.findOne({
    name: user.name,
    userId: null,
  });

  if (byName) {
    await collection.updateOne(
      { _id: byName._id },
      {
        $set: {
          userId: user.id,
          email: user.email,
        },
      }
    );
    return { ...byName, userId: user.id, email: user.email };
  }

  return null;
}

export function isCurrentManagerMember(member: Member): boolean {
  if (member.rotationOrder === null) {
    return false;
  }
  const currentMonth = getCurrentMonth();
  const currentRotationIndex = getManagerRotationIndex(currentMonth);
  return member.rotationOrder === currentRotationIndex;
}

/**
 * WhatsApp numbers for the given member IDs. Used by the report page so only
 * numbers the viewer is already allowed to see are sent to the client.
 */
export async function getWhatsappNumbersByMemberIds(
  memberIds: string[]
): Promise<Record<string, string | null>> {
  if (memberIds.length === 0) return {};

  const db = await getDb();
  const docs = await db
    .collection<Member>(COLLECTIONS.members)
    .find(
      { _id: { $in: memberIds.map((id) => new ObjectId(id)) } },
      { projection: { whatsappNumber: 1 } }
    )
    .toArray();

  const numbers: Record<string, string | null> = {};
  for (const doc of docs) {
    if (!doc._id) continue;
    numbers[doc._id.toString()] = doc.whatsappNumber ?? null;
  }
  return numbers;
}

/** Resolves the member record for the manager assigned to the current month. */
export async function getCurrentManagerMember(): Promise<Member | null> {
  const db = await getDb();
  return db.collection<Member>(COLLECTIONS.members).findOne({
    rotationOrder: getManagerRotationIndex(getCurrentMonth()),
  });
}