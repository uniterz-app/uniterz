/**
 * サイドメニューからチュートリアル再開するとき、
 * 元画面（プロフィール等）が一瞬見えるのを防ぐ全面暗幕。
 * welcome の暗幕と同じ色。welcome が載ったら外す。
 */

const WORLD_VOID = "#02060c";

type Listener = () => void;

let cover = false;
let failsafe: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

const FAILSAFE_MS = 2500;

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

function clearFailsafe(): void {
  if (failsafe) {
    clearTimeout(failsafe);
    failsafe = null;
  }
}

export function getTutorialRestartCover(): boolean {
  return cover;
}

export function getTutorialRestartCoverColor(): string {
  return WORLD_VOID;
}

export function setTutorialRestartCover(next: boolean): void {
  clearFailsafe();
  if (cover !== next) {
    cover = next;
    notify();
  }
  if (next) {
    failsafe = setTimeout(() => {
      failsafe = null;
      if (!cover) return;
      cover = false;
      notify();
    }, FAILSAFE_MS);
  }
}

export function subscribeTutorialRestartCover(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
