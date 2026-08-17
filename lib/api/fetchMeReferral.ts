"use client";

import { auth } from "@/lib/firebase";
import type { ReferralInviteSummary } from "@/lib/referral/referralRewards";

export type MeReferralApiPayload = ReferralInviteSummary & {
  ok: boolean;
  invitePath?: string;
  error?: string;
};

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** 自分の招待サマリー（要ログイン） */
export async function fetchMeReferral(): Promise<MeReferralApiPayload> {
  const headers = await authHeader();
  const res = await fetch("/api/me/referral", {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as MeReferralApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
