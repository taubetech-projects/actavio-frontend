import type { AirtableAttachment } from "@/types/airtable";

// Matches E.164, North American (xxx) xxx-xxxx, international +xx xxx, etc.
// Must NOT match plain numbers like "42" or years like "2024".
const PHONE_REGEX =
  /^[+]?[(]?[\d]{1,4}[)]?[-\s.]?[(]?[\d]{1,4}[)]?[-\s.]?[\d]{4,10}[-\s.]?(?:x[\d]{1,9})?$/;

export function isPhoneNumber(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  return digitCount >= 7 && digitCount <= 15 && PHONE_REGEX.test(trimmed);
}

// Column-name heuristic: fields named "phone", "mobile", etc. with 7+ digits.
export function isPhoneByColumnName(columnName: string, value: unknown): value is string {
  if (typeof value !== "string") return false;
  const nameLower = columnName.toLowerCase();
  const isPhoneColumn = ["phone", "mobile", "cell", "tel", "contact", "fax"].some((k) =>
    nameLower.includes(k)
  );
  if (!isPhoneColumn) return false;
  const digitCount = (value.match(/\d/g) ?? []).length;
  return digitCount >= 7;
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function isAttachment(value: unknown): value is AirtableAttachment {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "filename" in value
  );
}
