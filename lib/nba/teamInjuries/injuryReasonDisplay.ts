/**
 * Injury reason from BDL ingest is English-only today.
 * JA UI hides it until `reasonJa` exists on the snapshot.
 */
export function availabilityReasonDisplay(
  reason: string | null | undefined,
  isJa: boolean
): string | null {
  const trimmed = reason?.trim();
  if (!trimmed) {
    return isJa ? "詳細なし" : "No detail";
  }
  if (isJa) return null;
  return trimmed;
}
