"use client";

import { auth } from "@/lib/firebase";
import type {
  RedemptionApplicationInput,
  RedemptionListPayload,
  RedemptionRequest,
} from "@/lib/redemption/redemptionTypes";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMeRedemptions(): Promise<RedemptionListPayload> {
  const headers = await authHeader();
  const res = await fetch("/api/me/redemptions", {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as RedemptionListPayload;
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return data;
}

export async function fetchMeRedemption(
  id: string
): Promise<RedemptionRequest> {
  const headers = await authHeader();
  const res = await fetch(`/api/me/redemptions/${encodeURIComponent(id)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data.request;
}

export async function createMeRedemption(
  input: RedemptionApplicationInput,
  opts?: { asDraft?: boolean }
): Promise<RedemptionRequest> {
  const headers = await authHeader();
  const res = await fetch("/api/me/redemptions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, asDraft: opts?.asDraft === true }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data.request;
}

export async function cancelMeRedemption(id: string): Promise<RedemptionRequest> {
  const headers = await authHeader();
  const res = await fetch("/api/me/redemptions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", id }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data.request;
}

export async function submitMeRedemptionDraft(
  id: string
): Promise<RedemptionRequest> {
  const headers = await authHeader();
  const res = await fetch("/api/me/redemptions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit_draft", id }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    request?: RedemptionRequest;
    error?: string;
  };
  if (!res.ok || !data.request) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data.request;
}
