/**
 * Skia Jersey `SkPicture` の LRU。同色・同サイズの再構築を避ける。
 */
import type { SkPicture } from "@shopify/react-native-skia";

const MAX_ENTRIES = 48;

type Entry = { picture: SkPicture; touched: number };

const cache = new Map<string, Entry>();
let touchSeq = 0;

export function jerseyPictureCacheKey(
  size: number,
  accent: string,
  accentEnd: string | undefined,
  density: string
): string {
  return `${size}|${accent.trim().toLowerCase()}|${(accentEnd ?? "").trim().toLowerCase()}|${density}`;
}

export function getCachedJerseyPicture(key: string): SkPicture | null {
  const hit = cache.get(key);
  if (!hit) return null;
  hit.touched = ++touchSeq;
  return hit.picture;
}

export function setCachedJerseyPicture(key: string, picture: SkPicture): void {
  cache.set(key, { picture, touched: ++touchSeq });
  if (cache.size <= MAX_ENTRIES) return;
  let oldestKey: string | null = null;
  let oldestTouch = Infinity;
  for (const [k, v] of cache) {
    if (v.touched < oldestTouch) {
      oldestTouch = v.touched;
      oldestKey = k;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}
