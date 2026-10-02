/**
 * 2026-27 開幕日（ET 2026-10-20 = JST 2026-10-21）。
 * オフシーズン中の Games 既定日はプレシーズン開始寄り（開幕夜だけだとプレが表示されない）。
 * 本番一覧へのモック注入はしない。
 */

import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";

/** キックオフの JST 暦日（レギュラー開幕） */
export const NBA_OPENING_NIGHT_DATE_KEY = "2026-10-21";

/**
 * 2026-27 プレシーズン開始の目安（JST 暦日）。
 * BDL プレ試合が載る窓のアンカー。確定スケジュールで前後しても ±5 日フェッチで吸収。
 */
export const NBA_PRESEASON_START_DATE_KEY = "2026-10-03";

/** @deprecated 旧プレビュー名。NBA_OPENING_NIGHT_DATE_KEY を使う */
export const NBA_OPENING_NIGHT_PREVIEW_DATE_KEY = NBA_OPENING_NIGHT_DATE_KEY;

/** 表示 TZ の Opening Night 暦日（JST→10/21、ET→10/20） */
export function nbaOpeningNightDefaultDateKey(timeZone: string): string {
  return toDateKeyInTimeZone(
    new Date("2026-10-21T08:00:00+09:00"),
    timeZone
  );
}

/**
 * オフシーズン〜開幕前の Games 既定アンカー。
 * 今日が開幕以降 → 今日。プレシーズン期間中 → 今日。それ以前 → プレシーズン開始日。
 * （開幕夜固定だと ±5 日窓にプレシーズンが入らない）
 */
export function nbaGamesDefaultDateKey(
  timeZone: string,
  now: Date = new Date()
): string {
  const today = toDateKeyInTimeZone(now, timeZone);
  const opening = nbaOpeningNightDefaultDateKey(timeZone);
  if (today >= opening) return today;

  const preseasonStart = toDateKeyInTimeZone(
    new Date("2026-10-03T08:00:00+09:00"),
    timeZone
  );
  if (today >= preseasonStart) return today;
  return preseasonStart;
}

/**
 * @deprecated 本番一覧へモックを混ぜない。呼び出し側は rows をそのまま使う。
 */
export function mergeNbaOpeningNightPreviewGames(
  _league: unknown,
  rows: ReadonlyArray<Record<string, unknown>>
): Record<string, unknown>[] {
  return [...rows];
}
