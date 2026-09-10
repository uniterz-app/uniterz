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
  if (preseason) {
    if (base) {
      return `${base} · ${L(lang, {
        ja: "レギュラー開幕後に本番データ",
        en: "Live after opening night",
        ko: "정규 시즌 개막 후 본 데이터",
        zh: "常规赛开幕后提供正式数据",
        es: "Datos reales tras la apertura",
        pt: "Dados reais após a abertura",
        fr: "Données réelles après l’ouverture",
      })}`;
    }
    return L(lang, {
      ja: "プレシーズン · レギュラー開幕後に本番データ",
      en: "Preseason · Live after opening night",
      ko: "프리시즌 · 정규 시즌 개막 후 본 데이터",
      zh: "季前赛 · 常规赛开幕后提供正式数据",
      es: "Pretemporada · Datos reales tras la apertura",
      pt: "Pré-temporada · Dados reais após a abertura",
      fr: "Pré-saison · Données réelles après l’ouverture",
    });
  }
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
