import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";

/** 指定シーズン／プレーオフバケットに実投稿がある日だけチャート対象にする */
export function dailyTrendRowHasSeasonActivity(
  row: Pick<ProfileDailyTrendRow, "posts" | "pointsV3" | "upsetPoints">
): boolean {
  return (
    row.posts > 0 ||
    Math.abs(row.pointsV3) > 1e-9 ||
    Math.abs(row.upsetPoints) > 1e-9
  );
}

/**
 * 26-27 など対象バケットが空なら [] → UI は NO DATA。
 * ゼロ埋め日や前シーズン混入を落とす。
 */
export function filterDailyTrendToSeasonActivity(
  rows: readonly ProfileDailyTrendRow[]
): ProfileDailyTrendRow[] {
  return rows.filter(dailyTrendRowHasSeasonActivity);
}
