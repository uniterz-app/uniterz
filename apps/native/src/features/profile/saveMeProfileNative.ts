/**
 * Native 向け `saveMeProfile`。Web と同じ `/api/me/profile` を叩く。
 */
import { auth } from "../../lib/firebase";
import type { Language } from "../../../../../lib/i18n/language";
import {
  assertProfileTextsFreeOfGamblingTerms,
  ProfileGamblingTermsError,
} from "../../../../../lib/profile/profileGamblingTerms";
import type { PreferredLeague } from "../../../../../lib/user/preferredLeague";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { invalidateProfileUserDocNative } from "./profileUserDocCacheNative";

export type SaveMeProfileNativePayload = {
  displayName: string;
  bio: string;
  photoURL: string;
  /** 未指定なら Firestore の既存値を維持 */
  language?: Language;
  countryCode: string | null;
  photoCropY?: number;
  /** 表示 TZ の手動設定。null で自動（端末）。未指定なら既存値を維持 */
  displayTimeZone?: string | null;
  completeOnboarding?: boolean;
  preferredLeague?: PreferredLeague;
};

export async function saveMeProfileNative(
  payload: SaveMeProfileNativePayload
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  assertProfileTextsFreeOfGamblingTerms(payload.displayName, payload.bio);

  const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
  if (!base) {
    throw new Error("API_BASE_URL_missing");
  }

  const token = await user.getIdToken();
  const res = await fetch(`${base}/api/me/profile`, {
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

  invalidateProfileUserDocNative(user.uid);
}

/** 表示言語だけ即保存（サイドメニュー「言語」） */
export async function saveMyLanguageNative(language: Language): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
  if (!base) {
    throw new Error("API_BASE_URL_missing");
  }

  const token = await user.getIdToken();
  const res = await fetch(`${base}/api/me/profile`, {
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

  invalidateProfileUserDocNative(user.uid);
}

/** プロフィール画像だけ即保存（名前など入力途中の欄は送らない） */
export async function saveMyPhotoURLNative(photoURL: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
  if (!base) {
    throw new Error("API_BASE_URL_missing");
  }

  const token = await user.getIdToken();
  const res = await fetch(`${base}/api/me/profile`, {
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

  invalidateProfileUserDocNative(user.uid);
}
