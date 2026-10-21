import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

/** 日次 BDL ingest（league-stats / standings / team logs 等）— Firebase `runNbaStatsDailyIngestCron` */
export const NBA_DAILY_STATS_INGEST_JST = "18:00";

export function nbaDailyStatsUpdateFootnote(
  language: LocalizedLang | string | null | undefined,
  snapshotLabel?: string | null,
  options?: { preseason?: boolean }
): string {
  const lang = resolveLocalizedLang(language);
  const base = snapshotLabel?.trim() ?? "";
  const preseason = options?.preseason ?? /preseason/i.test(base);
  // プレシーズン注記（PRESEASON · 年 · 開幕後に本番データ）は出さない
  if (preseason) return "";
  const schedule = L(lang, {
    ja: `更新: 毎日 ${NBA_DAILY_STATS_INGEST_JST} JST`,
    en: `Updated daily · ${NBA_DAILY_STATS_INGEST_JST} JST`,
    ko: `매일 업데이트 · ${NBA_DAILY_STATS_INGEST_JST} JST`,
    zh: `每日更新 · ${NBA_DAILY_STATS_INGEST_JST} JST`,
    es: `Actualización diaria · ${NBA_DAILY_STATS_INGEST_JST} JST`,
    pt: `Atualizado diariamente · ${NBA_DAILY_STATS_INGEST_JST} JST`,
    fr: `Mis à jour chaque jour · ${NBA_DAILY_STATS_INGEST_JST} JST`,
  });
  return base ? `${schedule} · ${base}` : schedule;
}
