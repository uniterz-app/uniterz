import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { buildTeamContextsFromRecord } from "@/lib/predict/buildTeamContextsFromRecord";
import {
  MIN_TEAM_PERSONAL_POSTS,
  type PredictTeamIntel,
  type PredictTeamPersonal,
} from "@/lib/predict/predictTeamIntel";

const MIN_PATTERN_POSTS = 8;
const AWAY_GAP = 0.1;

/** 下段の自分パターン行（試合の 2 チームに紐づかない自己傾向） */
export type PredictSelfPatternId = "awayWeak" | "underdogStrong" | null;

export type PredictSelfPattern = {
  id: Exclude<PredictSelfPatternId, null>;
  params: Record<string, string | number>;
};

/** 予想投稿から集計した、大会/リーグ単位の自分の傾向 */
export type PredictSelfStats = {
  raw: { posts: number; wins: number };
  homeAway: {
    home: { posts: number; wins: number };
    away: { posts: number; wins: number };
  };
  market: {
    underdogPickCount: number;
    underdogWins: number;
  };
  /** 自分が勝者に選んだチーム別（teamId → 母数/的中） */
  teams: Record<string, { posts: number; wins: number }>;
};

export type PredictProInfoInput = {
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeRecord?: MatchCardProps["homeRecord"];
  awayRecord?: MatchCardProps["awayRecord"];
  stats: PredictSelfStats | null;
  globalAvgWinRate?: number | null;
};

export type PredictProInfo = {
  tournamentAvgWinRate: number;
  homeIntel: PredictTeamIntel;
  awayIntel: PredictTeamIntel;
  selfPattern: PredictSelfPattern | null;
};

function findTeamPersonal(
  teamId: string | undefined,
  stats: PredictSelfStats | null
): PredictTeamPersonal | null {
  if (!teamId || !stats) return null;
  const bucket = stats.teams[teamId];
  if (!bucket || bucket.posts <= 0) return null;
  return { posts: bucket.posts, wins: bucket.wins };
}

function buildTeamIntel(input: {
  teamId?: string;
  teamName: string;
  side: "home" | "away";
  record?: MatchCardProps["homeRecord"];
  stats: PredictSelfStats | null;
}): PredictTeamIntel {
  const personal = findTeamPersonal(input.teamId, input.stats);
  const contexts = buildTeamContextsFromRecord({
    lastGames: input.record?.lastGames,
  });

  return {
    teamId: input.teamId ?? input.side,
    teamName: input.teamName,
    side: input.side,
    personal,
    contexts,
  };
}

function rate(bucket: { posts: number; wins: number }): number | null {
  if (bucket.posts <= 0) return null;
  return bucket.wins / bucket.posts;
}

function buildSelfPattern(
  stats: PredictSelfStats | null
): PredictSelfPattern | null {
  if (!stats) return null;

  const overall = rate(stats.raw);
  const away = stats.homeAway.away;
  const awayRate = rate(away);
  if (
    overall != null &&
    awayRate != null &&
    away.posts >= MIN_PATTERN_POSTS &&
    awayRate <= overall - AWAY_GAP
  ) {
    return {
      id: "awayWeak",
      params: { userPct: Math.round(awayRate * 100) },
    };
  }

  const picks = stats.market.underdogPickCount;
  const underdogRate = rate({
    posts: picks,
    wins: stats.market.underdogWins,
  });
  if (
    picks >= MIN_PATTERN_POSTS &&
    underdogRate != null &&
    overall != null &&
    underdogRate > overall + 0.05
  ) {
    return {
      id: "underdogStrong",
      params: { hits: stats.market.underdogWins, picks },
    };
  }

  return null;
}

/** 予想投稿の集計 + 試合カードの戦績から Pro Info パネル用データを組み立てる */
export function buildPredictProInfo(
  input: PredictProInfoInput
): PredictProInfo {
  const tournamentAvgWinRate = input.globalAvgWinRate ?? 0.5;

  return {
    tournamentAvgWinRate,
    homeIntel: buildTeamIntel({
      teamId: input.homeTeamId,
      teamName: input.homeTeamName,
      side: "home",
      record: input.homeRecord,
      stats: input.stats,
    }),
    awayIntel: buildTeamIntel({
      teamId: input.awayTeamId,
      teamName: input.awayTeamName,
      side: "away",
      record: input.awayRecord,
      stats: input.stats,
    }),
    selfPattern: buildSelfPattern(input.stats),
  };
}

export { MIN_TEAM_PERSONAL_POSTS };
