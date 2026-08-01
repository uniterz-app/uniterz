/**
 * Web `saveMeProSkin` / `deleteMeAccount` の Native 版（絶対 URL）
 */
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function requireApiBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  return base;
}

/** Web `saveMeProSkin` 相当 */
export async function saveMeProSkinNative(
  planProBgVariant: ProfilePlanProBgVariant
): Promise<void> {
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/pro-skin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ planProBgVariant }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
}

/** Web `deleteMeAccount` 相当 */
export async function deleteMeAccountNative(): Promise<void> {
  const base = requireApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/me/account`, {
    method: "DELETE",
    headers: {
      Authorization: headers.Authorization!,
    },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
}
