/**
 * タブスライド中のロック。スライドの途中で次のタブ移動やスタック reset が入ると、
 * 画面が横にずれたまま止まり、ナビバーと棚だけ見える空画面になる。
 * transitionEnd（MainTabNavigator の screenListeners）で解除する。
 */
import { TAB_PAGER_TRANSITION_MS } from "./tabPagerTransition";

/** transitionEnd が来なかったときの保険 */
const SAFETY_MS = TAB_PAGER_TRANSITION_MS + 400;

let busy = false;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let queue: Array<() => void> = [];

function flush(): void {
  busy = false;
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  const run = queue;
  queue = [];
  for (const fn of run) fn();
}

function armSafety(): void {
  if (safetyTimer) clearTimeout(safetyTimer);
  safetyTimer = setTimeout(flush, SAFETY_MS);
}

export function isTabTransitionBusy(): boolean {
  return busy;
}

export function beginTabTransition(): void {
  busy = true;
  armSafety();
}

export function endTabTransition(): void {
  flush();
}

/** 進行中（またはこれから始まる）タブスライドが終わってから実行する */
export function runAfterTabTransition(fn: () => void): void {
  queue.push(fn);
  armSafety();
}
