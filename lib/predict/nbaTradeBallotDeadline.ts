/**
 * トレード予想バレット — 日程・編集ロック（確定）。
 *
 * - 受付開始: 12/15 0:00 JST
 * - 締切: TDL の 3 日前 23:59 JST（2026-27 は 2/8）
 * - TDL: 2027-02-11 15:00 ET = 2/12 5:00 JST
 * - 提出後にその枠の選手が移籍したら枠を即ロック。ほかの枠は締切まで編集可
 */
import { TRADE_BALLOT_SLOT_COUNT } from "@/lib/predict/nbaTradeBallotPredict";

/** Asia/Tokyo の壁時計を UTC ms に（JST = UTC+9・夏時間なし） */
function jstWallToUtcMs(
  year: number,
  month1to12: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): number {
  return Date.UTC(year, month1to12 - 1, day, hour - 9, minute, second);
}

export const TRADE_BALLOT_SEASON_KEY = "2026-27";

/** 受付開始 2026-12-15 00:00 JST */
export const TRADE_BALLOT_OPEN_AT_MS = jstWallToUtcMs(2026, 12, 15, 0, 0, 0);

/** 締切 2027-02-08 23:59:59 JST（TDL の約 3 日前） */
export const TRADE_BALLOT_CLOSE_AT_MS = jstWallToUtcMs(2027, 2, 8, 23, 59, 59);

/** TDL 終了 2027-02-12 05:00 JST（米東部 2/11 15:00） */
export const TRADE_BALLOT_TDL_END_AT_MS = jstWallToUtcMs(2027, 2, 12, 5, 0, 0);

export function isTradeBallotSubmitOpen(nowMs: number = Date.now()): boolean {
  return nowMs >= TRADE_BALLOT_OPEN_AT_MS && nowMs <= TRADE_BALLOT_CLOSE_AT_MS;
}

export function isTradeBallotBeforeOpen(nowMs: number = Date.now()): boolean {
  return nowMs < TRADE_BALLOT_OPEN_AT_MS;
}

export function isTradeBallotClosed(nowMs: number = Date.now()): boolean {
  return nowMs > TRADE_BALLOT_CLOSE_AT_MS;
}

/**
 * 枠ロック: その選手が「選んだあと」に公式移籍リストへ入ったらロック。
 * `lockedPlayerIds` は運営確定の移籍 playerId 集合（提出時刻より後に動いた分）。
 */
export function isTradeBallotSlotLocked(
  playerId: string | null | undefined,
  lockedPlayerIds: ReadonlySet<string>
): boolean {
  const id = typeof playerId === "string" ? playerId.trim() : "";
  if (!id) return false;
  return lockedPlayerIds.has(id);
}

export function tradeBallotEditableSlotCount(
  picks: readonly { playerId: string | null }[],
  lockedPlayerIds: ReadonlySet<string>
): number {
  let n = 0;
  const len = Math.min(picks.length, TRADE_BALLOT_SLOT_COUNT);
  for (let i = 0; i < len; i += 1) {
    if (!isTradeBallotSlotLocked(picks[i]?.playerId, lockedPlayerIds)) n += 1;
  }
  return n;
}

export const TRADE_BALLOT_SCHEDULE_COPY_JA = {
  open: "2026年12月15日 0:00（日本時間）",
  close: "2027年2月8日 23:59（日本時間）· TDL の 3 日前",
  tdl: "2027年2月12日 5:00（日本時間）",
  lockRule:
    "提出後にその枠の選手が移籍したら、その枠だけ当たりで固定。ほかの枠は締切まで変更できます。",
} as const;
