/**
 * Insight 用キー選手（エース欠場 W–L）。
 * auto（leaders PPG）に加え、必ず集計する選手。
 * `preferAsAce: true` はそのチームの主エース表示を上書き。
 */
export type NbaAceOutCuratedPlayer = {
  playerId: string;
  playerName: string;
  /** true → チームの主エース欄をこの選手にする */
  preferAsAce?: boolean;
};

/** teamId → 追加 / 上書きする選手 */
export const NBA_ACE_OUT_CURATED_BY_TEAM: Readonly<
  Record<string, readonly NbaAceOutCuratedPlayer[]>
> = {
  "nba-warriors": [
    { playerId: "115", playerName: "Stephen Curry", preferAsAce: true },
  ],
  "nba-76ers": [{ playerId: "145", playerName: "Joel Embiid" }],
  "nba-raptors": [
    { playerId: "17896055", playerName: "Scottie Barnes", preferAsAce: true },
  ],
  "nba-magic": [{ playerId: "17896026", playerName: "Franz Wagner" }],
  "nba-heat": [{ playerId: "4", playerName: "Bam Adebayo" }],
  "nba-pelicans": [{ playerId: "666969", playerName: "Zion Williamson" }],
  "nba-jazz": [{ playerId: "297", playerName: "Lauri Markkanen" }],
  "nba-nuggets": [
    { playerId: "246", playerName: "Nikola Jokic", preferAsAce: true },
  ],
};
