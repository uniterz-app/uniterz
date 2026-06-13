export function formatProfileMemberSince(
  memberSinceMs: number | null | undefined,
  _language: "ja" | "en"
): string | null {
  if (memberSinceMs == null || !Number.isFinite(memberSinceMs)) return null;
  const date = new Date(memberSinceMs);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}/${date.getMonth() + 1} join`;
}
