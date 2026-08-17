/**
 * welcome 中のアプリクロム。
 * - nav: 静止中だけ隠す（fly 開始で出す）
 * - brand: 試合タブ上のチュートリアル中は外の棚を隠し、ワードマークは世界カメラ内に置く。
 *   他タブへ出たら外の棚に戻す。
 */

type Listener = () => void;

let hidden = false;
const listeners = new Set<Listener>();

let brandHidden = false;
const brandListeners = new Set<Listener>();

export function getTutorialWelcomeChromeHidden(): boolean {
  return hidden;
}

export function setTutorialWelcomeChromeHidden(next: boolean): void {
  if (hidden === next) return;
  hidden = next;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeTutorialWelcomeChromeHidden(
  listener: Listener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTutorialWelcomeBrandHidden(): boolean {
  return brandHidden;
}

export function setTutorialWelcomeBrandHidden(next: boolean): void {
  if (brandHidden === next) return;
  brandHidden = next;
  brandListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeTutorialWelcomeBrandHidden(
  listener: Listener
): () => void {
  brandListeners.add(listener);
  return () => {
    brandListeners.delete(listener);
  };
}
