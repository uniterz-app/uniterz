/**
 * GET /api/users/search
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { UserSearchHit } from "../../../../../lib/users/searchUsersByHandle";

export type UserSearchApiResult = {
  ok: boolean;
  q?: string;
  users?: UserSearchHit[];
  hint?: string;
  error?: string;
};

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("login_required");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function requireBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("api_base_missing");
  }
  return base;
}

export async function searchUsersNative(q: string): Promise<UserSearchHit[]> {
  const base = requireBase();
  const headers = await authHeader();
  const qs = new URLSearchParams({ q: q.trim() });
  const res = await fetch(`${base}/api/users/search?${qs.toString()}`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as UserSearchApiResult;
  if (!res.ok) {
    throw new Error(data.error || `search_http_${res.status}`);
  }
  return Array.isArray(data.users) ? data.users : [];
}
