export type ResultStatMetricKey = "upsetPoints" | "pointsV3";

export type ResultStatRowBuilt = {
  key: ResultStatMetricKey;
  value: number;
  barMax: number;
  /** Formatted number; callers handle a missing upset game as "--". */
  display: string;
};

export type ResultSettlementBreakdown = {
  hadUpsetGame: boolean;
  upsetPoints: number;
  pointsV3: number;
  basePoints: number;
  upsetBonus: number;
  streakBonus: number;
  goalScorerBonus: number;
  totalPoints: number;
};

type ResultStatsRecord = {
  hadUpsetGame?: unknown;
  upsetPoints?: unknown;
  pointsV3?: unknown;
  goalScorerBonus?: unknown;
  pointsV3Detail?: {
    basePoints?: unknown;
    upsetBonus?: unknown;
    streakBonus?: unknown;
    goalScorerBonus?: unknown;
  };
};

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function extractResultSettlementBreakdown(
  stats: unknown
): ResultSettlementBreakdown {
  const resultStats =
    stats !== null && typeof stats === "object"
      ? (stats as ResultStatsRecord)
      : undefined;
  const detail = resultStats?.pointsV3Detail;
  const pointsV3 = toNumber(resultStats?.pointsV3);

  return {
    hadUpsetGame: Boolean(resultStats?.hadUpsetGame),
    upsetPoints: toNumber(resultStats?.upsetPoints),
    pointsV3,
    basePoints: toNumber(detail?.basePoints),
    upsetBonus: toNumber(detail?.upsetBonus),
    streakBonus: toNumber(detail?.streakBonus),
    goalScorerBonus: toNumber(
      resultStats?.goalScorerBonus ?? detail?.goalScorerBonus
    ),
    totalPoints: pointsV3,
  };
}

export function buildResultStatMetricValues(
  breakdown: ResultSettlementBreakdown
): Array<{
  key: ResultStatMetricKey;
  value: number;
  barMax: number;
  /** Upset without a game is null, meaning the UI shows "--". */
  displayValue: number | null;
}> {
  return [
    {
      key: "upsetPoints",
      value: breakdown.upsetPoints,
      barMax: 10,
      displayValue: breakdown.hadUpsetGame ? breakdown.upsetPoints : null,
    },
    {
      key: "pointsV3",
      value: breakdown.pointsV3,
      barMax: 10,
      displayValue: breakdown.pointsV3,
    },
  ];
}
