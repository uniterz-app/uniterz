import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { isRankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { isPlayoffRoundKey } from "@/lib/rankings/playoffRound";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

/** プロフィール URL：ランキングから来た印 */
export const PROFILE_FROM_PARAM = "from";
export const PROFILE_FROM_RANKINGS_VALUE = "rankings";
export const PROFILE_FROM_COMMUNITY_VALUE = "community";
export const PROFILE_FROM_COMMUNITY_ID_PARAM = "communityId";

/** 戻り時に同じタブを復元するためのクエリキー */
export const RANKINGS_TAB_METRIC_PARAM = "rankMetric";
export const RANKINGS_TAB_PHASE_PARAM = "rankPhase";
/** プレーオフ 1ST / 2ND など（overall = TOTAL） */
export const RANKINGS_TAB_ROUND_PARAM = "rankRound";
/** NBA / WORLD CUP のリーグソース */
export const RANKINGS_TAB_LEAGUE_PARAM = "rankLeague";
/** WORLD CUP のステージ（overall/qualifying/main） */
export const RANKINGS_TAB_WC_STAGE_PARAM = "rankWcStage";

const SESSION_KEY = "uniterz.rankingsTabReturn.v1";

const METRIC_SET: ReadonlySet<MobileMetric> = new Set([
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
  "goalScorerHits",
]);

export function isMobileMetricParam(
  v: string | null | undefined
): v is MobileMetric {
  return typeof v === "string" && METRIC_SET.has(v as MobileMetric);
}

/** ランキング→プロフィール遷移の直前に呼ぶ（ブラウザ戻るでクエリが無い場合の復元用） */
export function stashRankingsTabForReturn(
  metric: MobileMetric,
  phase: RankingPhase,
  playoffRound?: PlayoffRoundKey
): void {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ metric, phase, playoffRound })
    );
  } catch {
    /* ストレージ不可時は無視 */
  }
}

/** Web ランキングのスクロール位置（戻るリンクで復元） */
export const WEB_RANKINGS_SCROLL_KEY = "uniterz.webRankings.scrollY.v1";

/** 一度だけ読み取り、キーを削除する */
export function consumeStashedRankingsTab(): {
  metric: MobileMetric;
  phase: RankingPhase;
  playoffRound?: PlayoffRoundKey;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    const o = JSON.parse(raw) as {
      metric?: string;
      phase?: string;
      playoffRound?: string;
    };
    if (!isMobileMetricParam(o.metric) || !isRankingPhase(o.phase)) return null;
    const playoffRound =
      o.playoffRound && isPlayoffRoundKey(o.playoffRound)
        ? o.playoffRound
        : undefined;
    return { metric: o.metric, phase: o.phase, playoffRound };
  } catch {
    return null;
  }
}

export type RankingsReturnTab = {
  metric: MobileMetric;
  phase: RankingPhase;
  /** プレーオフランキングのラウンドタブ（TOTAL / 1ST / …） */
  playoffRound?: PlayoffRoundKey;
  /** ランキングのリーグソース（NBA / WORLD CUP） */
  rankingLeague?: RankingLeagueSource;
  /** WORLD CUP ステージ（overall / qualifying / main） */
  wcStage?: WcRankingStage;
};

/**
 * ランキング画面からのみ、プロフィール URL に from=rankings と現在の指標・フェーズを付与。
 */
export function profileHrefWithRankingsReturn(
  pathname: string | null | undefined,
  base: string,
  handleOrUid: string,
  tab: RankingsReturnTab
): string {
  const path = `${base}/u/${handleOrUid}`;
  const p = pathname ?? "";
  const communityMatch = p.match(/\/(?:web|mobile)\/communities\/([^/?#]+)/);
  const communityId = communityMatch?.[1]
    ? decodeURIComponent(communityMatch[1])
    : "";
  if (communityId) {
    const q = new URLSearchParams({
      [PROFILE_FROM_PARAM]: PROFILE_FROM_COMMUNITY_VALUE,
      [PROFILE_FROM_COMMUNITY_ID_PARAM]: communityId,
    });
    return `${path}?${q.toString()}`;
  }
  if (!p.includes("/rankings")) return path;
  const q = new URLSearchParams({
    [PROFILE_FROM_PARAM]: PROFILE_FROM_RANKINGS_VALUE,
    [RANKINGS_TAB_METRIC_PARAM]: tab.metric,
    [RANKINGS_TAB_PHASE_PARAM]: tab.phase,
  });
  if (tab.playoffRound && isPlayoffRoundKey(tab.playoffRound)) {
    q.set(RANKINGS_TAB_ROUND_PARAM, tab.playoffRound);
  }
  if (tab.rankingLeague && isRankingLeagueSource(tab.rankingLeague)) {
    q.set(RANKINGS_TAB_LEAGUE_PARAM, tab.rankingLeague);
  }
  if (tab.wcStage && isWcRankingStage(tab.wcStage)) {
    q.set(RANKINGS_TAB_WC_STAGE_PARAM, tab.wcStage);
  }
  return `${path}?${q.toString()}`;
}

/** ランキングページ用：`/rankings?...` のクエリ文字列（先頭の ? は含まない） */
export function buildRankingsPathQuery(sp: URLSearchParams): string {
  const m = sp.get(RANKINGS_TAB_METRIC_PARAM);
  const ph = sp.get(RANKINGS_TAB_PHASE_PARAM);
  const r = sp.get(RANKINGS_TAB_ROUND_PARAM);
  const league = sp.get(RANKINGS_TAB_LEAGUE_PARAM);
  const wcStage = sp.get(RANKINGS_TAB_WC_STAGE_PARAM);
  const q = new URLSearchParams();
  if (isMobileMetricParam(m)) q.set(RANKINGS_TAB_METRIC_PARAM, m);
  if (isRankingPhase(ph)) q.set(RANKINGS_TAB_PHASE_PARAM, ph);
  if (isPlayoffRoundKey(r)) q.set(RANKINGS_TAB_ROUND_PARAM, r);
  if (isRankingLeagueSource(league)) q.set(RANKINGS_TAB_LEAGUE_PARAM, league);
  if (isWcRankingStage(wcStage)) q.set(RANKINGS_TAB_WC_STAGE_PARAM, wcStage);
  return q.toString();
}
