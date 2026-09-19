/**
 * 予想投稿成功後など、文脈のあるタイミングで通知許可プリマーを出す。
 * Host が購読し、非対象時は即 onSettled。
 */

type Settled = () => void;
type Handler = (onSettled: Settled) => void;

let handler: Handler | null = null;

export function subscribePushPermissionPrimerRequests(
  next: Handler
): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

/** プリマー表示を要求。表示しない／閉じたあと onSettled */
export function requestPushPermissionPrimerAfterPredict(
  onSettled?: Settled
): void {
  const done = onSettled ?? (() => {});
  if (!handler) {
    done();
    return;
  }
  handler(done);
}
