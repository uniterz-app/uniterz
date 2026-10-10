/**
 * 起動時モーダル（スクワッドバトル開催・Unit 獲得など）を同時に 1 枚だけ出すための枠（Web / Native 共通）
 */

let owner: string | null = null;
/** この起動中に一度でも枠を取った id */
const shownIds = new Set<string>();
const listeners = new Set<() => void>();

/** 空いていれば確保して true */
export function claimLaunchPromptSlot(id: string): boolean {
  if (owner != null && owner !== id) return false;
  owner = id;
  shownIds.add(id);
  return true;
}

export function releaseLaunchPromptSlot(id: string): void {
  if (owner !== id) return;
  owner = null;
  for (const fn of [...listeners]) fn();
}

/** この起動中に自分以外の起動時モーダルが出たか */
export function hasOtherLaunchPromptShown(id: string): boolean {
  for (const shown of shownIds) if (shown !== id) return true;
  return false;
}

export function isLaunchPromptSlotFree(): boolean {
  return owner == null;
}

/** 枠が空いたときに呼ばれる */
export function subscribeLaunchPromptSlotFree(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
