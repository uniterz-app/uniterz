/**
 * チュートリアル対象を画面内の見やすい位置へスクロールする。
 * コールアウトを下に置く想定で、対象を上寄りに寄せる。
 */

const IDEAL_RATIO_DEFAULT = 0.3;
const DELTA_EPS = 20;
/** smooth スクロール完了待ち（scrollend 非対応ブラウザ向け） */
const SCROLL_SETTLE_MS = 480;

/** 画面に固定。スクロールすると裏のリストだけ動き、モーダル出現がカクつく */
export function isPinnedTutorialTarget(targetId: string): boolean {
  return targetId === "games-stats-edge" || targetId.startsWith("nav-");
}

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

export function setTutorialScrollLocked(locked: boolean) {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(
    "[data-tutorial-scroll-lock='1']"
  ) as HTMLElement | null;
  if (!locked) {
    if (existing) {
      delete existing.dataset.tutorialScrollLock;
      existing.style.overflowY = "";
      existing.style.overscrollBehavior = "";
    }
    return;
  }
  const el = document.querySelector(
    '[data-tutorial-target="predict-scores"]'
  ) as HTMLElement | null;
  const scroller = existing ?? (el ? findScrollParent(el) : null);
  if (!scroller) return;
  scroller.dataset.tutorialScrollLock = "1";
  scroller.style.overflowY = "hidden";
  scroller.style.overscrollBehavior = "none";
}

export type ScrollTutorialTargetOptions = {
  behavior?: ScrollBehavior;
  /** 対象中心を置く位置（画面高さ比）。既定 0.3 */
  idealRatio?: number;
  /** top: 対象上端を topPad に合わせる（ヘッダー見切れ防止） */
  align?: "center" | "top";
  topPad?: number;
};

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForScrollSettle(
  scroller: HTMLElement | Window,
  behavior: ScrollBehavior
): Promise<void> {
  if (behavior !== "smooth") {
    return waitMs(32);
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      scroller.removeEventListener("scrollend", onEnd as EventListener);
      window.clearTimeout(fallback);
      resolve();
    };
    const onEnd = () => finish();
    const fallback = window.setTimeout(finish, SCROLL_SETTLE_MS);
    scroller.addEventListener("scrollend", onEnd as EventListener, {
      once: true,
    });
  });
}

/**
 * `[data-tutorial-target="…"]` を idealRatio 付近までスクロール。
 * ネストした overflow コンテナにも追従する。
 * @returns 実際にスクロールしたか
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
  if (isPinnedTutorialTarget(targetId)) return false;
  const pin = window.getComputedStyle(el).position;
  if (pin === "fixed" || pin === "sticky") return false;

  const behavior = opts?.behavior ?? "smooth";
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;

  const scroller = findScrollParent(el);
  const scrollerRect = scroller?.getBoundingClientRect();
  const viewTop = scrollerRect?.top ?? 0;
  const viewH = scrollerRect?.height ?? window.innerHeight;

  let remaining: number;
  if (opts?.align === "top") {
    const topPad = opts.topPad ?? 12;
    remaining = rect.top - (viewTop + topPad);
  } else {
    const idealRatio = opts?.idealRatio ?? IDEAL_RATIO_DEFAULT;
    const centerY = rect.top + rect.height / 2;
    const idealY = viewTop + viewH * idealRatio;
    remaining = centerY - idealY;
  }
  if (Math.abs(remaining) < DELTA_EPS) return false;

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
    return true;
  }
  return Math.abs(remaining) < DELTA_EPS ? false : true;
}

/**
 * スクロール完了（または即時反映）を待ってから resolve。
 * 枠測位の直前に使う。
 */
export async function scrollTutorialTargetIntoViewAsync(
  targetId: string,
  opts?: ScrollTutorialTargetOptions
): Promise<boolean> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  const el = document.querySelector(
    `[data-tutorial-target="${targetId}"]`
  ) as HTMLElement | null;
  if (!el) return false;

  const behavior = opts?.behavior ?? "smooth";
  const moved = scrollTutorialTargetIntoView(targetId, opts);
  if (!moved) {
    await waitMs(16);
    return false;
  }
  const scroller = findScrollParent(el) ?? window;
  await waitForScrollSettle(scroller, behavior);
  return true;
}
