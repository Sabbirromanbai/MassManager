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

/** Resolves the member record for the manager assigned to the current month. */
export async function getCurrentManagerMember(): Promise<Member | null> {
  const db = await getDb();
  return db.collection<Member>(COLLECTIONS.members).findOne({
    rotationOrder: getManagerRotationIndex(getCurrentMonth()),
  });
}