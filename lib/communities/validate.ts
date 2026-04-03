export function sanitizeHeaderImageUrl(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.length > 2000) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    return s;
  } catch {
    return null;
  }
}
