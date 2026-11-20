/**
 * トレード予想バレット — 報酬（再確定 · ~1000 人想定）。
 *
 * - 参加賞: 締切時点で 7 枠提出済みなら全員 **5 Unit**
 * - 1位: ユニフォームのみ（順位 Unit なし）· 当たった移籍選手から本人が選ぶ
 *   ※参加賞の 5 Unit は 1 位にも付く
 * - 2〜50位: 順位 Unit（上位厚め · 裾で「入った」感）
 * - 参加無料
 */

/** 締切時点で提出完了した全員 */
export const TRADE_BALLOT_PARTICIPATION_UNITS = 5;

export const TRADE_BALLOT_UNIT_MAX_RANK = 50;

/** true = 1位にユニフォーム */
export const TRADE_BALLOT_FIRST_PLACE_JERSEY = true;

/**
 * index 0 = 1位。
 * 1位は順位 Unit 0（ユニフォーム）。参加賞は別途加算。
 */
export const TRADE_BALLOT_UNITS_BY_RANK: readonly number[] = [
  0, // 1 ユニフォーム
  200, // 2
  150, // 3
  120, // 4
  100, // 5
  // 6–10 一律 85
  85, 85, 85, 85, 85,
  // 11–20 一律 45
  45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
  // 21–30
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  // 31–40
  12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
  // 41–50
  10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
] as const;

export function tradeBallotUnitsForRank(rank: number): number {
  if (
    !Number.isInteger(rank) ||
    rank < 1 ||
    rank > TRADE_BALLOT_UNIT_MAX_RANK
  ) {
    return 0;
  }
  return TRADE_BALLOT_UNITS_BY_RANK[rank - 1] ?? 0;
}

export function tradeBallotHasJerseyPrize(rank: number): boolean {
  return TRADE_BALLOT_FIRST_PLACE_JERSEY && rank === 1;
}

/** 順位 Unit + 参加賞（提出済みのとき） */
export function tradeBallotTotalUnitsForEntrant(options: {
  rank: number | null;
  submittedComplete: boolean;
}): number {
  const participation = options.submittedComplete
    ? TRADE_BALLOT_PARTICIPATION_UNITS
    : 0;
  const ranked =
    options.rank != null ? tradeBallotUnitsForRank(options.rank) : 0;
  return participation + ranked;
}

/** 順位賞の合計（参加賞は人数依存なので含めない） */
export const TRADE_BALLOT_RANK_UNITS_POOL = TRADE_BALLOT_UNITS_BY_RANK.reduce(
  (a, b) => a + b,
  0
);

export type TradeBallotPrizeBand = {
  labelJa: string;
  labelEn: string;
  valueJa: string;
  valueEn: string;
};

/** UI 用に連続同額をまとめる */
export function tradeBallotPrizeBands(): TradeBallotPrizeBand[] {
  const bands: TradeBallotPrizeBand[] = [
    {
      labelJa: "参加賞（提出完了）",
      labelEn: "Participation (submitted)",
      valueJa: `${TRADE_BALLOT_PARTICIPATION_UNITS} Unit`,
      valueEn: `${TRADE_BALLOT_PARTICIPATION_UNITS} Units`,
    },
    {
      labelJa: "1位",
      labelEn: "1st",
      valueJa: "ユニフォーム（＋参加賞）",
      valueEn: "Jersey (+ participation)",
    },
  ];

  let start = 2;
  while (start <= TRADE_BALLOT_UNIT_MAX_RANK) {
    const units = tradeBallotUnitsForRank(start);
    let end = start;
    while (
      end + 1 <= TRADE_BALLOT_UNIT_MAX_RANK &&
      tradeBallotUnitsForRank(end + 1) === units
    ) {
      end += 1;
    }
    const labelJa = start === end ? `${start}位` : `${start}〜${end}位`;
    const labelEn = start === end ? `#${start}` : `#${start}–${end}`;
    bands.push({
      labelJa,
      labelEn,
      valueJa: `${units} Unit`,
      valueEn: `${units} Units`,
    });
    start = end + 1;
  }
  return bands;
}
