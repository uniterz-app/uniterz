"use client";

import { auth } from "@/lib/firebase";
import {
  normalizeVisitedArenaIds,
  type ArenaPassportId,
} from "@/lib/profile/arenaPassport";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";
import { invalidateAllProfileCache } from "@/app/component/profile/useProfile";

/** 本人の訪問済みアリーナを 1 件トグル保存 */
export async function saveMeArenaPassportToggle(
  arenaId: ArenaPassportId
): Promise<ArenaPassportId[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/arena-passport", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ arenaId }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    visitedArenaIds?: unknown;
  };
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  if (!Array.isArray(data.visitedArenaIds)) {
    throw new Error("invalid_response");
  }
  invalidateUserDocCache(user.uid);
  invalidateAllProfileCache();
  return normalizeVisitedArenaIds(data.visitedArenaIds);
}
