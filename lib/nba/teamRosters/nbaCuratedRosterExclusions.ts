/**
 * ロスター／チームペイロールから外す選手（BDL active に残っている引退・誤所属など）。
 * seasonKey 単位。該当シーズンの名簿・年俸合算に載せない。
 */
export const NBA_CURATED_ROSTER_EXCLUSIONS: Readonly<
  Record<string, readonly string[]>
> = {
  /** 2026-09-21 引退。LAC が 2026-27 オプション非行使 → FA 後引退。BDL は LAC に残留 */
  "2026-27": ["33"], // Nicolas Batum
};

export function isCuratedRosterExcluded(
  seasonKey: string,
  playerId: string
): boolean {
  const id = String(playerId ?? "").trim();
  if (!id) return false;
  const list = NBA_CURATED_ROSTER_EXCLUSIONS[seasonKey.trim()];
  if (!list?.length) return false;
  return list.includes(id);
}

export function filterCuratedRosterExcludedPlayers<
  T extends { id?: string | number }
>(seasonKey: string, players: readonly T[]): T[] {
  return players.filter(
    (p) => !isCuratedRosterExcluded(seasonKey, String(p.id ?? ""))
  );
}
