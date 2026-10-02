/**
 * 招待モーダルは招待 ID ごとに初回だけ。
 * 保留 / 閉じる後は JOIN のリストから参加する。
 */

export const SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY =
  "uniterz:squad-battle-held-invites:v1";

export function parseHeldInviteIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
  } catch {
    return [];
  }
}

export function serializeHeldInviteIds(ids: readonly string[]): string {
  return JSON.stringify([...new Set(ids)]);
}

export function withHeldInviteId(
  ids: readonly string[],
  id: string
): string[] {
  return ids.includes(id) ? [...ids] : [...ids, id];
}

export function readHeldInviteIdsFromLocalStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return parseHeldInviteIds(
      window.localStorage.getItem(SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY)
    );
  } catch {
    return [];
  }
}

export function writeHeldInviteIdsToLocalStorage(
  ids: readonly string[]
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY,
      serializeHeldInviteIds(ids)
    );
  } catch {
    // private mode 等は無視
  }
}
