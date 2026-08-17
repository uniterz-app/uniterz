/**
 * サイドバーからチュートリアル再開するとき、タブスライドを一時停止する。
 * scene の RN Animated（translateX）と welcome の BlurView が重なると
 * iOS で画面が真っ黒になるため。
 */

type Listener = () => void;

let quietUntilMs = 0;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

/** 指定ミリ秒だけタブ遷移アニメを none にする */
export function armTutorialTabTransitionQuiet(durationMs = 1400): void {
  const until = Date.now() + durationMs;
  if (until > quietUntilMs) quietUntilMs = until;
  notify();
  setTimeout(() => {
    if (Date.now() >= quietUntilMs) notify();
  }, durationMs + 16);
}

export function getTutorialTabTransitionQuiet(): boolean {
  return Date.now() < quietUntilMs;
}

export function subscribeTutorialTabTransitionQuiet(
  listener: Listener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
