/**
 * トレード予想バレット — みんなの予想（マーケット）型。
 * 配点は未接続。投票率の公開用スナップショットだけ。
 */
export type NbaTradeBallotMarketDestRow = {
  teamId: string;
  teamAbbr: string;
  pct: number;
  picks: number;
};

export type NbaTradeBallotMarketPlayerRow = {
  playerId: string;
  name: string;
  /** 今の所属 */
  fromTeamAbbr: string | null;
  /** バレットに入っている割合（7 枠のうちどれかに選ばれた提出の割合） */
  pct: number;
  picks: number;
  /** その選手が選ばれたときの行き先 Top */
  destinations: readonly NbaTradeBallotMarketDestRow[];
};

export type NbaTradeBallotMarketSnapshot = {
  season: string;
  submissionCount: number;
  builtAtMs: number;
  /** 移籍予想として多く選ばれた選手（上位） */
  players: readonly NbaTradeBallotMarketPlayerRow[];
};

export type NbaTradeBallotMineMarketPick = {
  playerId: string;
  name: string;
  fromTeamAbbr: string | null;
  toTeamId: string;
  toTeamAbbr: string;
  /** マーケット上の選手順位（1-based）。圏外は null */
  playerRank: number | null;
  playerPct: number | null;
};
