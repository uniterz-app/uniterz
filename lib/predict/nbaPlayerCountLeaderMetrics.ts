/**
 * Player Leaders — シーズン回数ボード（20+/30+ PTS・DD・TD）。
 * game logs から集計。BDL averages ではない。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type NbaPlayerCountLeaderMetric =
  | "games_20pts"
  | "games_30pts"
  | "double_doubles"
  | "triple_doubles";

export type NbaPlayerCountLeaderMetricDef = {
  id: NbaPlayerCountLeaderMetric;
  label: string;
  short: string;
  higherIsBetter: true;
  hint: UiStrings;
  kind: "count";
};

export const NBA_PLAYER_COUNT_LEADER_METRICS: readonly NbaPlayerCountLeaderMetricDef[] =
  [
    {
      id: "games_20pts",
      label: "20+ Point Games",
      short: "20+ PTS",
      higherIsBetter: true,
      kind: "count",
      hint: {
        ja: "1試合20点以上を記録した回数。",
        en: "Games with 20+ points.",
        ko: "20점 이상 경기 수.",
        zh: "单场20+得分次数。",
        es: "Partidos con 20+ puntos.",
        pt: "Jogos com 20+ pontos.",
        fr: "Matchs à 20+ points.",
      },
    },
    {
      id: "games_30pts",
      label: "30+ Point Games",
      short: "30+ PTS",
      higherIsBetter: true,
      kind: "count",
      hint: {
        ja: "1試合30点以上を記録した回数。",
        en: "Games with 30+ points.",
        ko: "30점 이상 경기 수.",
        zh: "单场30+得分次数。",
        es: "Partidos con 30+ puntos.",
        pt: "Jogos com 30+ pontos.",
        fr: "Matchs à 30+ points.",
      },
    },
    {
      id: "double_doubles",
      label: "Double-Doubles",
      short: "DBL-DBL",
      higherIsBetter: true,
      kind: "count",
      hint: {
        ja: "2カテゴリ以上で二桁（PTS/REB/AST/STL/BLK）。",
        en: "Games with 10+ in two of PTS/REB/AST/STL/BLK.",
        ko: "PTS/REB/AST/STL/BLK 중 2개 이상 두 자릿수.",
        zh: "得分/篮板/助攻/抢断/盖帽中两项10+。",
        es: "10+ en dos de PTS/REB/AST/STL/BLK.",
        pt: "10+ em dois de PTS/REB/AST/STL/BLK.",
        fr: "10+ dans deux catégories PTS/REB/AST/STL/BLK.",
      },
    },
    {
      id: "triple_doubles",
      label: "Triple-Doubles",
      short: "TPL-DBL",
      higherIsBetter: true,
      kind: "count",
      hint: {
        ja: "3カテゴリ以上で二桁（PTS/REB/AST/STL/BLK）。",
        en: "Games with 10+ in three of PTS/REB/AST/STL/BLK.",
        ko: "PTS/REB/AST/STL/BLK 중 3개 이상 두 자릿수.",
        zh: "得分/篮板/助攻/抢断/盖帽中三项10+。",
        es: "10+ en tres de PTS/REB/AST/STL/BLK.",
        pt: "10+ em três de PTS/REB/AST/STL/BLK.",
        fr: "10+ dans trois catégories PTS/REB/AST/STL/BLK.",
      },
    },
  ] as const;

export const NBA_PLAYER_COUNT_LEADER_METRIC_IDS: readonly NbaPlayerCountLeaderMetric[] =
  NBA_PLAYER_COUNT_LEADER_METRICS.map((m) => m.id);

export function isPlayerCountLeaderMetric(
  id: string
): id is NbaPlayerCountLeaderMetric {
  return (NBA_PLAYER_COUNT_LEADER_METRIC_IDS as readonly string[]).includes(id);
}

export function playerCountMetricDef(
  id: NbaPlayerCountLeaderMetric
): NbaPlayerCountLeaderMetricDef {
  const found = NBA_PLAYER_COUNT_LEADER_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown count leader metric ${id}`);
  return found;
}

function categoryTens(g: NbaPlayerGameLog): number {
  let n = 0;
  if (g.pts >= 10) n += 1;
  if (g.reb >= 10) n += 1;
  if (g.ast >= 10) n += 1;
  if (g.stl >= 10) n += 1;
  if (g.blk >= 10) n += 1;
  return n;
}

export function countPlayerSeasonStatMilestones(
  gameLogs: readonly NbaPlayerGameLog[]
): Record<NbaPlayerCountLeaderMetric, number> {
  let games20 = 0;
  let games30 = 0;
  let dd = 0;
  let td = 0;
  for (const g of gameLogs) {
    if (g.pts >= 20) games20 += 1;
    if (g.pts >= 30) games30 += 1;
    const tens = categoryTens(g);
    if (tens >= 2) dd += 1;
    if (tens >= 3) td += 1;
  }
  return {
    games_20pts: games20,
    games_30pts: games30,
    double_doubles: dd,
    triple_doubles: td,
  };
}
