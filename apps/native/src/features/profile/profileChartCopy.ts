/**
 * Ranking Progress / Daily Combo / Pro monthly cards — 7言語。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../lib/i18n/localize";

export type ProfileChartLang = LocalizedLang;
export const resolveProfileChartLang = resolveLocalizedLang;

export function profileRankTrendCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: "Ranking Progress",
    subtitle: L(lang, {
      ja: "最新10件のランキングの変動を表示",
      en: "Shows ranking changes over recent snapshots",
      ko: "최근 10건 랭킹 변동을 표시",
      zh: "显示最近 10 次排名变动",
      es: "Muestra cambios de ranking recientes",
      pt: "Mostra mudanças recentes de ranking",
      fr: "Affiche les variations récentes du classement",
    }),
    subtitleFrozen: L(lang, {
      ja: "グループステージ終了 — 最終スナップショット",
      en: "Group stage complete — final snapshot",
      ko: "그룹 스테이지 종료 — 최종 스냅샷",
      zh: "小组赛结束 — 最终快照",
      es: "Fase de grupos terminada — snapshot final",
      pt: "Fase de grupos concluída — snapshot final",
      fr: "Phase de groupes terminée — snapshot final",
    }),
    emptyHint: L(lang, {
      ja: "ランキングの日次スナップショットが溜まると表示されます",
      en: "Rank snapshots appear after scheduled updates.",
      ko: "일별 랭킹 스냅샷이 쌓이면 표시됩니다",
      zh: "每日排名快照累积后会显示",
      es: "Los snapshots de ranking aparecen tras las actualizaciones.",
      pt: "Snapshots de ranking aparecem após atualizações.",
      fr: "Les snapshots de classement apparaissent après les mises à jour.",
    }),
    rankAxis: L(lang, {
      ja: "ランク",
      en: "Rank",
      ko: "랭크",
      zh: "排名",
      es: "Rank",
      pt: "Rank",
      fr: "Rang",
    }),
    currentRank: L(lang, {
      ja: "現在の順位",
      en: "Current rank",
      ko: "현재 순위",
      zh: "当前排名",
      es: "Ranking actual",
      pt: "Ranking atual",
      fr: "Rang actuel",
    }),
    bestJump: L(lang, {
      ja: "最高ジャンプアップ",
      en: "Best jump up",
      ko: "최대 상승",
      zh: "最大跃升",
      es: "Mayor subida",
      pt: "Maior subida",
      fr: "Meilleure montée",
    }),
    biggestDrop: L(lang, {
      ja: "最大ドロップ",
      en: "Biggest drop",
      ko: "최대 하락",
      zh: "最大下滑",
      es: "Mayor bajada",
      pt: "Maior queda",
      fr: "Plus forte chute",
    }),
    net: L(lang, {
      ja: "純増減",
      en: "Net",
      ko: "순증감",
      zh: "净增减",
      es: "Neto",
      pt: "Líquido",
      fr: "Net",
    }),
  };
}

export function profileDailyTrendCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: "Daily Combo Chart",
    subtitle: L(lang, {
      ja: "過去10日のスタッツの推移",
      en: "Trend of stats over the last 10 days",
      ko: "최근 10일 스탯 추이",
      zh: "近 10 日数据趋势",
      es: "Tendencia de stats de los últimos 10 días",
      pt: "Tendência das stats dos últimos 10 dias",
      fr: "Tendance des stats sur 10 jours",
    }),
    emptyHint: L(lang, {
      ja: "シーズンの日次スタッツが溜まると表示されます",
      en: "Daily season stats appear after you settle picks.",
      ko: "시즌 일별 스탯이 쌓이면 표시됩니다",
      zh: "赛季每日数据累积后会显示",
      es: "Las stats diarias aparecen al cerrar picks.",
      pt: "Stats diárias aparecem após fechar palpites.",
      fr: "Les stats quotidiennes apparaissent après validation.",
    }),
    hitsPosts: L(lang, {
      ja: "的中 / 投稿",
      en: "Hits / Posts",
      ko: "적중 / 투고",
      zh: "命中 / 投稿",
      es: "Aciertos / Posts",
      pt: "Acertos / Posts",
      fr: "Réussites / Posts",
    }),
    totalPts: L(lang, {
      ja: "総合得点",
      en: "Total Points",
      ko: "종합 득점",
      zh: "总得分",
      es: "Puntos totales",
      pt: "Pontos totais",
      fr: "Points totaux",
    }),
    upset: L(lang, {
      ja: "アップセット",
      en: "Upset",
      ko: "업셋",
      zh: "冷门",
      es: "Upset",
      pt: "Upset",
      fr: "Upset",
    }),
    unitCount: L(lang, {
      ja: "件",
      en: "items",
      ko: "건",
      zh: "条",
      es: "ítems",
      pt: "itens",
      fr: "éléments",
    }),
    unitPts: "pts",
    legendBars: L(lang, {
      ja: "投稿数 / 的中",
      en: "Posts / Correct Picks",
      ko: "투고수 / 적중",
      zh: "投稿数 / 命中",
      es: "Posts / Aciertos",
      pt: "Posts / Acertos",
      fr: "Posts / Réussites",
    }),
    legendLine: L(lang, {
      ja: "累積 総合得点",
      en: "Cumulative Total Points",
      ko: "누적 종합 득점",
      zh: "累计总得分",
      es: "Puntos totales acumulados",
      pt: "Pontos totais acumulados",
      fr: "Points totaux cumulés",
    }),
  };
}

export function profileProMonthlyCardsCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    homeAwayTitle: L(lang, {
      ja: "Home / Away 分析",
      en: "Home / Away",
      ko: "Home / Away 분석",
      zh: "主场 / 客场分析",
      es: "Home / Away",
      pt: "Home / Away",
      fr: "Home / Away",
    }),
    homeWinRate: L(lang, {
      ja: "Home勝率",
      en: "Home win rate",
      ko: "Home 승률",
      zh: "主场胜率",
      es: "Win % local",
      pt: "Win % casa",
      fr: "Win % domicile",
    }),
    awayWinRate: L(lang, {
      ja: "Away勝率",
      en: "Away win rate",
      ko: "Away 승률",
      zh: "客场胜率",
      es: "Win % visitante",
      pt: "Win % fora",
      fr: "Win % extérieur",
    }),
    homeAwayShare: L(lang, {
      ja: "Home / Away 比率",
      en: "Home / Away share",
      ko: "Home / Away 비율",
      zh: "主场 / 客场占比",
      es: "Proporción Home / Away",
      pt: "Proporção Home / Away",
      fr: "Part Home / Away",
    }),
    homePicks: L(lang, {
      ja: "Home 投稿比",
      en: "Home picks",
      ko: "Home 투고 비율",
      zh: "主场投稿比",
      es: "Picks local",
      pt: "Picks casa",
      fr: "Picks domicile",
    }),
    awayPicks: L(lang, {
      ja: "Away 投稿比",
      en: "Away picks",
      ko: "Away 투고 비율",
      zh: "客场投稿比",
      es: "Picks visitante",
      pt: "Picks fora",
      fr: "Picks extérieur",
    }),
    homeAwayFootnote: L(lang, {
      ja: "※ 勝率はホーム／アウェーそれぞれの的中率。比率は投稿の内訳です。",
      en: "Win rate is hit rate per side; share is pick distribution.",
      ko: "※ 승률은 홈/어웨이 각각 적중률. 비율은 투고 구성입니다.",
      zh: "※ 胜率为主/客场各自命中率；占比为投稿构成。",
      es: "Win rate = aciertos por lado; share = distribución de picks.",
      pt: "Win rate = acertos por lado; share = distribuição de picks.",
      fr: "Win rate = réussite par côté ; share = répartition des picks.",
    }),
    marketTitle: L(lang, {
      ja: "マーケットバイアス",
      en: "Market bias",
      ko: "마켓 바이어스",
      zh: "市场偏向",
      es: "Sesgo de mercado",
      pt: "Viés de mercado",
      fr: "Biais marché",
    }),
    favWinRate: L(lang, {
      ja: "順当勝率",
      en: "Favorite win rate",
      ko: "순당 승률",
      zh: "顺当胜率",
      es: "Win % favorito",
      pt: "Win % favorito",
      fr: "Win % favori",
    }),
    dogWinRate: L(lang, {
      ja: "逆張り勝率",
      en: "Underdog win rate",
      ko: "역배 승률",
      zh: "逆势胜率",
      es: "Win % underdog",
      pt: "Win % underdog",
      fr: "Win % outsider",
    }),
    marketShare: L(lang, {
      ja: "順当 / 逆張り 比率",
      en: "Favorite / underdog share",
      ko: "순당 / 역배 비율",
      zh: "顺当 / 逆势占比",
      es: "Proporción favorito / underdog",
      pt: "Proporção favorito / underdog",
      fr: "Part favori / outsider",
    }),
    dogPicks: L(lang, {
      ja: "逆張り投稿比",
      en: "Underdog picks",
      ko: "역배 투고 비율",
      zh: "逆势投稿比",
      es: "Picks underdog",
      pt: "Picks underdog",
      fr: "Picks outsider",
    }),
    favPicks: L(lang, {
      ja: "順当投稿比",
      en: "Favorite picks",
      ko: "순당 투고 비율",
      zh: "顺当投稿比",
      es: "Picks favorito",
      pt: "Picks favorito",
      fr: "Picks favori",
    }),
  };
}

/** 日付軸ロケール（非 ja は en-US） */
export function profileChartDateLocale(lang: LocalizedLang): string {
  return lang === "ja" ? "ja-JP" : "en-US";
}
