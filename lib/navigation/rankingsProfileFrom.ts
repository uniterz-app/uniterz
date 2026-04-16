import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { isRankingPhase } from "@/lib/rankings/rankingPhase";

/** プロフィール URL：ランキングから来た印 */
export const PROFILE_FROM_PARAM = "from";
export const PROFILE_FROM_RANKINGS_VALUE = "rankings";

/** 戻り時に同じタブを復元するためのクエリキー */
export const RANKINGS_TAB_METRIC_PARAM = "rankMetric";
export const RANKINGS_TAB_PHASE_PARAM = "rankPhase";

const SESSION_KEY = "uniterz.rankingsTabReturn.v1";

const METRIC_SET: ReadonlySet<MobileMetric> = new Set([
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
]);

export function isMobileMetricParam(
  v: string | null | undefined
): v is MobileMetric {
  return typeof v === "string" && METRIC_SET.has(v as MobileMetric);
}

/** ランキング→プロフィール遷移の直前に呼ぶ（ブラウザ戻るでクエリが無い場合の復元用） */
export function stashRankingsTabForReturn(
  metric: MobileMetric,
  phase: RankingPhase
): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ metric, phase }));
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
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    const o = JSON.parse(raw) as { metric?: string; phase?: string };
    if (!isMobileMetricParam(o.metric) || !isRankingPhase(o.phase)) return null;
    return { metric: o.metric, phase: o.phase };
  } catch {
    return null;
  }
}

export type RankingsReturnTab = {
  metric: MobileMetric;
  phase: RankingPhase;
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
  if (!p.includes("/rankings")) return path;
  const q = new URLSearchParams({
    [PROFILE_FROM_PARAM]: PROFILE_FROM_RANKINGS_VALUE,
    [RANKINGS_TAB_METRIC_PARAM]: tab.metric,
    [RANKINGS_TAB_PHASE_PARAM]: tab.phase,
  });
  return `${path}?${q.toString()}`;
}

/** ランキングページ用：`/rankings?...` のクエリ文字列（先頭の ? は含まない） */
export function buildRankingsPathQuery(sp: URLSearchParams): string {
  const m = sp.get(RANKINGS_TAB_METRIC_PARAM);
  const ph = sp.get(RANKINGS_TAB_PHASE_PARAM);
  const q = new URLSearchParams();
  if (isMobileMetricParam(m)) q.set(RANKINGS_TAB_METRIC_PARAM, m);
  if (isRankingPhase(ph)) q.set(RANKINGS_TAB_PHASE_PARAM, ph);
  return q.toString();
}
