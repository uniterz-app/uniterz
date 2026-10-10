/** アプリ起動時のプレシーズン参加ボーナス自動付与（Web / Native 共通） */
import {
  PRESEASON_BONUS_WINDOW_END_MS,
  PRESEASON_BONUS_WINDOW_START_MS,
} from "@/lib/units/preseasonBonus";

const requestedUids = new Set<string>();

/** 期間外・このセッションで依頼済みなら false（開幕後は API を叩かない） */
export function shouldRequestPreseasonBonus(uid: string, nowMs = Date.now()): boolean {
  if (!uid) return false;
  if (nowMs < PRESEASON_BONUS_WINDOW_START_MS) return false;
  if (nowMs >= PRESEASON_BONUS_WINDOW_END_MS) return false;
  return !requestedUids.has(uid);
}

/** apiBase は Web なら ""（同一オリジン） */
export async function requestPreseasonBonus(
  apiBase: string,
  uid: string,
  idToken: string
): Promise<boolean> {
  requestedUids.add(uid);
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/me/preseason-bonus`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      requestedUids.delete(uid);
      return false;
    }
    const data = (await res.json().catch(() => ({}))) as { granted?: boolean };
    return data.granted === true;
  } catch {
    requestedUids.delete(uid);
    return false;
  }
}
