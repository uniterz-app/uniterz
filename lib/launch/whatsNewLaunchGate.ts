/**
 * お知らせが「出す / 出さない」を決めるまで、ほかの起動シートを待たせる。
 * 決めたあとに枠が空いていれば、次のシートが出る。
 */

type Listener = () => void;

let decided = false;
const listeners = new Set<Listener>();

export function isWhatsNewLaunchDecided(): boolean {
  return decided;
}

export function markWhatsNewLaunchDecided(): void {
  if (decided) return;
  decided = true;
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeWhatsNewLaunchDecided(listener: Listener): () => void {
  listeners.add(listener);
  if (decided) listener();
  return () => {
    listeners.delete(listener);
  };
}
