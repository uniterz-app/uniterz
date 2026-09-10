import { t } from "../../../../../lib/i18n/t";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "../../../../../lib/i18n/localize";

export type RankingsLanguage = LocalizedLang;

/** Web `t(lang).rankings` をそのまま Native ランキング画面で使う */
export function rankingsTexts(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  const m = t(lang).rankings;
  const common = t(lang).common;
  return {
    title: m.pageTitleRankings,
    titleWorldCup: m.pageTitleWorldCup,
    scheduleInfoToggle: m.scheduleInfoToggle,
    /** Web `RankingsCategoryTabs` と同じ表記 */
    playoffs: "Playoffs",
    worldCup: "WORLD CUP",
    bracket: "Bracket",
    bracketSoon: L(lang, {
      ja: "ブラケットランキングは Web 版と同様に順次対応します。",
      en: "Bracket rankings will match the web app in a future update.",
      ko: "브래킷 랭킹은 웹과 같이 순차 지원됩니다.",
      zh: "对阵图排名将与网页版一样逐步支持。",
      es: "Las clasificaciones de bracket se alinearán con la web en una actualización futura.",
      pt: "Os rankings de chave ficarão iguais ao app web em uma atualização futura.",
      fr: "Les classements bracket suivront l’app web dans une prochaine mise à jour.",
    }),
    yourRank: m.yourRank,
    pts: m.pts,
    streakShort: m.winStreak,
    loading: common.loading,
    posts: common.posts,
    noData: "NO DATA",
    winRateMin: (n: number) => m.minPostsRequired.replace("{n}", String(n)),
    winRatePickupRate:
      (m as { winRatePickupRateRequired?: string }).winRatePickupRateRequired ??
      m.minPostsRequired.replace("{n}", "65%"),
    winRateNoMin: m.noMinPosts,
    roundTotal: m.roundTotal,
    roundFirst: m.roundFirst,
    roundSecond: m.roundSecond,
    roundCF: m.roundCF,
    roundFinals: m.roundFinals,
    stageAll: m.stageAll,
    stageGroup: m.stageGroup,
    stageKnockout: m.stageKnockout,
    topPercent: m.topPercent,
    loadingRankStats: m.loadingRankStats,
    stageTabsLabel: m.stageTabsLabel,
    roundTabsLabel: m.roundTabsLabel,
    metricTabsLabel: m.metricTabsLabel,
    shareMyRank: m.shareMyRank,
    shareRankCardFailed: m.shareRankCardFailed,
    rankingProgressNoData: t(lang).profile.rankingProgressNoData,
    rankGapViewGap: m.rankGap.viewGap,
    divisionStandard: m.divisionStandard,
    periodSeason: m.periodSeason ?? "Season",
    periodWeekly: m.periodWeekly ?? "Weekly",
    periodMonthly: m.periodMonthly ?? "Monthly",
    nbaBoardRegular: m.nbaBoardRegular,
    nbaBoardPlayoffs: m.nbaBoardPlayoffs,
    divisionOpen: m.divisionOpen,
    divisionOpenTitle: m.divisionOpenTitle,
    divisionOpenLockBody: m.divisionOpenLockBody,
    divisionOpenCta: m.divisionOpenCta,
    divisionOpenModalDismiss: m.divisionOpenModalDismiss ?? common.close,
    divisionOpenBackToPickUp:
      m.divisionOpenBackToPickUp ??
      L(lang, {
        ja: "Pick Up に戻る",
        en: "Back to Pick Up",
        ko: "Pick Up으로 돌아가기",
        zh: "返回 Pick Up",
        es: "Volver a Pick Up",
        pt: "Voltar ao Pick Up",
        fr: "Retour à Pick Up",
      }),
  };
}
