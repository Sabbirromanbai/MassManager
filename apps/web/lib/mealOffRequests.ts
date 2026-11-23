import type {
  MealOffDecision,
  MealOffRequest,
  MealOffRequestStatus,
} from "./models";

export interface MealOffRequestView {
  id: string;
  memberId: string;
  month: string;
  date: number;
  status: MealOffRequestStatus;
  decision: MealOffDecision | null;
  decidedBy: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  createdAt: string;
}

/**
 * Older records used `done` for an approved request. Normalize at the boundary
 * so the rest of the app only deals with the three documented statuses.
 */
export function normalizeMealOffStatus(
  status: MealOffRequest["status"] | string
): MealOffRequestStatus {
  if (status === "approved" || status === "rejected") return status;
  if (status === "done") return "approved";
  return "pending";
}

/** Only pending and approved requests are shown as off on the Meal Board. */
export function isMealOffVisible(
  status: MealOffRequest["status"] | string
): boolean {
  const normalized = normalizeMealOffStatus(status);
  return normalized === "pending" || normalized === "approved";
}

export function isMealOffApproved(
  status: MealOffRequest["status"] | string
): boolean {
  return normalizeMealOffStatus(status) === "approved";
}

function toIsoString(value: Date | string | undefined | null): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function serializeMealOffRequest(
  request: MealOffRequest
): MealOffRequestView {
  const status = normalizeMealOffStatus(request.status);
  const decision =
    request.decision ?? (status === "approved" ? "approved" : null);

  return {
    id: request._id?.toString() ?? "",
    memberId: request.memberId.toString(),
    month: request.month,
    date: request.date,
    status,
    decision: decision === "rejected" ? "rejected" : decision === "approved" ? "approved" : null,
    decidedBy: request.decidedBy?.toString() ?? null,
    decidedByName: request.decidedByName ?? null,
    decidedAt: toIsoString(request.decidedAt) || null,
    createdAt: toIsoString(request.createdAt),
  };
}
