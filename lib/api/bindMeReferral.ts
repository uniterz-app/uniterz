"use client";

import { auth } from "@/lib/firebase";

export type BindReferralApiPayload = {
  ok: boolean;
  inviteCode?: string | null;
  referrerUid?: string | null;
  relationCreated?: boolean;
  error?: string;
};

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** サインアップ直後の招待コード紐づけ */
export async function bindMeReferral(
  inviteCode: string
): Promise<BindReferralApiPayload> {
  const headers = await authHeader();
  const res = await fetch("/api/me/referral/bind", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inviteCode }),
  });
  const data = (await res.json().catch(() => ({}))) as BindReferralApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
