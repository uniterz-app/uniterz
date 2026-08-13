/**
 * 新リザルトカード面の共有 view-model。
 * 一覧は posts のみ（marketMeta + stats.scoreRel を settle 時に埋め込み）。
 * 詳細は任意で games.pointsSummary を足す（Top10・中央値など）。
 */
import { resolveMarketBiasFallback } from "@/lib/predict/gameMarketDistribution";
import {
  extractResultSettlementBreakdown,
  type ResultSettlementBreakdown,
} from "@/lib/result/buildResultStatRows";
import {
  resolveResultBadgeDisplay,
  type ResultBadgeDisplay,
  type ResultOutcomeOnlyBadge,
} from "@/lib/result/resultBadge";
import { resolveNbaTopScorerResultInfo } from "@/lib/result/resolveNbaTopScorerResult";
import {
  resolveResultScoreRelForPost,
  type ResultScoreRelKind,
} from "@/lib/result/resultScoreRelative";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import type { GamePointsSummaryV1 } from "@/lib/results/gamePointsSummary";
import { getTeamAlias } from "@/lib/team-alias";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { TEAM_SHORT } from "@/lib/team-short";

function toNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toUnifiedLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleUpperCase("en-US");
}

/** カード面用 — NBA はニックネームのみ（例: SPURS） */
function compactTeamDisplayName(
  leagueRaw: unknown,
  name: unknown,
  teamId: unknown
): string {
  const league = String(leagueRaw ?? "").toLowerCase();
  const id = typeof teamId === "string" ? teamId : "";
  const raw = typeof name === "string" ? name.trim() : "";

  if (league === "nba") {
    if (id) {
      const nick = getNbaTeamNicknameById(id);
      if (nick && nick !== id) return toUnifiedLabel(nick);
    }
    if (raw) {
      const [, nick] = splitTeamNameByLeague("nba", raw);
      return toUnifiedLabel(nick || raw);
    }
    return id.replace(/^nba-/i, "").toUpperCase() || "—";
  }

  if (league === "pl" && raw) {
    return toUnifiedLabel(getTeamAlias(raw) ?? raw);
  }

  if (id && TEAM_SHORT[id]) return TEAM_SHORT[id];

  if (raw) {
    if (league === "bj" || league === "j1" || league === "b1") {
      const [line1, line2] = splitTeamNameByLeague(
        league as "bj" | "j1" | "nba",
        raw
      );
      return toUnifiedLabel(`${line1} ${line2}`.trim());
    }
    return toUnifiedLabel(raw);
  }

  return id.toUpperCase() || "—";
}

function roundLabelFromPost(post: Record<string, unknown>): string {
  const seasonRound = post.seasonRound;
  if (typeof seasonRound === "string" && seasonRound.trim()) {
    return seasonRound.trim().toUpperCase();
  }
  if (typeof seasonRound === "number" && Number.isFinite(seasonRound)) {
    return `ROUND ${seasonRound}`;
  }
  const phase = post.seasonPhase;
  if (typeof phase === "string" && phase.trim()) {
    return phase.trim().toUpperCase();
  }
  return "MATCH";
}

export type ResultCardFaceMarketInput = {
  homePct?: number | null;
  awayPct?: number | null;
  homeRate?: number | null;
  awayRate?: number | null;
};

export type ResultCardFaceModel = {
  postId: string;
  gameId: string;
  league: string;
  roundLabel: string;
  homeName: string;
  awayName: string;
  homeTeamId: string;
  awayTeamId: string;
  predHome: number;
  predAway: number;
  resultHome: number | null;
  resultAway: number | null;
  marketHomePct: number;
  marketAwayPct: number;
  userPick: "home" | "away" | "draw";
  /** null = アップセット試合でない → UI は "--" */
  upsetPoints: number | null;
  totalPoints: number;
  topScorer: string | null;
  topScorerHit: boolean | null;
  winStreak: number;
  outcomeBadge: ResultOutcomeOnlyBadge;
  badges: ResultBadgeDisplay;
  scoreRel: ResultScoreRelKind;
  breakdown: ResultSettlementBreakdown;
};

function asMarketPct(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  // games.market は 0–1、marketMeta / bias は 0–100 の両方があり得る
  if (v >= 0 && v <= 1) return v * 100;
  return v;
}

function marketPctFromMajorityMeta(
  meta: Record<string, unknown> | null
): { homePct: number; awayPct: number } | null {
  if (!meta) return null;
  const side = meta.majoritySide;
  const ratioRaw = meta.majorityRatio;
  if (typeof ratioRaw !== "number" || !Number.isFinite(ratioRaw)) return null;
  if (side !== "home" && side !== "away") return null;
  const majorityPct = ratioRaw <= 1 ? ratioRaw * 100 : ratioRaw;
  const minorityPct = Math.max(0, 100 - majorityPct);
  if (side === "home") {
    return { homePct: majorityPct, awayPct: minorityPct };
  }
  return { homePct: minorityPct, awayPct: majorityPct };
}

function hasEmbeddedMarketPct(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  return (
    (typeof meta.homePct === "number" && Number.isFinite(meta.homePct)) ||
    (typeof meta.homeRate === "number" && Number.isFinite(meta.homeRate)) ||
    (typeof meta.awayPct === "number" && Number.isFinite(meta.awayPct)) ||
    (typeof meta.awayRate === "number" && Number.isFinite(meta.awayRate))
  );
}

function marketFromPost(
  post: Record<string, unknown>,
  market?: ResultCardFaceMarketInput | null
): { homePct: number; awayPct: number } {
  const meta =
    post.marketMeta !== null && typeof post.marketMeta === "object"
      ? (post.marketMeta as Record<string, unknown>)
      : null;

  const fromGame = {
    homePct: asMarketPct(market?.homePct ?? market?.homeRate),
    awayPct: asMarketPct(market?.awayPct ?? market?.awayRate),
  };
  const fromMeta = {
    homePct: asMarketPct(meta?.homePct ?? meta?.homeRate),
    awayPct: asMarketPct(meta?.awayPct ?? meta?.awayRate),
  };

  if (hasEmbeddedMarketPct(meta)) {
    return resolveMarketBiasFallback(fromMeta, fromGame);
  }

  const hasGame =
    fromGame.homePct !== undefined || fromGame.awayPct !== undefined;
  if (hasGame) {
    return resolveMarketBiasFallback(fromGame, fromMeta);
  }

  const fromMajority = marketPctFromMajorityMeta(meta);
  if (fromMajority) return fromMajority;

  return resolveMarketBiasFallback(null, null);
}

/**
 * posts（+ 任意の market / distribution / leadingScorers）からカード面を構築。
 * Firestore 追加 read はしない。
 */
export function buildResultCardFaceModel(
  post: Record<string, unknown> & { id?: string },
  options?: {
    market?: ResultCardFaceMarketInput | null;
    pointsSummary?: GamePointsSummaryV1 | null;
    leadingScorers?: unknown;
    topScorerCandidates?: unknown;
  }
): ResultCardFaceModel {
  const home =
    post.home !== null && typeof post.home === "object"
      ? (post.home as Record<string, unknown>)
      : {};
  const away =
    post.away !== null && typeof post.away === "object"
      ? (post.away as Record<string, unknown>)
      : {};
  const prediction =
    post.prediction !== null && typeof post.prediction === "object"
      ? (post.prediction as Record<string, unknown>)
      : {};
  const predScore =
    prediction.score !== null && typeof prediction.score === "object"
      ? (prediction.score as Record<string, unknown>)
      : {};
  const result =
    post.result !== null && typeof post.result === "object"
      ? (post.result as Record<string, unknown>)
      : null;
  const stats =
    post.stats !== null && typeof post.stats === "object"
      ? (post.stats as Record<string, unknown>)
      : {};
  const detail =
    stats.pointsV3Detail !== null && typeof stats.pointsV3Detail === "object"
      ? (stats.pointsV3Detail as Record<string, unknown>)
      : {};

  const breakdown = extractResultSettlementBreakdown(stats);
  const winStreak = Math.max(0, Math.round(toNum(detail.activeWinStreak)));
  const badges = resolveResultBadgeDisplay({
    stats: stats as never,
    prediction: prediction as never,
    result: result as never,
    upsetHit: Boolean(stats.upsetHit),
    isWin: stats.isWin as boolean | null | undefined,
    activeWinStreak: winStreak,
  });

  const topInfo = resolveNbaTopScorerResultInfo(post as never, {
    candidates: options?.topScorerCandidates,
    leadingScorers: options?.leadingScorers,
  });

  const marketPct = marketFromPost(post, options?.market ?? null);
  const winner = prediction.winner;
  const userPick: "home" | "away" | "draw" =
    winner === "away" || winner === "draw" || winner === "home"
      ? winner
      : "home";

  const scoreRel = resolveResultScoreRelForPost(
    stats.scoreRel,
    breakdown.totalPoints,
    options?.pointsSummary ?? null
  );

  const resultHome = result ? toNum(result.home, NaN) : NaN;
  const resultAway = result ? toNum(result.away, NaN) : NaN;

  return {
    postId: typeof post.id === "string" ? post.id : "",
    gameId: typeof post.gameId === "string" ? post.gameId : "",
    league: String(post.league ?? ""),
    roundLabel: roundLabelFromPost(post),
    homeName: compactTeamDisplayName(post.league, home.name, home.teamId),
    awayName: compactTeamDisplayName(post.league, away.name, away.teamId),
    homeTeamId: typeof home.teamId === "string" ? home.teamId : "",
    awayTeamId: typeof away.teamId === "string" ? away.teamId : "",
    predHome: toNum(predScore.home),
    predAway: toNum(predScore.away),
    resultHome: Number.isFinite(resultHome) ? resultHome : null,
    resultAway: Number.isFinite(resultAway) ? resultAway : null,
    marketHomePct: marketPct.homePct,
    marketAwayPct: marketPct.awayPct,
    userPick,
    upsetPoints: breakdown.hadUpsetGame ? breakdown.upsetPoints : null,
    totalPoints: breakdown.totalPoints,
    topScorer: topInfo?.playerName ?? null,
    topScorerHit: topInfo?.hit ?? null,
    winStreak,
    outcomeBadge: badges.outcomeBadge,
    badges,
    scoreRel,
    breakdown,
  };
}
