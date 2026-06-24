const GROUP_DESCRIPTION_MAX = 280;

export function sanitizeGroupDescription(raw: unknown): string | null {
  const s = String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!s) return null;
  const collapsed = s.replace(/\n{3,}/g, "\n\n");
  if (collapsed.length > GROUP_DESCRIPTION_MAX) {
    return collapsed.slice(0, GROUP_DESCRIPTION_MAX);
  }
  return collapsed;
}

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

export { sanitizeHeaderImagePositionY } from "./headerImagePosition";
