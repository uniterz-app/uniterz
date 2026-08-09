/**
 * Unit 獲得演出 — モーション秒数の正。
 * Web framer-motion 用。Native は *_MS 換算を使う。
 */

/** 暗幕フェード */
export const UNIT_EARN_SCRIM_S = 0.2;

/** 中央ブロック入場 */
export const UNIT_EARN_ENTER_S = 0.28;

/** スタッガー入場（題名 → 金額 → ボタン）— プレビュー比較用に残置 */
export const UNIT_EARN_STAGGER_DETAIL_S = 0.05;
export const UNIT_EARN_STAGGER_PRIZE_S = 0.14;
export const UNIT_EARN_STAGGER_CLAIM_S = 0.24;
export const UNIT_EARN_STAGGER_ITEM_S = 0.34;

/**
 * 本番入場: Aperture
 * 細いリングが開いてから情報が揃う（跳ね・フラッシュなし）
 */
export const UNIT_EARN_APERTURE_RING_S = 0.72;
export const UNIT_EARN_APERTURE_DETAIL_DELAY_S = 0.18;
export const UNIT_EARN_APERTURE_RANK_DELAY_S = 0.26;
export const UNIT_EARN_APERTURE_PRIZE_DELAY_S = 0.34;
export const UNIT_EARN_APERTURE_CLAIM_DELAY_S = 0.46;
export const UNIT_EARN_APERTURE_ITEM_S = 0.4;
export const UNIT_EARN_APERTURE_COUNT_DELAY_MS = 220;

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

/**
 * 金庫残高の加算カウントアップ（ヒット後）。
 * 体感の滑らかさを優先。極端な大口だけ表示を間引く。
 */
export const UNIT_EARN_VAULT_COUNT_S = 0.7;

/**
 * これ以下の加算幅は 1 刻み。超えた分だけ表示を間引く上限段数。
 * （+80 程度は全部 1 刻みで見せる）
 */
export const UNIT_EARN_COUNT_DISPLAY_STEPS = 48;

/** カウント表示値（最終は progress≥1 で必ず end） */
export function unitEarnCountDisplayValue(
  start: number,
  end: number,
  progress01: number,
  steps = UNIT_EARN_COUNT_DISPLAY_STEPS
): number {
  const s = Math.max(0, Math.floor(start));
  const e = Math.max(0, Math.floor(end));
  if (e <= s) return e;
  const t = Math.min(1, Math.max(0, progress01));
  if (t >= 1) return e;
  const raw = Math.floor(s + (e - s) * t + 1e-6);
  const delta = e - s;
  // 通常の報酬レンジは 1 刻み。数千〜など大口だけ間引く
  if (delta <= steps) return Math.min(e, Math.max(s, raw));
  const step = Math.max(1, Math.ceil(delta / steps));
  return Math.min(e, s + Math.floor((raw - s) / step) * step);
}

/** 退出 */
export const UNIT_EARN_EXIT_S = 0.2;

/** ease-out-quart 相当 */
export const UNIT_EARN_EASE = [0.25, 1, 0.5, 1] as const;

export const UNIT_EARN_SCRIM_MS = Math.round(UNIT_EARN_SCRIM_S * 1000);
export const UNIT_EARN_ENTER_MS = Math.round(UNIT_EARN_ENTER_S * 1000);
export const UNIT_EARN_STAGGER_DETAIL_MS = Math.round(
  UNIT_EARN_STAGGER_DETAIL_S * 1000
);
export const UNIT_EARN_STAGGER_PRIZE_MS = Math.round(
  UNIT_EARN_STAGGER_PRIZE_S * 1000
);
export const UNIT_EARN_STAGGER_CLAIM_MS = Math.round(
  UNIT_EARN_STAGGER_CLAIM_S * 1000
);
export const UNIT_EARN_STAGGER_ITEM_MS = Math.round(
  UNIT_EARN_STAGGER_ITEM_S * 1000
);
export const UNIT_EARN_APERTURE_RING_MS = Math.round(
  UNIT_EARN_APERTURE_RING_S * 1000
);
export const UNIT_EARN_APERTURE_DETAIL_DELAY_MS = Math.round(
  UNIT_EARN_APERTURE_DETAIL_DELAY_S * 1000
);
export const UNIT_EARN_APERTURE_RANK_DELAY_MS = Math.round(
  UNIT_EARN_APERTURE_RANK_DELAY_S * 1000
);
export const UNIT_EARN_APERTURE_PRIZE_DELAY_MS = Math.round(
  UNIT_EARN_APERTURE_PRIZE_DELAY_S * 1000
);
export const UNIT_EARN_APERTURE_CLAIM_DELAY_MS = Math.round(
  UNIT_EARN_APERTURE_CLAIM_DELAY_S * 1000
);
export const UNIT_EARN_APERTURE_ITEM_MS = Math.round(
  UNIT_EARN_APERTURE_ITEM_S * 1000
);
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
