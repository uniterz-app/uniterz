/**
 * 選手欠場の影響（点）。Firestore `nbaPlayerOutImpact/{seasonKey}`。
 * players のキーは `${teamId}:${playerId}`（同じ選手でも移籍前後は別行）。
 */
export type NbaPlayerOutImpact = {
  playerId: string;
  playerName: string;
  teamId: string;
  /** そのチームでの出場試合 */
  games: number;
  mpg: number;
  ppg: number;
  /** 初出場〜最終出場の間に欠場した試合（長期離脱前後は数えない） */
  gamesOut: number;
  /** スタッツからの目安（点） */
  statPrior: number;
  /** 目安 + 個人差（点）。負 = 欠場でチームの 1 試合得失点差が下がる */
  impact: number;
};

export type NbaPlayerOutImpactBundle = {
  seasonKey: string;
  players: Record<string, NbaPlayerOutImpact>;
  gameCount: number;
  /** teamId → そのシーズンの消化試合（レギュラー final）。players[].games と同じ時点 */
  teamGames: Record<string, number>;
  homeCourt: number;
  lambda: number;
  builtAtMs: number;
  source: string;
};

export const NBA_PLAYER_OUT_IMPACT_COLLECTION = "nbaPlayerOutImpact";

export function playerOutImpactKey(teamId: string, playerId: string): string {
  return `${teamId}:${playerId}`;
}
