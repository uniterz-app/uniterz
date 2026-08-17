/**
 * チュートリアル対象の measureInWindow 登録（Web data-tutorial-target 相当）
 */
import { Dimensions } from "react-native";

export type TutorialMeasureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TutorialScrollViewport = {
  /** ウィンドウ座標での可視上端 */
  y: number;
  height: number;
};

export type TutorialScrollHost = {
  /** 現在の contentOffset.y */
  getOffsetY: () => number;
  /** 相対スクロール（正で下へ） */
  scrollBy: (dy: number, animated: boolean) => void;
  /**
   * ScrollView の画面上の可視矩形。
   * モーダル内などウィンドウ全体と可視領域が違うときに idealY を正しくする。
   */
  getViewportInWindow?: () => Promise<TutorialScrollViewport | null>;
  /** ユーザー操作のスクロール可否（プログラム scroll は別） */
  setScrollEnabled?: (enabled: boolean) => void;
};

const registry = new Map<string, MeasureFn>();
const listeners = new Set<() => void>();
let scrollHost: TutorialScrollHost | null = null;
/** スクロール／測位中は subscribe 再測を抑える */
let measureQuietUntil = 0;
let emitTimer: ReturnType<typeof setTimeout> | null = null;

type MeasureFn = () => Promise<TutorialMeasureRect | null>;

/** RN ScrollView の animated scroll が概ね止まるまでの待ち */
const SCROLL_SETTLE_MS = 480;
const TARGET_CHANGE_DEBOUNCE_MS = 90;
/** モーダル内は小さな補正スクロールも内容ジャンプに見えるので閾値を上げる */
const SCROLL_DELTA_EPS = 36;

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitTargetsChangedDebounced() {
  if (emitTimer) clearTimeout(emitTimer);
  emitTimer = setTimeout(() => {
    emitTimer = null;
    if (Date.now() < measureQuietUntil) return;
    listeners.forEach((l) => {
      try {
        l();
      } catch {
        /* ignore */
      }
    });
  }, TARGET_CHANGE_DEBOUNCE_MS);
}

/** 測位・スクロール中は subscribe 経由の再測を止める */
export function quietTutorialTargetListeners(ms: number) {
  measureQuietUntil = Math.max(measureQuietUntil, Date.now() + ms);
}

export function registerTutorialTarget(
  id: string,
  measure: MeasureFn
): () => void {
  registry.set(id, measure);
  emitTargetsChangedDebounced();
  return () => {
    if (registry.get(id) === measure) registry.delete(id);
    emitTargetsChangedDebounced();
  };
}

export function registerTutorialScrollHost(
  host: TutorialScrollHost
): () => void {
  scrollHost = host;
  return () => {
    if (scrollHost === host) scrollHost = null;
  };
}

/** チュートリアル中のユーザー操作スクロールを止める／戻す */
export function setTutorialScrollEnabledNative(enabled: boolean) {
  scrollHost?.setScrollEnabled?.(enabled);
}

export async function measureTutorialTarget(
  id: string
): Promise<TutorialMeasureRect | null> {
  const fn = registry.get(id);
  if (!fn) return null;
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * 対象をスクロール可視領域内の見やすい位置へ寄せる。
 * animated 時は停止後に resolve し、直後の測位がずれないようにする。
 */
export async function scrollTutorialTargetIntoViewNative(
  id: string,
  opts?: {
    animated?: boolean;
    idealRatio?: number;
    /** top: 対象上端を topPad に合わせる（ヘッダー見切れ防止） */
    align?: "center" | "top";
    topPad?: number;
  }
): Promise<boolean> {
  if (!scrollHost) return false;
  const rect = await measureTutorialTarget(id);
  if (!rect || rect.width < 1 || rect.height < 1) return false;

  const winH = Dimensions.get("window").height;
  const viewport =
    (await scrollHost.getViewportInWindow?.()) ??
    ({ y: 0, height: winH } satisfies TutorialScrollViewport);
  if (viewport.height < 32) return false;

  const animated = opts?.animated !== false;
  let delta: number;
  if (opts?.align === "top") {
    const topPad = opts.topPad ?? 12;
    delta = rect.y - (viewport.y + topPad);
  } else {
    const idealRatio = opts?.idealRatio ?? 0.3;
    const centerY = rect.y + rect.height / 2;
    const idealY = viewport.y + viewport.height * idealRatio;
    delta = centerY - idealY;
  }
  if (Math.abs(delta) < SCROLL_DELTA_EPS) return false;

  quietTutorialTargetListeners(animated ? SCROLL_SETTLE_MS + 80 : 120);
  scrollHost.scrollBy(delta, animated);
  if (animated) {
    await waitMs(SCROLL_SETTLE_MS);
  } else {
    await waitMs(48);
  }
  return true;
}

export function subscribeTutorialTargets(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** スクロール・レイアウト確定後にコーチの穴測定を促す */
export function notifyTutorialTargetsChanged(): void {
  emitTargetsChangedDebounced();
}
