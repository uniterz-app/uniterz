/**
 * NBA Roster — 予想ツールタブ用。
 * 並び: スターター優先 → MPG 降順 → GP 降順。
 */

export type NbaRosterPlayer = {
  id: number | string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber?: string | null;
  starter: boolean;
  gp: number;
  mpg: number;
  ppg: number;
  rpg?: number;
  apg?: number;
  /** 0–1（例: 0.482）または 0–100。UI は自動で % 表示 */
  fgPct?: number;
  fg3Pct?: number;
  ftPct?: number;
  /** 試投・成功（試合平均） */
  fgm?: number;
  fga?: number;
  fg3m?: number;
  fg3a?: number;
  ftm?: number;
  fta?: number;
  spg?: number;
  bpg?: number;
  tpg?: number;
  plusMinus?: number;
  /** UI で一段薄い行（深ベンチ等） */
  dimmed?: boolean;
  /** BDL active players 由来の bio（プレイヤー詳細用） */
  height?: string | null;
  weight?: string | null;
  college?: string | null;
  country?: string | null;
  draftYear?: number | null;
  draftRound?: number | null;
  draftNumber?: number | null;
  /** 2-Way 契約フラグ */
  isTwoWay?: boolean;
};

export type NbaRosterTeamBlock = {
  teamId: string;
  teamName: string;
  side: "home" | "away";
  /** 順位・シード表示用（無ければ非表示） */
  seed?: number | null;
  activeCount: number;
  rosterCount: number;
  players: NbaRosterPlayer[];
};

export type NbaRosterReport = {
  home: NbaRosterTeamBlock;
  away: NbaRosterTeamBlock;
};

export function playerCardName(player: {
  firstName: string;
  lastName: string;
  id?: number | string | null;
}): string {
  const first = player.firstName?.trim() ?? "";
  const last = player.lastName?.trim() ?? "";
  const upperFirst = first.toUpperCase();
  const upperLast = last.toUpperCase();
  const id = player.id != null ? String(player.id).trim() : "";

  // 長い定番名のみ通称（SGA / NAW）。他は C.HOLMGREN 形式
  if (id === "175") return "SGA";
  if (id === "666400") return "NAW";
  if (
    (upperFirst === "SHAI" && upperLast.includes("GILGEOUS-ALEXANDER")) ||
    upperLast === "GILGEOUS-ALEXANDER" ||
    (upperFirst === "SHAI" && upperLast === "ALEXANDER")
  ) {
    return "SGA";
  }
  if (
    (upperFirst === "NICKEIL" && upperLast.includes("ALEXANDER-WALKER")) ||
    upperLast === "ALEXANDER-WALKER"
  ) {
    return "NAW";
  }

  if (first && last) {
    return `${first.charAt(0).toUpperCase()}.${last.toUpperCase()}`;
  }
  return (last || first || "—").toUpperCase();
}

/** スターター → MPG → GP */
export function sortRosterPlayers(
  players: NbaRosterPlayer[]
): NbaRosterPlayer[] {
  return [...players].sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    if (b.mpg !== a.mpg) return b.mpg - a.mpg;
    if (b.gp !== a.gp) return b.gp - a.gp;
    return playerCardName(a).localeCompare(playerCardName(b));
  });
}
