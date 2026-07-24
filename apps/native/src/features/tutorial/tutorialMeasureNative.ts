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

type MeasureFn = () => Promise<TutorialMeasureRect | null>;

export type TutorialScrollHost = {
  /** 現在の contentOffset.y */
  getOffsetY: () => number;
  /** 相対スクロール（正で下へ） */
  scrollBy: (dy: number, animated: boolean) => void;
};

const registry = new Map<string, MeasureFn>();
const listeners = new Set<() => void>();
let scrollHost: TutorialScrollHost | null = null;

export function registerTutorialTarget(
  id: string,
  measure: MeasureFn
): () => void {
  registry.set(id, measure);
  listeners.forEach((l) => l());
  return () => {
    if (registry.get(id) === measure) registry.delete(id);
    listeners.forEach((l) => l());
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
 * 対象を画面上寄りへスクロール（Web `scrollTutorialTargetIntoView` 相当）
 */
export async function scrollTutorialTargetIntoViewNative(
  id: string,
  opts?: { animated?: boolean; idealRatio?: number }
): Promise<boolean> {
  if (!scrollHost) return false;
  const rect = await measureTutorialTarget(id);
  if (!rect || rect.width < 1 || rect.height < 1) return false;
  const winH = Dimensions.get("window").height;
  const idealRatio = opts?.idealRatio ?? 0.3;
  const centerY = rect.y + rect.height / 2;
  const idealY = winH * idealRatio;
  const delta = centerY - idealY;
  if (Math.abs(delta) < 20) return true;
  scrollHost.scrollBy(delta, opts?.animated !== false);
  return true;
}

export function subscribeTutorialTargets(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
