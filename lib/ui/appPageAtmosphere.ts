/**
 * ルートのアプリ背景（AppPageBackground）の差し替え。
 * PRO LEAGUE ボード中は穴あきメタルを画面全体（ヘッダー下含む）に載せる。
 */

export type AppPageAtmosphere = "default" | "pro-league";

let atmosphere: AppPageAtmosphere = "default";
let acquireCount = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function getAppPageAtmosphere(): AppPageAtmosphere {
  return acquireCount > 0 ? "pro-league" : atmosphere;
}

export function setAppPageAtmosphere(next: AppPageAtmosphere) {
  if (atmosphere === next) return;
  atmosphere = next;
  emit();
}

/** PRO LEAGUE 画面マウント中だけ全体背景を差し替える */
export function acquireAppPageAtmosphere(
  next: AppPageAtmosphere
): () => void {
  if (next === "default") {
    return () => {};
  }
  acquireCount += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    acquireCount = Math.max(0, acquireCount - 1);
    emit();
  };
}

export function subscribeAppPageAtmosphere(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
