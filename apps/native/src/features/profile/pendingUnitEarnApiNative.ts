/**
 * Native — pending Unit 獲得演出 API
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type {
  PendingUnitEarnClaimPayload,
  PendingUnitEarnListPayload,
} from "../../../../../lib/units/pendingUnitEarnTypes";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です。");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function requireBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。apps/native/.env を確認してください。"
    );
  }
  return base;
}

export async function fetchMePendingUnitEarnsNative(): Promise<PendingUnitEarnListPayload> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/pending-unit-earns`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as PendingUnitEarnListPayload;
  if (!res.ok) {
    return {
      ok: false,
      entries: [],
      error: data?.error || res.statusText || `failed (${res.status})`,
    };
  }
  return {
    ok: true,
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

export async function claimMePendingUnitEarnsNative(
  ids: string[]
): Promise<PendingUnitEarnClaimPayload> {
  if (ids.length === 0) return { ok: true, claimed: 0 };
  const base = requireBase();
  const headers = {
    ...(await authHeader()),
    "Content-Type": "application/json",
  };
  const res = await fetch(`${base}/api/me/pending-unit-earns`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids }),
  });
  const data = (await res.json().catch(() => ({}))) as PendingUnitEarnClaimPayload;
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || res.statusText || `failed (${res.status})`,
    };
  }
  return { ok: true, claimed: data.claimed ?? 0 };
}
