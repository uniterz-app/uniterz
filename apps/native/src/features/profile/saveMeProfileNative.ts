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
  language: Language;
  countryCode: string | null;
  photoCropY?: number;
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
