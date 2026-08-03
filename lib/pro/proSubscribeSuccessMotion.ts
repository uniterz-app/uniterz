/**
 * Pro 購読プレビュー成功カード入場タイミング（Web / Native 共通）。
 */
export const PRO_SUBSCRIBE_SUCCESS_MOTION = {
  /** カード本体 */
  cardMs: 320,
  cardFromY: 14,
  cardFromScale: 0.96,
  /** ヘッダー（✓ + タイトル）— カードより遅延 */
  headDelayMs: 90,
  headMs: 300,
  headFromY: 10,
  /** シアン角ブラケット / サイド板 */
  accentDelayMs: 40,
  accentMs: 280,
  /** ✓ グロー 1 パルス（ヘッダー開始後） */
  checkGlowDelayMs: 220,
  checkGlowMs: 420,
  /** PRO バッジ + UNITERZ を横切るシーン（キラン） */
  brandSheenDelayMs: 340,
  brandSheenMs: 920,
} as const;
