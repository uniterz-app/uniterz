"use client";

import { auth } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import {
  assertProfileTextsFreeOfGamblingTerms,
  ProfileGamblingTermsError,
} from "@/lib/profile/profileGamblingTerms";
import {
  dispatchCumulativeRankingInvalidate,
  dispatchCumulativeRankingPatchMyCountry,
  persistRankCountrySessionOverride,
} from "@/lib/rankings/cumulativeRankingInvalidate";
import type { PreferredLeague } from "@/lib/user/preferredLeague";
import { invalidateUserDocCache } from "@/lib/user/userDocCache";

/** 本人 users/{uid} のプロフィール欄をサーバー（Admin SDK）経由で merge 保存する */
export type SaveMeProfilePayload = {
  displayName: string;
  bio: string;
  photoURL: string;
  language: Language;
  countryCode: string | null;
  /** 未指定なら Firestore の既存値を維持 */
  photoCropY?: number;
  /** true のとき onboardingCompletedAt をサーバー時刻で付与 */
  completeOnboarding?: boolean;
  /** オンボーディングで選択したメインリーグ（nba / wc） */
  preferredLeague?: PreferredLeague;
};

export async function saveMeProfile(payload: SaveMeProfilePayload): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  assertProfileTextsFreeOfGamblingTerms(payload.displayName, payload.bio);

  const token = await user.getIdToken();
  const res = await fetch("/api/me/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    if (data?.error === "forbidden_gambling_terms") {
      throw new ProfileGamblingTermsError();
    }
    throw new Error(data?.error ?? res.statusText);
  }

  // シート閉鎖でランキングがアンマウントされても、次回表示で API 結果にマージできるよう保持
  persistRankCountrySessionOverride(user.uid, payload.countryCode);
  dispatchCumulativeRankingPatchMyCountry(user.uid, payload.countryCode);
  dispatchCumulativeRankingInvalidate();
  invalidateUserDocCache(user.uid);
}
