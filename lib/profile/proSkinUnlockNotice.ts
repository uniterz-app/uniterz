/**
 * Pro Skin マイルストーン解放通知（Native はアプリ起動・復帰時）。
 *
 * 方針:
 * - users.proSkinUnlockNoticeIds: Pro 中のライブ達成（settle / 順位確定 / 紹介が積む）
 * - users.proSkinLockedNoticeIds: Free 中に条件を満たした分（Pro 誘導用）。
 *   1.0.4 以前の Native はプロフィールで proSkinUnlockNoticeIds だけを「適用」ボタン付きで出すため分ける
 * - 表示時に今 Pro なら両方を「解放」、Free なら両方を「Pro で解放」として出す
 * - Free→Pro 遡及解放は unlockedIds に入るが notice には載せない（サイレント）
 * - ローカル seen は二重表示防止の保険
 */
import {
  diffNewlyUnlockedProSkins,
  getProSkinUnlockEntry,
  type ProSkinUnlockCatalogEntry,
} from "@/lib/profile/proSkinUnlock";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export const PRO_SKIN_UNLOCK_NOTICE_SEEN_PREFIX =
  "uniterz.proSkin.unlockSeen.v2";

export function proSkinUnlockNoticeSeenKey(uid: string): string {
  return `${PRO_SKIN_UNLOCK_NOTICE_SEEN_PREFIX}.${uid}`;
}

export function parseProSkinUnlockSeenIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function serializeProSkinUnlockSeenIds(ids: Iterable<string>): string {
  return JSON.stringify([...ids]);
}

/** users.proSkinUnlockNoticeIds / users.proSkinLockedNoticeIds */
export function parseProSkinUnlockNoticeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/** 両キューの和（Pro 中の解放 → Free 中の獲得の順・重複なし） */
export function mergeProSkinNoticeQueues(userData: Record<string, unknown>): string[] {
  return [
    ...new Set([
      ...parseProSkinUnlockNoticeIds(userData.proSkinUnlockNoticeIds),
      ...parseProSkinUnlockNoticeIds(userData.proSkinLockedNoticeIds),
    ]),
  ];
}

/** プレビュー用 — 実際の模様を1枚ヒーロー表示 */
export const PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS: readonly ProfilePlanProBgVariant[] =
  ["beast-viper"];

export function resolveProSkinUnlockNoticeEntries(
  ids: readonly string[]
): ProSkinUnlockCatalogEntry[] {
  const out: ProSkinUnlockCatalogEntry[] = [];
  for (const id of ids) {
    const entry = getProSkinUnlockEntry(id);
    if (entry && entry.unlock.kind !== "pro") out.push(entry);
  }
  return out;
}

export function filterUnseenMilestoneUnlocks(
  noticeIds: readonly string[],
  seenIds: ReadonlySet<string>
): ProfilePlanProBgVariant[] {
  return diffNewlyUnlockedProSkins(noticeIds, seenIds) as ProfilePlanProBgVariant[];
}
