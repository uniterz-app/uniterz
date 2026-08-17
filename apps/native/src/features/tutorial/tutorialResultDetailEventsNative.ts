/**
 * Native — チュートリアルからリザルト詳細の開閉を依頼／詳細が開いた通知
 */

type Handlers = {
  onOpen: () => void;
  onClose: () => void;
};

let handlers: Handlers | null = null;

const openedListeners = new Set<() => void>();
const closedListeners = new Set<() => void>();

export function setTutorialResultDetailHandlers(
  next: Handlers | null
): () => void {
  handlers = next;
  return () => {
    if (handlers === next) handlers = null;
  };
}

export function requestTutorialResultDetailOpenNative(): void {
  handlers?.onOpen();
}

export function requestTutorialResultDetailCloseNative(): void {
  handlers?.onClose();
}

/** DETAIL タップ等で詳細が開いたとき — ホストが resultDetail 位相へ進める */
export function notifyTutorialResultDetailOpenedNative(): void {
  for (const cb of openedListeners) cb();
}

export function subscribeTutorialResultDetailOpenedNative(
  cb: () => void
): () => void {
  openedListeners.add(cb);
  return () => {
    openedListeners.delete(cb);
  };
}

export function notifyTutorialResultDetailClosedNative(): void {
  for (const cb of closedListeners) cb();
}

export function subscribeTutorialResultDetailClosedNative(
  cb: () => void
): () => void {
  closedListeners.add(cb);
  return () => {
    closedListeners.delete(cb);
  };
}
