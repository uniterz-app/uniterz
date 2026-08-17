"use client";

import { auth } from "@/lib/firebase";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { invalidateAllProfileCache } from "@/app/component/profile/useProfile";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";

export async function saveMeProSkin(
  planProBgVariant: ProfilePlanProBgVariant
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/pro-skin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planProBgVariant }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }

  invalidateUserDocCache(user.uid);
  invalidateAllProfileCache();
}

/** ライブ達成モーダルを閉じたあと notice キューをサーバから落とす */
export async function dismissMeProSkinNotices(
  dismissNoticeIds: readonly string[]
): Promise<void> {
  const ids = [...new Set(dismissNoticeIds)].filter(Boolean);
  if (ids.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/pro-skin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dismissNoticeIds: ids }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }

  invalidateUserDocCache(user.uid);
}
