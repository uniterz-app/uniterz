/**
 * 上部ワードマーク棚の右端「？」。titleInBrandShelf のサブページがフォーカス中だけ登録する。
 * 棚はスタック画面枠の外（MainTab）に重なっているため、押下処理だけをここで受け渡す。
 * ワードマークと同じくリース配列 — 途中の解除で直前の登録に戻す。
 */

export type AppBrandShelfHelpAction = { id: number; onPress: () => void };

let leaseSeq = 0;
const leases: AppBrandShelfHelpAction[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getAppBrandShelfHelpAction(): AppBrandShelfHelpAction | null {
  return leases[leases.length - 1] ?? null;
}

export function acquireAppBrandShelfHelpAction(onPress: () => void): () => void {
  const lease: AppBrandShelfHelpAction = { id: ++leaseSeq, onPress };
  leases.push(lease);
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const idx = leases.findIndex((l) => l.id === lease.id);
    if (idx >= 0) leases.splice(idx, 1);
    emit();
  };
}

export function subscribeAppBrandShelfHelpAction(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
