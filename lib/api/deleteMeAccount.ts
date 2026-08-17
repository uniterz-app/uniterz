"use client";

import { auth } from "@/lib/firebase";
import { invalidateAllProfileCache } from "@/app/component/profile/useProfile";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";

/** 本人アカウント削除（Web） */
export async function deleteMeAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/account", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }

  invalidateUserDocCache(user.uid);
  invalidateAllProfileCache();
}
