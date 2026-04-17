import { flushSync } from "react-dom";

/** View Transitions API（共有要素に近いクロスフェード＋モーフ）が使えるか */
export function supportsViewTransitionApi(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as Document & { startViewTransition?: unknown })
      .startViewTransition === "function"
  );
}

/**
 * `view-transition-name` 用に gameId を安全なトークンへ。
 * 同一文字列を一覧カードとオーバーレイの `sharedTransitionBaseKey` に渡す。
 */
export function safeViewTransitionToken(raw: string): string {
  const s = String(raw ?? "").replace(/[^a-zA-Z0-9_-]/g, "_");
  return (s.length > 0 ? s : "game").slice(0, 200);
}

type StartOptions = {
  /** true のとき通常の setState のみ（API 非対応・ユーザーが動きを減らす設定時） */
  skip?: boolean;
  /** 遷移アニメ完了後（キャンセル時も finally で呼ぶ） */
  onFinished?: () => void;
};

type ViewTransitionHandle = { finished: Promise<void> };

/**
 * DOM 更新を View Transition で包む。React の描画を同一タスク内で確定させるため flushSync を使う。
 */
export function startDomViewTransition(
  update: () => void,
  options?: StartOptions
): void {
  const onFinished = options?.onFinished;
  if (options?.skip || !supportsViewTransitionApi()) {
    update();
    if (onFinished) queueMicrotask(onFinished);
    return;
  }
  const doc = document as Document & {
    startViewTransition: (cb: () => void | Promise<void>) => ViewTransitionHandle;
  };
  const vt = doc.startViewTransition(() => {
    flushSync(update);
  });
  if (onFinished) {
    void vt.finished.finally(onFinished);
  }
}
