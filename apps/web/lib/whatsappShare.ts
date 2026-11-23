import { normalizeBangladeshMobile } from "./phone";

export interface WhatsappSummaryValues {
  memberName: string;
  month: string;
  meals: string;
  averageRate: string;
  mealCost: string;
  advance: string;
  due: string;
}

/** Returns null when the member has no valid Bangladesh mobile number. */
export function buildWhatsappLink(
  number: string | null | undefined,
  text: string
): string | null {
  const digits = number ? normalizeBangladeshMobile(number) : null;
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Fills the localized template; values are already formatted by the report. */
export function buildWhatsappSummary(
  template: string,
  values: WhatsappSummaryValues
): string {
  return template
    .replace("{memberName}", values.memberName)
    .replace("{month}", values.month)
    .replace("{meals}", values.meals)
    .replace("{averageRate}", values.averageRate)
    .replace("{mealCost}", values.mealCost)
    .replace("{advance}", values.advance)
    .replace("{due}", values.due);
}

export function buildReportFileName(memberName: string, month: string): string {
  const safeName =
    memberName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") ||
    "member";
  return `monthly-report-${safeName}-${month}.pdf`;
}
