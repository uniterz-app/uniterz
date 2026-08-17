/**
 * 累積ランキングは 16:00 JST スナップショット更新。
 * cache key に snapshotGeneration を含めるため、TTL は安全網。
 * 12h だと昼の初回ヒット → 0:00 一斉切れ（stampede）になる。
 */
export const CUMULATIVE_RANKING_REVALIDATE_SEC = 86_400; // 24h
