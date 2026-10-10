/**
 * プレシーズン参加ボーナス（2026-27）。
 * 対象: 期間中に新規登録した、または期間中にアプリを使ったユーザー。1 アカウント 1 回。
 * 付与: scripts/grant-preseason-participation-units.ts（開幕直後に 1 回実行）
 */

export const PRESEASON_BONUS_UNITS = 50;

export const PRESEASON_BONUS_SEASON = "2026-27";

/** 対象期間の開始（JST 2026-10-08 0:00） */
export const PRESEASON_BONUS_WINDOW_START_MS = Date.parse(
  "2026-10-08T00:00:00+09:00"
);

/** 開幕戦 BOS@DET ティップオフ（JST 2026-10-21 4:00）。これ以降の登録・利用は対象外 */
export const PRESEASON_BONUS_WINDOW_END_MS = Date.parse(
  "2026-10-21T04:00:00+09:00"
);

/** 審査用・運営テスト用（ReviewerUser / testapple / uniterz_test） */
export const PRESEASON_BONUS_EXCLUDED_UIDS: ReadonlySet<string> = new Set([
  "4MaPT4zfRHhS2ZnNoccjfKNwoOB3",
  "rjuenwllSqbXVKD7jm62f9WtgBs1",
  "Irb6JmycRea1MvFNktKZe4CQQQC2",
]);

export function preseasonBonusIdempotencyKey(uid: string): string {
  return `preseason:${PRESEASON_BONUS_SEASON}:bonus:uid${uid}`;
}
