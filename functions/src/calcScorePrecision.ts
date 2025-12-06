// functions/src/calcScorePrecision/calcScorePrecision.ts

import { SPORT_TYPE_BY_LEAGUE } from "./sportTypes";
import { scorePrecisionRules } from "./scorePrecisionRules";

/**
 * スコア精度（home / away / 得失点差）を合計して 0〜15 pt を返す
 */
export function calcScorePrecision({
  predictedHome,
  predictedAway,
  actualHome,
  actualAway,
  league,
}: {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
  league: string;
}) {
  const sport = SPORT_TYPE_BY_LEAGUE[league] ?? "basketball"; // fallback
  const rules = scorePrecisionRules[sport];

  // 各軸のずれ
  const diffHome = Math.abs(predictedHome - actualHome);
  const diffAway = Math.abs(predictedAway - actualAway);
  const diff = Math.abs((predictedHome - predictedAway) - (actualHome - actualAway));

  // 点数化
  const homePt = rules.pointByHome(diffHome);
  const awayPt = rules.pointByAway(diffAway);
  const diffPt = rules.pointByDiff(diff);

  return {
    homePt,
    awayPt,
    diffPt,
    totalPt: homePt + awayPt + diffPt, // 最大15
  };
}
