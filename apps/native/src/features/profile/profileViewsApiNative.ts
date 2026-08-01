/** Web `/api/profile/views` 相当 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

function requireApiBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  return base;
}

async function authHeadersOptional(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return { "Content-Type": "application/json" };
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function authHeadersRequired(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function recordProfileViewNative(targetUid: string): Promise<void> {
  const res = await fetch(`${requireApiBase()}/api/profile/views`, {
    method: "POST",
    headers: await authHeadersRequired(),
    body: JSON.stringify({ targetUid }),
  });
  if (!res.ok) throw new Error("profile_view_record_failed");
}

/** 任意ユーザーの累計閲覧数（公開） */
export async function fetchProfileViewCountNative(
  targetUid: string
): Promise<number> {
  const qs = new URLSearchParams({ uid: targetUid });
  const res = await fetch(`${requireApiBase()}/api/profile/views?${qs}`, {
    method: "GET",
    headers: await authHeadersOptional(),
  });
  if (!res.ok) throw new Error("profile_view_count_failed");
  const data = (await res.json()) as { count?: unknown };
  return typeof data.count === "number" && Number.isFinite(data.count)
    ? Math.max(0, Math.floor(data.count))
    : 0;
}

/** @deprecated `fetchProfileViewCountNative` を使う */
export async function fetchMyProfileViewCountNative(): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not authenticated");
  return fetchProfileViewCountNative(uid);
}
