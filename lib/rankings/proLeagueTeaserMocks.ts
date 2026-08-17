/**
 * PRO LEAGUE Free ティーザー用 — 実データは出さずダミー行のみ。
 */

import type { RankingRowWithCountry } from "@/lib/rankings/rankingMetrics";

const NAMES = [
  "Nova",
  "Kaito",
  "Mira",
  "Juno",
  "Rex",
  "Aoi",
  "Sena",
  "Yuki",
  "Leo",
  "Hana",
] as const;

/** Free 向けぼかし背景用のダミー行（総合得点想定） */
export function buildProLeagueTeaserRows(): RankingRowWithCountry[] {
  return NAMES.map((name, i) => {
    const place = i + 1;
    const pts = 1600 - place * 47;
    const posts = 30 + ((place * 5) % 19);
    return {
      uid: `teaser-${place}`,
      handle: `pro${place}`,
      displayName: name,
      photoURL: undefined,
      plan: "pro",
      posts,
      winRate: Math.min(0.9, 0.55 + (10 - place) * 0.03),
      streak: Math.max(0, 9 - place),
      totalScore: pts,
      avgTotalScore: pts / posts,
      upsetScore: Math.max(20, 140 - place * 8),
      avgUpsetScore: Math.max(1, (140 - place * 8) / posts),
      goalScorerHits: Math.max(0, 30 - place * 2),
      countryCode: place % 3 === 0 ? "US" : place % 2 === 0 ? "KR" : "JP",
      rankDeltaPlaces: place === 1 ? 1 : place % 3 === 0 ? -1 : 0,
      metricValueDelta: place % 2 === 0 ? 8 : -3,
    };
  });
}
