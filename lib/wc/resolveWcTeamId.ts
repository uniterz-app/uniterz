import { lookupWcTeamIdByCountryName } from "@/lib/wc/wcCountry";

/** "wc-JPN" / "jpn" / "wc-jpn" を "wc-jpn" に正規化 */
export function normalizeWcTeamId(
  raw: string | null | undefined
): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (t.startsWith("wc-")) return `wc-${t.slice(3).toLowerCase()}`;
  if (/^[a-z]{3}$/i.test(t)) return `wc-${t.toLowerCase()}`;
  return null;
}

type WcSideLike = {
  teamId?: string | null;
  name?: string | null;
} | null | undefined;

/** WC 順位・国旗用 teamId（side.teamId → レガシー ID → 国名） */
export function resolveWcTeamId(
  side: WcSideLike,
  ...legacyIds: Array<string | null | undefined>
): string | null {
  const fromSide = normalizeWcTeamId(side?.teamId);
  if (fromSide) return fromSide;

  for (const id of legacyIds) {
    const normalized = normalizeWcTeamId(id);
    if (normalized) return normalized;
    const fromLegacyName = lookupWcTeamIdByCountryName(id);
    if (fromLegacyName) return fromLegacyName;
  }

  return lookupWcTeamIdByCountryName(side?.name);
}
