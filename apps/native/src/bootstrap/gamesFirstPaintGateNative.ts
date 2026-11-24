/**
 * Games の初回カード描画（またはタイムアウト）まで、起動ホストと他タブ JS を待たせる。
 * プッシュ / 計測は対象外。
 */

const FALLBACK_MS = 2500;

let ready = false;
let armed = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function flushReady() {
  if (ready) return;
  ready = true;
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  for (const fn of [...listeners]) fn();
  listeners.clear();
}

/** Games のスケルトンが消えたとき。何度呼んでも 1 回だけ。 */
export function markGamesFirstPaintReady() {
  flushReady();
}

/** Main が載ったときに保険タイマーを始める。 */
export function armGamesFirstPaintGate(fallbackMs = FALLBACK_MS) {
  if (ready || armed) return;
  armed = true;
  fallbackTimer = setTimeout(() => flushReady(), fallbackMs);
}

export function isGamesFirstPaintReady() {
  return ready;
}

export function subscribeGamesFirstPaintReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
