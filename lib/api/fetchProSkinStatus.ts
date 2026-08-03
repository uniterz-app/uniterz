"use client";

import { auth } from "@/lib/firebase";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import type { ProSkinUnlockProgress } from "@/lib/profile/proSkinUnlock";

export type ProSkinStatusSkinRow = {
  id: ProfilePlanProBgVariant;
  unlocked: boolean;
  unlockKind: string;
  conditionJa: string;
  conditionEn: string;
  owners: number;
};

export type ProSkinStatusResponse = {
  ok: boolean;
  progress: ProSkinUnlockProgress;
  unlockedIds: ProfilePlanProBgVariant[];
  savedId: ProfilePlanProBgVariant;
  skins: ProSkinStatusSkinRow[];
  ownerCounts: Record<string, number>;
};

export async function fetchProSkinStatus(): Promise<ProSkinStatusResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  const res = await fetch("/api/me/pro-skin", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as ProSkinStatusResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
