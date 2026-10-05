/** Matchup Difficulty の日程特徴量（純関数・サーバー/クライアント共通） */

/** 前試合からの休養日数の区分。0 = B2B。前試合なし（開幕）は "3+" */
export type RestCategory = "0" | "1" | "2" | "3+";

export const REST_CATEGORIES: ReadonlyArray<RestCategory> = ["0", "1", "2", "3+"];

/** 回帰の基準区分（係数 0） */
export const REST_BASELINE: RestCategory = "1";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD`（試合現地日付）同士の休養日数。前日なら 0（B2B） */
export function restDaysBetweenGameDates(
  prevGameDate: string | null | undefined,
  gameDate: string
): number | null {
  if (!prevGameDate) return null;
  const prev = Date.parse(`${prevGameDate.slice(0, 10)}T00:00:00Z`);
  const cur = Date.parse(`${gameDate.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(prev) || !Number.isFinite(cur)) return null;
  const diffDays = Math.round((cur - prev) / DAY_MS);
  return Math.max(0, diffDays - 1);
}

export function restCategoryFromDays(restDays: number | null): RestCategory {
  if (restDays == null || restDays >= 3) return "3+";
  if (restDays <= 0) return "0";
  return restDays === 1 ? "1" : "2";
}

export function isBackToBack(category: RestCategory): boolean {
  return category === "0";
}
