/**
 * 累積ランキングは 16:00 スナップショット更新。
 * cache key に snapshotGeneration を含めるため、長めの TTL でも世代切替で取り直せる。
 */
export const CUMULATIVE_RANKING_REVALIDATE_SEC = 43_200; // 12h
