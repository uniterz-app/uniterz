/**
 * Web `lib/api/fetchMeRedemptions` 相当
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type {
  RedemptionApplicationInput,
  RedemptionListPayload,
  RedemptionRequest,
} from "../../../../../lib/redemption/redemptionTypes";

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

export async function fetchMeRedemptionsNative(): Promise<RedemptionListPayload> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/redemptions`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as RedemptionListPayload;
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return data;
}

export async function fetchMeRedemptionNative(
  id: string
): Promise<RedemptionRequest> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/redemptions/${encodeURIComponent(id)}`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as {
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) throw new Error(data?.error ?? res.statusText);
  return data.request;
}

export async function createMeRedemptionNative(
  input: RedemptionApplicationInput,
  opts?: { asDraft?: boolean }
): Promise<RedemptionRequest> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/redemptions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, asDraft: opts?.asDraft === true }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) throw new Error(data?.error ?? res.statusText);
  return data.request;
}

export async function cancelMeRedemptionNative(
  id: string
): Promise<RedemptionRequest> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/redemptions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", id }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) throw new Error(data?.error ?? res.statusText);
  return data.request;
}

export async function submitMeRedemptionDraftNative(
  id: string
): Promise<RedemptionRequest> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/me/redemptions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit_draft", id }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) throw new Error(data?.error ?? res.statusText);
  return data.request;
}
