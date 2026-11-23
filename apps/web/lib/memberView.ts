import type { Member } from "./models";

/** Member fields safe to serialize to any signed-in dashboard client. */
export type PublicMemberView = Omit<Member, "whatsappNumber">;

/**
 * Whitelist instead of spreading the document: a newly added sensitive field
 * (such as whatsappNumber) can never leak into client props by accident.
 */
export function toPublicMember(member: Member): PublicMemberView {
  return {
    _id: member._id?.toString(),
    userId: member.userId,
    email: member.email,
    name: member.name,
    type: member.type,
    isActive: member.isActive,
    rotationOrder: member.rotationOrder,
    createdAt: member.createdAt,
  };
}
