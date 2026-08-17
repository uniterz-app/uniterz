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
  /** UI で一段薄い行（深ベンチ等） */
  dimmed?: boolean;
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
}): string {
  const first = player.firstName?.trim() ?? "";
  const last = player.lastName?.trim() ?? "";
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
