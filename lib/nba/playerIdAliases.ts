/**
 * BDL でロスター用 ID と契約用 ID が食い違う選手の同一視。
 * payroll 突合・player-contracts 読み書きで共有する。
 */
export const NBA_PLAYER_ID_ALIASES: ReadonlyArray<ReadonlySet<string>> = [
  new Set(["38017706", "1028257789"]), // Jaylin Williams
  new Set(["344", "1093972577"]), // Georges Niang
  new Set(["24489167", "1145"]), // Brandon Williams
];

export function playerIdsAreAliases(a: string, b: string): boolean {
  const x = String(a ?? "").trim();
  const y = String(b ?? "").trim();
  if (!x || !y || x === y) return false;
  return NBA_PLAYER_ID_ALIASES.some((set) => set.has(x) && set.has(y));
}

/** 自分自身 + エイリアス（契約 lookup / 二重書き込み用） */
export function playerIdLookupSet(playerId: string): string[] {
  const id = String(playerId ?? "").trim();
  if (!id) return [];
  for (const set of NBA_PLAYER_ID_ALIASES) {
    if (set.has(id)) return [...set];
  }
  return [id];
}

/** ロスター側に存在する ID があればそれを優先（詳細リンク用） */
export function preferRosterPlayerId(
  contractPlayerId: string,
  rosterPlayerIds: ReadonlySet<string>
): string {
  const id = String(contractPlayerId ?? "").trim();
  if (!id) return id;
  if (rosterPlayerIds.has(id)) return id;
  for (const alt of playerIdLookupSet(id)) {
    if (rosterPlayerIds.has(alt)) return alt;
  }
  return id;
}
