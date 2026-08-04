/**
 * Web `saveMeProSkin` / `deleteMeAccount` の Native 版
 */
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function requireApiBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  return base;
}

/**
 * Web `saveMeProSkin` 相当 — 解放チェック込みの API を正とする。
 */
export async function saveMeProSkinNative(
  planProBgVariant: ProfilePlanProBgVariant
): Promise<void> {
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/pro-skin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ planProBgVariant }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    condition?: string;
  };
  if (!res.ok) {
    throw new Error(data.condition ?? data.error ?? res.statusText);
  }
}

/** Web `dismissMeProSkinNotices` 相当 */
export async function dismissMeProSkinNoticesNative(
  dismissNoticeIds: readonly string[]
): Promise<void> {
  const ids = [...new Set(dismissNoticeIds)].filter(Boolean);
  if (ids.length === 0) return;
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/pro-skin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ dismissNoticeIds: ids }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }
}

export async function fetchProSkinStatusNative(): Promise<{
  unlockedIds: string[];
  savedId: string;
  isPro: boolean;
  progress: {
    posts: number;
    exactHits: number;
    maxWinStreak: number;
  };
  skins: {
    id: string;
    unlocked: boolean;
    conditionJa: string;
    conditionEn: string;
    owners: number;
  }[];
  ownerCounts: Record<string, number>;
  noticeIds: string[];
}> {
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/pro-skin`, {
    method: "GET",
    headers: { Authorization: headers.Authorization! },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    unlockedIds?: string[];
    savedId?: string;
    progress?: {
      isPro?: boolean;
      posts?: number;
      exactHits?: number;
      maxWinStreak?: number;
    };
    skins?: {
      id: string;
      unlocked: boolean;
      conditionJa: string;
      conditionEn: string;
      owners: number;
    }[];
    ownerCounts?: Record<string, number>;
    noticeIds?: string[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }
  return {
    unlockedIds: data.unlockedIds ?? [],
    savedId: data.savedId ?? "atmos",
    isPro: data.progress?.isPro === true,
    progress: {
      posts: data.progress?.posts ?? 0,
      exactHits: data.progress?.exactHits ?? 0,
      maxWinStreak: data.progress?.maxWinStreak ?? 0,
    },
    skins: data.skins ?? [],
    ownerCounts: data.ownerCounts ?? {},
    noticeIds: Array.isArray(data.noticeIds)
      ? data.noticeIds.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/** Web `deleteMeAccount` 相当 */
export async function deleteMeAccountNative(): Promise<void> {
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/account`, {
    method: "DELETE",
    headers: {
      Authorization: headers.Authorization!,
    },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
}
