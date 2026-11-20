/**
 * トレード Buzz の未読マーク（黄色の点）。TODAY UNITERZ と同じ色。
 * 公開 API の updatedAtMs を更新番号にする。
 */
export const TRADE_BUZZ_SEEN_STORAGE_KEY = "uniterz:trade-buzz-seen-version";

export function isTradeBuzzUnread(latest: string | null, seen: string | null): boolean {
  return latest != null && latest !== seen;
}
