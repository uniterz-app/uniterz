/**
 * チュートリアル表示中に EventGate のイベントモーダルを抑止する。
 */

type Listener = (blocking: boolean) => void;

let blocking = false;
const listeners = new Set<Listener>();

export function isAppTutorialBlockingEvents(): boolean {
  return blocking;
}

export function setAppTutorialBlockingEvents(next: boolean): void {
  if (blocking === next) return;
  blocking = next;
  listeners.forEach((fn) => fn(blocking));
}

export function subscribeAppTutorialBlockingEvents(
  fn: Listener
): () => void {
  listeners.add(fn);
  fn(blocking);
  return () => {
    listeners.delete(fn);
  };
}
