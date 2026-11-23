import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { updateMemberWhatsappSchema } from "@/lib/schemas";
import { normalizeBangladeshMobile } from "@/lib/phone";
import { COLLECTIONS, Member } from "@/lib/models";

async function getSessionMember(): Promise<Member | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return getOrLinkMember({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email ?? "",
  });
}

/** Manager-only. Adds, edits or clears one member's WhatsApp number. */
export async function PATCH(request: NextRequest) {
  try {
    const manager = await getSessionMember();
    if (!manager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isCurrentManagerMember(manager)) {
      return NextResponse.json(
        { error: "Only the current manager can edit WhatsApp numbers" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const validation = updateMemberWhatsappSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { memberId, whatsappNumber } = validation.data;
    const normalized =
      whatsappNumber === ""
        ? null
        : normalizeBangladeshMobile(whatsappNumber);
    if (whatsappNumber !== "" && !normalized) {
      return NextResponse.json(
        { error: "Invalid Bangladesh mobile number" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const members = db.collection<Member>(COLLECTIONS.members);
    const targetId = new ObjectId(memberId);
    const target = await members.findOne({ _id: targetId });
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await members.updateOne(
      { _id: targetId },
      { $set: { whatsappNumber: normalized } }
    );

    return NextResponse.json({ success: true, memberId, whatsappNumber: normalized });
  } catch {
    return NextResponse.json(
      { error: "Failed to update WhatsApp number" },
      { status: 500 }
    );
  }
}
