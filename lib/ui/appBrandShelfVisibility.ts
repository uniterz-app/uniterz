/**
 * アプリ上部ワードマーク棚（Web `Header` / Native `UniterzBrandShelfNative`）の一時非表示。
 * 成功カードなどフル画面コンテンツ向け。
 */

let hidden = false;
const listeners = new Set<() => void>();

export function getAppBrandShelfHidden(): boolean {
  return hidden;
}

export function setAppBrandShelfHidden(next: boolean): void {
  if (hidden === next) return;
  hidden = next;
  listeners.forEach((listener) => listener());
}

export function subscribeAppBrandShelfHidden(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
