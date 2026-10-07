/**
 * Web `saveMeArenaPassportToggle` 相当 — `/api/me/arena-passport`。
 */
import { auth } from "../../lib/firebase";
import {
  normalizeVisitedArenaIds,
  type ArenaPassportId,
} from "../../../../../lib/profile/arenaPassport";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { invalidateProfileUserDocNative } from "./profileUserDocCacheNative";

export async function saveMeArenaPassportToggleNative(
  arenaId: ArenaPassportId
): Promise<ArenaPassportId[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");

  const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
  if (!base) throw new Error("API_BASE_URL_missing");

  const token = await user.getIdToken();
  const res = await fetch(`${base}/api/me/arena-passport`, {
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
  invalidateProfileUserDocNative(user.uid);
  return normalizeVisitedArenaIds(data.visitedArenaIds);
}
