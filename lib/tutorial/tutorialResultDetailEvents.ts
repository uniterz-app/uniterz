/**
 * チュートリアル — リザルト詳細の開閉を一覧側へ依頼する
 */

export const TUTORIAL_RESULT_DETAIL_OPEN_EVENT =
  "uniterz:tutorial-result-detail-open";
export const TUTORIAL_RESULT_DETAIL_CLOSE_EVENT =
  "uniterz:tutorial-result-detail-close";

export function requestTutorialResultDetailOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TUTORIAL_RESULT_DETAIL_OPEN_EVENT));
}

export function requestTutorialResultDetailClose(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TUTORIAL_RESULT_DETAIL_CLOSE_EVENT));
}
