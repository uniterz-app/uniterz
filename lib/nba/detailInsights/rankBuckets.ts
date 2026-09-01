export type RankBucket = "elite" | "aboveAvg" | "belowAvg" | "bottom";

export function rankBucket(rank: number): RankBucket | null {
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (rank <= 8) return "elite";
  if (rank <= 15) return "aboveAvg";
  if (rank >= 23) return "bottom";
  if (rank >= 16) return "belowAvg";
  return "belowAvg";
}

export function rankBucketLabelJa(bucket: RankBucket): string {
  switch (bucket) {
    case "elite":
      return "リーグ上位";
    case "aboveAvg":
      return "リーグ平均以上";
    case "belowAvg":
      return "リーグ平均以下";
    case "bottom":
      return "リーグ下位";
  }
}

export function rankBucketLabelEn(bucket: RankBucket): string {
  switch (bucket) {
    case "elite":
      return "top tier";
    case "aboveAvg":
      return "above average";
    case "belowAvg":
      return "below average";
    case "bottom":
      return "bottom tier";
  }
}

/** higher-is-better elite 狙い */
export function scoreFromHighRank(rank: number): number {
  if (!Number.isFinite(rank) || rank < 1) return 0;
  if (rank > 15) return 0;
  return Math.max(0, 16 - rank);
}

/** lower-is-better elite 狙い（DRTG 等） */
export function scoreFromLowRank(rank: number): number {
  if (!Number.isFinite(rank) || rank < 1) return 0;
  if (rank > 15) return 0;
  return Math.max(0, 16 - rank);
}

/** bottom 指標（weak / prone） */
export function scoreFromBottomRank(rank: number): number {
  if (!Number.isFinite(rank) || rank < 23) return 0;
  return Math.max(0, rank - 22);
}
