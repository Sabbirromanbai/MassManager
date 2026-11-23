import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { getOrLinkMember, isCurrentManagerMember } from "./currentMember";
import type { Member } from "./models";

export type ManagerAuthResult =
  | { status: "ok"; member: Member }
  | { status: "unauthorized" }
  | { status: "forbidden" };

/**
 * All office-loan endpoints go through here: an authenticated, linked member
 * who is the manager for the current rotation month. No member-facing path
 * exists for these records.
 */
export async function requireCurrentManager(): Promise<ManagerAuthResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { status: "unauthorized" };

  const member = await getOrLinkMember({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email ?? "",
  });

  if (!member) return { status: "unauthorized" };
  if (!isCurrentManagerMember(member)) return { status: "forbidden" };

  return { status: "ok", member };
}

export function managerAuthErrorResponse(
  result: Exclude<ManagerAuthResult, { status: "ok" }>
): NextResponse {
  const unauthorized = result.status === "unauthorized";
  return NextResponse.json(
    {
      error: unauthorized
        ? "Unauthorized"
        : "Only the current manager can manage office loans",
    },
    { status: unauthorized ? 401 : 403 }
  );
}
