/**
 * アプリ上部ワードマーク棚（Web `Header` / Native `UniterzBrandShelfNative`）の一時非表示。
 * 成功カードなどフル画面コンテンツ向け。サブページ見出しとの二重表示もここで抑止する。
 *
 * - hidden: 見た目だけ消す（高さは残す＝タブが跳ねない）
 * - collapsed: レイアウトからも外す（スプラッシュ等の真フルスクリーン向け）
 */

let forceHidden = false;
let acquireCount = 0;
let collapseCount = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getAppBrandShelfHidden(): boolean {
  return forceHidden || acquireCount > 0 || collapseCount > 0;
}

/** 棚をレイアウトから外す（高さ 0）。hidden の hold より強い。 */
export function getAppBrandShelfCollapsed(): boolean {
  return collapseCount > 0;
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

/** スプラッシュ等: マウント中は棚をレイアウトから外す。 */
export function acquireAppBrandShelfCollapsed(): () => void {
  collapseCount += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    collapseCount = Math.max(0, collapseCount - 1);
    emit();
  };
}

export function subscribeAppBrandShelfHidden(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
