/**
 * Bangladesh mobile helpers for WhatsApp numbers.
 *
 * Accepted inputs (spaces/dashes are ignored):
 *   01712345678       -> 8801712345678
 *   +8801712345678    -> 8801712345678
 *   8801712345678     -> 8801712345678
 *   008801712345678   -> 8801712345678
 *
 * Stored/returned form is digits only: 880 + a 10-digit mobile starting with 1.
 */
export function normalizeBangladeshMobile(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("880")) {
    // Already in international form.
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = `88${digits}`;
  } else if (/^1\d{9}$/.test(digits)) {
    digits = `880${digits}`;
  } else {
    return null;
  }

  return /^8801\d{9}$/.test(digits) ? digits : null;
}

/** Human-readable form used in the UI, e.g. +880 1712-345678. */
export function formatBangladeshMobile(digits: string): string {
  const normalized = normalizeBangladeshMobile(digits);
  if (!normalized) return digits;
  return `+${normalized.slice(0, 3)} ${normalized.slice(3, 7)}-${normalized.slice(7)}`;
}
