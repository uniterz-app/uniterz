"use client";

import { auth } from "@/lib/firebase";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { invalidateAllProfileCache } from "@/app/component/profile/useProfile";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";
import {
  dispatchCumulativeRankingPatchMyProSkin,
} from "@/lib/rankings/cumulativeRankingInvalidate";
import { clearRankingSnapshotGenerationClientMem } from "@/lib/rankings/rankingSnapshotGenerationClient";
import { clearPeriodRankingsClientCache } from "@/lib/rankings/usePeriodRankingsBulk";
import { clearOpenSeasonRankingsClientCache } from "@/lib/rankings/useOpenSeasonRankingsBulk";

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
  clearRankingSnapshotGenerationClientMem();
  clearPeriodRankingsClientCache();
  clearOpenSeasonRankingsClientCache();
  // 自分の行は即反映。invalidate 再取得は gen CDN が古い u= のままだと上書きするのでしない
  dispatchCumulativeRankingPatchMyProSkin(user.uid, planProBgVariant);
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
