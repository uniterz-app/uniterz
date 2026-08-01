/**
 * Native — チュートリアルからリザルト詳細の開閉を依頼
 */

type Handlers = {
  onOpen: () => void;
  onClose: () => void;
};

let handlers: Handlers | null = null;

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
