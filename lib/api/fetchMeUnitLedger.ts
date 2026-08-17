"use client";

import { auth } from "@/lib/firebase";
import type { UnitLedgerListPayload } from "@/lib/units/unitLedgerTypes";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** 自分の Unit 履歴（要ログイン） */
export async function fetchMeUnitLedger(
  language: "ja" | "en" = "ja"
): Promise<UnitLedgerListPayload> {
  const headers = await authHeader();
  const res = await fetch(`/api/me/unit-ledger?lang=${language}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as UnitLedgerListPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
