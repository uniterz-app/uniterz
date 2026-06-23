import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";

export type RankingsLanguage = "ja" | "en";

function langOf(language: RankingsLanguage): Language {
  return language === "en" ? "en" : "ja";
}

/** Web `t(lang).rankings` をそのまま Native ランキング画面で使う */
export function rankingsTexts(language: RankingsLanguage) {
  const lang = langOf(language);
  const m = t(lang).rankings;
  const common = t(lang).common;
  return {
    title: m.pageTitleRankings,
    titleWorldCup: m.pageTitleWorldCup,
    scheduleInfoToggle: m.scheduleInfoToggle,
    /** Web `RankingsCategoryTabs` と同じ表記 */
    playoffs: "Playoffs",
    bracket: "Bracket",
    bracketSoon:
      language === "ja"
        ? "ブラケットランキングは Web 版と同様に順次対応します。"
        : "Bracket rankings will match the web app in a future update.",
    yourRank: m.yourRank,
    pts: m.pts,
    streakShort: m.winStreak,
    loading: common.loading,
    posts: common.posts,
    noData: "NO DATA",
    winRateMin: (n: number) => m.minPostsRequired.replace("{n}", String(n)),
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
  };
}
