import { getUniterzApiBaseUrl } from "../features/games/submitPredictionApi";

/** Web の `/public/...` 相対パスを RN の Image 用絶対 URL に変換 */
export function resolveUniterzAssetUrl(
  path: string | undefined | null
): string | undefined {
  if (!path?.trim()) return undefined;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (getUniterzApiBaseUrl() || "https://uniterz.app").replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}
