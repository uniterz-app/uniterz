import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { NbaLeagueStatsMode } from "@/lib/nba/leagueStatsTableTabs";
import { isNbaLeagueStatsPreseason } from "@/lib/nba/leagueStatsPreseason";

export type LeagueStatsEmptyStateCopy = {
  title: string;
  body: string;
};

/** Team / Player リーグ表 — 行が無いときの文言 */
export function leagueStatsTableEmptyCopy(
  language: LocalizedLang | string | null | undefined,
  mode: NbaLeagueStatsMode,
  seasonKey?: string
): LeagueStatsEmptyStateCopy {
  const lang = resolveLocalizedLang(language);
  const preseason = isNbaLeagueStatsPreseason(seasonKey);

  if (mode === "last10") {
    return {
      title: "LAST 10",
      body: preseason
        ? L(lang, {
            ja: "レギュラーシーズン開始後、直近10試合の集計を表示します。",
            en: "Last 10 tables appear after the regular season opens.",
            ko: "정규 시즌 개막 후 최근 10경기 집계를 표시합니다.",
            zh: "常规赛开幕后显示近 10 场汇总。",
            es: "Las tablas Last 10 aparecen tras el inicio de temporada.",
            pt: "As tabelas Last 10 aparecem após o início da temporada.",
            fr: "Les tableaux Last 10 apparaissent après le début de saison.",
          })
        : L(lang, {
            ja: "直近10試合分のデータがまだありません。試合確定後に更新されます。",
            en: "No last-10 sample yet. Updates after games finalize.",
            ko: "최근 10경기 데이터가 아직 없습니다. 경기 확정 후 업데이트됩니다.",
            zh: "尚无近 10 场数据。比赛结算后更新。",
            es: "Aún no hay muestra Last 10. Se actualiza al finalizar partidos.",
            pt: "Ainda não há amostra Last 10. Atualiza após os jogos.",
            fr: "Pas encore d’échantillon Last 10. Mise à jour après les matchs.",
          }),
    };
  }

  if (preseason) {
    return {
      title: "PRESEASON",
      body: L(lang, {
        ja: "レギュラーシーズン開始後、BDL 日次 ingest（18:00 JST）で本番データを表示します。",
        en: "Season tables go live after opening night via daily BDL ingest (18:00 JST).",
        ko: "정규 시즌 개막 후 BDL 일일 ingest(18:00 JST)로 본 데이터를 표시합니다.",
        zh: "常规赛开幕后经 BDL 日次 ingest（18:00 JST）显示正式数据。",
        es: "Las tablas de temporada llegan tras la apertura vía ingest diario BDL (18:00 JST).",
        pt: "As tabelas da temporada entram após a abertura via ingest diário BDL (18:00 JST).",
        fr: "Les tableaux de saison arrivent après l’ouverture via ingest BDL quotidien (18:00 JST).",
      }),
    };
  }

  return {
    title: "NO DATA",
    body: L(lang, {
      ja: "スナップショットを準備中です。しばらくしてから再度お試しください。",
      en: "Snapshot not ready yet. Please check back shortly.",
      ko: "스냅샷을 준비 중입니다. 잠시 후 다시 시도해 주세요.",
      zh: "快照准备中。请稍后再试。",
      es: "Instantánea aún no lista. Vuelve a intentarlo en breve.",
      pt: "Snapshot ainda não pronto. Tente novamente em breve.",
      fr: "Instantané pas encore prêt. Réessayez sous peu.",
    }),
  };
}

export function teamLast10HasPlayData(
  rows: readonly { wins: number; losses: number }[]
): boolean {
  return rows.some((r) => r.wins + r.losses > 0);
}
