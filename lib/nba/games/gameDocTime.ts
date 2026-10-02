import { Timestamp } from "firebase-admin/firestore";

export function gameStartMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

export function isUpcomingNbaGameDoc(
  data: Record<string, unknown>,
  nowMs: number
): boolean {
  const status = String(data.status ?? "").toLowerCase();
  if (
    data.final === true ||
    status === "final" ||
    status === "ended" ||
    status === "live"
  ) {
    return false;
  }
  const tip = gameStartMs(data.startAtJst);
  return tip != null && tip > nowMs;
}
