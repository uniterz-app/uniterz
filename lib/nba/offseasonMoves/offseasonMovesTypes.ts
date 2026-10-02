/**
 * チーム詳細 OFFSEASON MOVES（IN / OUT）。
 *
 * 前季の最終所属（BDL box の最終試合チーム）と今季ロスタースナップショットの差分。
 * BDL にトランザクション API が無いため、トレードと FA は区別しない。
 */

/** Firestore `nbaPlayerSeasonFinalTeams/{seasonKey}` */
export const NBA_PLAYER_SEASON_FINAL_TEAMS_COLLECTION =
  "nbaPlayerSeasonFinalTeams";

/** Firestore `nbaTeamOffseasonMoves/{seasonKey}` */
export const NBA_TEAM_OFFSEASON_MOVES_COLLECTION = "nbaTeamOffseasonMoves";

export type NbaPlayerSeasonFinalTeam = {
  teamId: string;
  firstName: string;
  lastName: string;
  lastGameDate: string | null;
};

export type NbaPlayerSeasonFinalTeamsDoc = {
  seasonKey: string;
  players: Record<string, NbaPlayerSeasonFinalTeam>;
  playerCount: number;
};

/**
 * IN: draft（今季ドラフト）/ acquired（他球団から）/ signed（前季 NBA 出場なし）
 * OUT: departed（他球団へ）/ waived（curated デッドあり）/ unsigned（どのロスターにもいない）
 */
export type NbaOffseasonMoveKind =
  | "draft"
  | "acquired"
  | "signed"
  | "departed"
  | "waived"
  | "unsigned";

export type NbaOffseasonMove = {
  playerId: string;
  firstName: string;
  lastName: string;
  kind: NbaOffseasonMoveKind;
  /** IN なら移籍元、OUT なら移籍先 */
  otherTeamId: string | null;
  draftRound: number | null;
  draftNumber: number | null;
  isTwoWay: boolean;
  /** 今季キャップヒット（加入先 / 移籍先の payroll 行） */
  salary: number | null;
};

export type NbaTeamOffseasonMoves = {
  seasonKey: string;
  priorSeasonKey: string;
  incoming: NbaOffseasonMove[];
  outgoing: NbaOffseasonMove[];
};

export type NbaTeamOffseasonMovesDoc = {
  seasonKey: string;
  priorSeasonKey: string;
  teams: Record<
    string,
    { incoming: NbaOffseasonMove[]; outgoing: NbaOffseasonMove[] }
  >;
};
