export const DEFAULT_HEADER_IMAGE_POSITION_Y = 50;

/** カード用 — 縦位置調整の余白 */
export const HEADER_IMAGE_NATIVE_CARD_HEIGHT_SCALE = 2;

/**
 * ヒーロー用 — Web `object-cover` と同じ画角（1.0）
 * 位置調整が必要なときだけわずかにオーバースキャン
 */
export const HEADER_IMAGE_NATIVE_HERO_HEIGHT_SCALE = 1;

/** 保存済み positionY が中央以外のときのオーバースキャン */
export const HEADER_IMAGE_NATIVE_HERO_ADJUST_SCALE = 1.12;

/** 一覧スロットカード — 位置調整用オーバースキャン */
export const HEADER_IMAGE_NATIVE_SLOT_ADJUST_SCALE = 1.12;

/** 0=上端寄せ / 50=中央 / 100=下端寄せ */
export function sanitizeHeaderImagePositionY(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return DEFAULT_HEADER_IMAGE_POSITION_Y;
  }
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function headerImageObjectPosition(positionY: number): string {
  return `center ${sanitizeHeaderImagePositionY(positionY)}%`;
}

/** RN cover 相当 — 親より高い画像を marginTop でずらす */
export function headerImageNativeMarginTop(
  containerHeight: number,
  positionY: number,
  heightScale = 2
): number {
  const y = sanitizeHeaderImagePositionY(positionY);
  const imageHeight = containerHeight * heightScale;
  return -((y / 100) * (imageHeight - containerHeight));
}

export function headerImageNativeImageHeight(
  containerHeight: number,
  heightScale = 2
): number {
  return containerHeight * heightScale;
}
