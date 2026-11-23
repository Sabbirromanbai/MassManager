import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "./auth";
import { getOrLinkMember } from "./currentMember";
import type { Member } from "./models";

export type NotificationAuthResult =
  | { status: "ok"; member: Member; memberId: ObjectId; userId: string }
  | { status: "unauthorized" };

function toObjectId(value: Member["_id"]): ObjectId | null {
  if (!value) return null;
  return value instanceof ObjectId ? value : new ObjectId(value.toString());
}

/** Every notification endpoint resolves the linked member for the session. */
export async function requireNotificationUser(): Promise<NotificationAuthResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { status: "unauthorized" };

  const member = await getOrLinkMember({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email ?? "",
  });

  const memberId = member ? toObjectId(member._id) : null;
  if (!member || !memberId) return { status: "unauthorized" };

  return { status: "ok", member, memberId, userId: session.user.id };
}

export function notificationAuthErrorResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
