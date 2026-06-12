export const WC_RANKING_STAGES = ["overall", "qualifying", "main"] as const;
export type WcRankingStageBucket = (typeof WC_RANKING_STAGES)[number];

export type DailyWcStageBucket = Record<string, unknown>;

/** daily の WC ステージ別バケット（nested map と legacy dot-path 両対応） */
export function readDailyWcStageBuckets(
  data: Record<string, unknown>
): Record<WcRankingStageBucket, DailyWcStageBucket> {
  const nested = (data.rankingByWcStage ?? {}) as Record<
    string,
    DailyWcStageBucket
  >;
  const out: Record<WcRankingStageBucket, DailyWcStageBucket> = {
    overall: { ...(nested.overall ?? {}) },
    qualifying: { ...(nested.qualifying ?? {}) },
    main: { ...(nested.main ?? {}) },
  };

  for (const stage of WC_RANKING_STAGES) {
    const prefix = `rankingByWcStage.${stage}.`;
    for (const [key, val] of Object.entries(data)) {
      if (!key.startsWith(prefix)) continue;
      out[stage][key.slice(prefix.length)] = val;
    }
  }

  return out;
}

export function readDailyWcStageBucket(
  data: Record<string, unknown>,
  stage: WcRankingStageBucket
): DailyWcStageBucket {
  return readDailyWcStageBuckets(data)[stage];
}
