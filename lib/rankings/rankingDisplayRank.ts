/** 一覧に出す順位。同点は同じ番号。rank が無い行だけ並び順で補う */
export function rankingDisplayRank(
  row: { rank?: number | null },
  zeroBasedIndex: number
): number {
  const rank = row.rank;
  if (typeof rank === "number" && Number.isFinite(rank) && rank >= 1) {
    return Math.floor(rank);
  }
  return zeroBasedIndex + 1;
}

/** ランキング一覧に載せる最下位。この順位の同点は全員含める */
export const RANKING_LIST_MAX_RANK = 100;

/** 100位まで。同点で100位が複数いても、その全員を残す */
export function capRankingDisplayRows<T extends { rank?: number | null }>(
  rows: readonly T[]
): T[] {
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (rankingDisplayRank(rows[i], i) > RANKING_LIST_MAX_RANK) continue;
    out.push(rows[i]);
  }
  return out;
}

/** 表示用の順位。ゼロ埋めしない。displayValue があるときはそれを使う */
export function rankingRankLabel(
  rank: number,
  displayValue?: string | null
): string {
  if (displayValue != null && displayValue !== "") return displayValue;
  return String(rank);
}
