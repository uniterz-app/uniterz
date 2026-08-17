/**
 * アプリ上部ワードマーク棚（Web `Header` / Native `UniterzBrandShelfNative`）の一時非表示。
 * 成功カードなどフル画面コンテンツ向け。サブページ見出しとの二重表示もここで抑止する。
 */

let forceHidden = false;
let acquireCount = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getAppBrandShelfHidden(): boolean {
  return forceHidden || acquireCount > 0;
}

export function setAppBrandShelfHidden(next: boolean): void {
  if (forceHidden === next) return;
  forceHidden = next;
  emit();
}

/** CyberSubpageHeader など、マウント中だけ棚を隠す。戻り値の関数で解除。 */
export function acquireAppBrandShelfHidden(): () => void {
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

export function subscribeAppBrandShelfHidden(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
