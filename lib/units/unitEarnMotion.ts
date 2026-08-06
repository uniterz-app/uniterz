/**
 * Unit 獲得演出 — モーション秒数の正。
 * Web framer-motion 用。Native は *_MS 換算を使う。
 */

/** 暗幕フェード */
export const UNIT_EARN_SCRIM_S = 0.2;

/** 中央ブロック入場 */
export const UNIT_EARN_ENTER_S = 0.28;

/** 獲得額カウントアップ — やや長めにして着地を柔らかく */
export const UNIT_EARN_COUNT_S = 1.25;

/** カウント後の溜め */
export const UNIT_EARN_HOLD_S = 0.32;

/**
 * カウント専用イージング（0→1）。
 * easeOutCubic より序盤を抑え、減速を長くする（硬い跳ね感を避ける）。
 */
export function easeUnitEarnCount(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  // easeOutSine × easeOutQuad のブレンド
  const sine = Math.sin((x * Math.PI) / 2);
  const quad = 1 - (1 - x) * (1 - x);
  return sine * 0.55 + quad * 0.45;
}

/** 金庫への飛行 */
export const UNIT_EARN_FLY_S = 0.62;

/** 飛行弧の高さ（直線距離に対する比率） */
export const UNIT_EARN_FLY_ARC = 0.32;

/**
 * 二次ベジェによる飛行位置（開始は原点 (0,0)、終了は (endX, endY)）。
 * 画面座標で上方向に膨らむ弧を選ぶ。
 */
export function unitEarnFlyPoint(
  t: number,
  endX: number,
  endY: number,
  arc = UNIT_EARN_FLY_ARC
): { x: number; y: number } {
  const u = Math.min(1, Math.max(0, t));
  const dist = Math.hypot(endX, endY) || 1;
  // 法線（右回り）。上向き（y が負）になる方を採用
  let nx = -endY / dist;
  let ny = endX / dist;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const lift = dist * arc;
  const cX = endX * 0.5 + nx * lift;
  const cY = endY * 0.5 + ny * lift;
  const s = 1 - u;
  return {
    x: s * s * 0 + 2 * s * u * cX + u * u * endX,
    y: s * s * 0 + 2 * s * u * cY + u * u * endY,
  };
}

/** 飛行の進行イージング（着地を少し長めに） */
export function easeUnitEarnFly(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

/** 金庫ヒット後のパルス */
export const UNIT_EARN_ABSORB_S = 0.32;

/** 金庫残高の加算カウントアップ（ヒット後） */
export const UNIT_EARN_VAULT_COUNT_S = 0.78;

/** 退出 */
export const UNIT_EARN_EXIT_S = 0.2;

/** ease-out-quart 相当 */
export const UNIT_EARN_EASE = [0.25, 1, 0.5, 1] as const;

export const UNIT_EARN_SCRIM_MS = Math.round(UNIT_EARN_SCRIM_S * 1000);
export const UNIT_EARN_ENTER_MS = Math.round(UNIT_EARN_ENTER_S * 1000);
export const UNIT_EARN_COUNT_MS = Math.round(UNIT_EARN_COUNT_S * 1000);
export const UNIT_EARN_HOLD_MS = Math.round(UNIT_EARN_HOLD_S * 1000);
export const UNIT_EARN_FLY_MS = Math.round(UNIT_EARN_FLY_S * 1000);
export const UNIT_EARN_ABSORB_MS = Math.round(UNIT_EARN_ABSORB_S * 1000);
export const UNIT_EARN_VAULT_COUNT_MS = Math.round(UNIT_EARN_VAULT_COUNT_S * 1000);
export const UNIT_EARN_EXIT_MS = Math.round(UNIT_EARN_EXIT_S * 1000);

/** 金庫 DOM / Native 計測用セレクタ */
export const UNIT_VAULT_DATA_ATTR = "data-unit-vault";

/** localStorage: 前回表示した残高 */
export function unitEarnLastSeenKey(storageKey: string): string {
  return `uniterz:unitEarn:lastSeen:${storageKey}`;
}

/** 明示キュー（session） */
export const UNIT_EARN_QUEUE_KEY = "uniterz:unitEarn:queue";

/** window カスタムイベント名 */
export const UNIT_EARN_EVENT = "uniterz:unit-earn";
