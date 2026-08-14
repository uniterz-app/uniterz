import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";

function pickCountry(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return code ? code : null;
}

/** users.countryCode を得点上位行へ載せる（試合得点データはそのまま） */
export function mergeCountryIntoTopEntries(
  top: readonly GamePointsTopEntryV1[],
  countryByUid: ReadonlyMap<string, string | null>
): GamePointsTopEntryV1[] {
  return top.map((row) => {
    if (row.countryCode) return { ...row };
    const uid = row.uid?.trim();
    if (!uid) return { ...row };
    const code = pickCountry(countryByUid.get(uid));
    if (!code) return { ...row };
    return { ...row, countryCode: code };
  });
}

export { pickCountry as pickCountryCodeFromUserDoc };
