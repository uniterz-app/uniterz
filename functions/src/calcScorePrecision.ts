import { SPORT_TYPE_BY_LEAGUE } from "./sportTypes";
import { scorePrecisionRules } from "./scorePrecisionRules";

/**
 * スコア精度（0〜15 pt）
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
  const sport = SPORT_TYPE_BY_LEAGUE[league] ?? "basketball";

  /* =========================
   * Football（サッカー）
   * ========================= */
  if (sport === "football") {
    const { totalPt } = scorePrecisionRules.football.calc(
      predictedHome,
      predictedAway,
      actualHome,
      actualAway
    );

    // 既存 I/F を壊さない
    return {
      homePt: 0,
      awayPt: 0,
      diffPt: 0,
      totalPt, // 0–15
    };
  }

  /* =========================
   * Basketball（現行ロジック）
   * ========================= */
  const rules = scorePrecisionRules.basketball;

  const diffHome = Math.abs(predictedHome - actualHome);
  const diffAway = Math.abs(predictedAway - actualAway);
  const diff = Math.abs(
    (predictedHome - predictedAway) -
    (actualHome - actualAway)
  );

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
