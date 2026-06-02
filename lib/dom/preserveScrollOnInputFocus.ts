import type { FocusEvent } from "react";

/** ページ内 input フォーカス時の意図しない縦スクロール（ヨレ）を抑える */
export function preserveScrollOnInputFocus(
  e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  const y = window.scrollY;
  const restore = () => {
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  };
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  // 親スクロール内なら最小限だけ寄せる
  if (e.target.closest("[data-scroll-stable]")) {
    e.target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}
