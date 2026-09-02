/** 日次 BDL ingest（league-stats / standings / team logs 等）— Firebase `runNbaStatsDailyIngestCron` */
export const NBA_DAILY_STATS_INGEST_JST = "18:00";

export function nbaDailyStatsUpdateFootnote(
  language: "ja" | "en",
  snapshotLabel?: string | null,
  options?: { preseason?: boolean }
): string {
  const base = snapshotLabel?.trim() ?? "";
  const preseason = options?.preseason ?? /preseason/i.test(base);
  if (preseason) {
    if (language === "ja") {
      return base
        ? `${base} · レギュラー開幕後に本番データ`
        : "プレシーズン · レギュラー開幕後に本番データ";
    }
    return base
      ? `${base} · Live after opening night`
      : "Preseason · Live after opening night";
  }
  if (language === "ja") {
    const schedule = `更新: 毎日 ${NBA_DAILY_STATS_INGEST_JST} JST`;
    return base ? `${schedule} · ${base}` : schedule;
  }
  const schedule = `Updated daily · ${NBA_DAILY_STATS_INGEST_JST} JST`;
  return base ? `${schedule} · ${base}` : schedule;
}
