/**
 * チュートリアル対象を画面内の見やすい位置へスクロールする。
 * コールアウトを下に置く想定で、対象を上寄りに寄せる。
 */

const IDEAL_RATIO_DEFAULT = 0.3;
const DELTA_EPS = 20;

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export type ScrollTutorialTargetOptions = {
  behavior?: ScrollBehavior;
  /** 対象中心を置く位置（画面高さ比）。既定 0.3 */
  idealRatio?: number;
};

/**
 * `[data-tutorial-target="…"]` を idealRatio 付近までスクロール。
 * ネストした overflow コンテナにも追従する。
 */
export function scrollTutorialTargetIntoView(
  targetId: string,
  opts?: ScrollTutorialTargetOptions
): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  const el = document.querySelector(
    `[data-tutorial-target="${targetId}"]`
  ) as HTMLElement | null;
  if (!el) return false;

  const behavior = opts?.behavior ?? "smooth";
  const idealRatio = opts?.idealRatio ?? IDEAL_RATIO_DEFAULT;
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;

  const vh = window.innerHeight;
  const centerY = rect.top + rect.height / 2;
  const idealY = vh * idealRatio;
  let remaining = centerY - idealY;
  if (Math.abs(remaining) < DELTA_EPS) return true;

  const scroller = findScrollParent(el);
  if (scroller) {
    const before = scroller.scrollTop;
    if (behavior === "smooth" && typeof scroller.scrollBy === "function") {
      scroller.scrollBy({ top: remaining, behavior: "smooth" });
      return true;
    }
    scroller.scrollTop = before + remaining;
    remaining -= scroller.scrollTop - before;
  }

  if (Math.abs(remaining) >= DELTA_EPS) {
    window.scrollBy({ top: remaining, left: 0, behavior });
  }
  return true;
}
