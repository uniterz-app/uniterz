// lib/teamRecordDisplay.ts
//
// 試合カード等のチーム戦績行（NBA: W-L、フットボール: W-D-L）

import { normalizeLeague } from "./leagues";

export type TeamRecordLine = {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
};

export function isFootballLeague(raw: unknown): boolean {
  const league = normalizeLeague(raw);
  return league === "wc" || league === "pl" || league === "j1";
}

/** teams ドキュメントからフットボールの勝敗分 */
export function footballWinsLossesDraws(data: {
  wins?: unknown;
  losses?: unknown;
  draws?: unknown;
  d?: unknown;
}): { wins: number; losses: number; draws: number } {
  return {
    wins: Number(data.wins ?? 0),
    losses: Number(data.losses ?? 0),
    draws: Number(data.draws ?? data.d ?? 0),
  };
}

export function formatTeamRecordWithRank(
  record: TeamRecordLine | null | undefined,
  league: unknown,
): string {
  const football = isFootballLeague(league);

  if (!record) {
    return football ? "(0-0-0)" : "(0-0)";
  }

  const wins = Number(record.wins ?? 0);
  const losses = Number(record.losses ?? 0);
  const draws = Number(record.draws ?? 0);
  const core = football
    ? `(${wins}-${draws}-${losses})`
    : `(${wins}-${losses})`;

  const rank = record.rank;
  if (rank == null || !Number.isFinite(rank) || rank <= 0) {
    return core;
  }

  const r = Math.trunc(rank);
  return `${core}:${r}${ordinalEn(r)}`;
}

function ordinalEn(n: number): string {
  const v = Math.abs(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = v % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}
