import { resolvePostListLeague } from "@/lib/leagues";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import {
  isGameWcStage,
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";

/** プロフィールで表示する連勝の集計単位 */
export type ProfileStreakScopeKey =
  | "nba:playoffs"
  | "wc:overall"
  | "wc:qualifying"
  | "wc:main";

export type ProfileStatsStreakContext = {
  rankingLeague: RankingLeagueSource;
  wcStage?: WcRankingStage;
};

export function resolveProfileStreakScopeKey(
  ctx: ProfileStatsStreakContext
): ProfileStreakScopeKey {
  if (ctx.rankingLeague === "nba") return "nba:playoffs";
  const stage =
    ctx.wcStage && isWcRankingStage(ctx.wcStage) ? ctx.wcStage : "overall";
  if (stage === "qualifying") return "wc:qualifying";
  if (stage === "main") return "wc:main";
  return "wc:overall";
}

export type SettledPostStreakInput = {
  league?: unknown;
  gameId?: unknown;
  seasonPhase?: unknown;
  wcStage?: unknown;
};

function normalizeSeasonPhase(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "play_in" || s === "playoffs" || s === "regular") return s;
  return null;
}

/**
 * NBA プレーオフ連勝: playoffs のみ。seasonPhase 未設定の旧データは
 * play_in / regular が明示されていなければプレーオフ扱い（当時はプレーオフ期の投稿想定）。
 */
function matchesNbaPlayoffsStreak(post: SettledPostStreakInput): boolean {
  if (
    resolvePostListLeague({ league: post.league, gameId: post.gameId }) !== "nba"
  ) {
    return false;
  }
  const phase = normalizeSeasonPhase(post.seasonPhase);
  if (phase === "playoffs") return true;
  if (phase === "play_in" || phase === "regular") return false;
  return true;
}

/** 確定済み投稿が指定スコープに含まれるか */
export function postMatchesProfileStreakScope(
  post: SettledPostStreakInput,
  scope: ProfileStreakScopeKey
): boolean {
  const league = resolvePostListLeague({
    league: post.league,
    gameId: post.gameId,
  });
  if (scope === "nba:playoffs") {
    return matchesNbaPlayoffsStreak(post);
  }
  if (league !== "wc") return false;
  const gameStage = post.wcStage;
  if (scope === "wc:overall") return true;
  if (scope === "wc:qualifying") {
    return isGameWcStage(gameStage) && gameStage === "qualifying";
  }
  if (scope === "wc:main") {
    return isGameWcStage(gameStage) && gameStage === "main";
  }
  return false;
}

/** 先読み・キャッシュ用にプロフィールで使う全スコープ */
export const PROFILE_STREAK_SCOPE_KEYS: ProfileStreakScopeKey[] = [
  "nba:playoffs",
  "wc:overall",
  "wc:qualifying",
  "wc:main",
];
