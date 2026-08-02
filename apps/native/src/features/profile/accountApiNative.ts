/**
 * Web `saveMeProSkin` / `deleteMeAccount` の Native 版
 */
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { auth, db } from "../../lib/firebase";
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

/**
 * Web `saveMeProSkin` 相当。
 * Native は API 待ちで固まりやすいので Firestore 直書きを正とし、
 * API はベストエフォートで追従させる。
 */
export async function saveMeProSkinNative(
  planProBgVariant: ProfilePlanProBgVariant
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  await setDoc(
    doc(db, "users", user.uid),
    {
      planProBgVariant,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const base = getUniterzApiBaseUrl();
  if (!base) return;
  void (async () => {
    try {
      const headers = await authHeaders();
      await fetch(`${base}/api/me/pro-skin`, {
        method: "POST",
        headers,
        body: JSON.stringify({ planProBgVariant }),
      });
    } catch {
      /* Firestore 保存済みなので無視 */
    }
  })();
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
