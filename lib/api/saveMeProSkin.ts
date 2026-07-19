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
