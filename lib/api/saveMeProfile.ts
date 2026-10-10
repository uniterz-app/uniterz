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
  /** 未指定なら Firestore の既存値を維持 */
  language?: Language;
  countryCode: string | null;
  /** 未指定なら Firestore の既存値を維持 */
  photoCropY?: number;
  /** 表示 TZ の手動設定。null で自動（端末）。未指定なら既存値を維持 */
  displayTimeZone?: string | null;
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

/** 表示言語だけ即保存（サイドメニュー「言語」） */
export async function saveMyLanguage(language: Language): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ languageOnly: true, language }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? res.statusText);
  }

  invalidateUserDocCache(user.uid);
}

/** プロフィール画像だけ即保存（名前など入力途中の欄は送らない） */
export async function saveMyPhotoURL(photoURL: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const token = await user.getIdToken();
  const res = await fetch("/api/me/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ photoOnly: true, photoURL }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? res.statusText);
  }

  dispatchCumulativeRankingInvalidate();
  invalidateUserDocCache(user.uid);
}
