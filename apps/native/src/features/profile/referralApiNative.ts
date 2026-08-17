/**
 * Web `lib/api/fetchMeReferral` 相当
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { ReferralInviteSummary } from "../../../../../lib/referral/referralRewards";

export type MeReferralApiPayload = ReferralInviteSummary & {
  ok: boolean;
  invitePath?: string;
  error?: string;
};

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

export async function fetchMeReferralNative(): Promise<MeReferralApiPayload> {
  const base = requireBase();
  const headers = await authHeader();
  let res: Response;
  try {
    res = await fetch(`${base}/api/me/referral`, {
      method: "GET",
      headers,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e ?? "");
    if (/network|failed|fetch/i.test(raw) || !raw.trim()) {
      throw new Error(
        "API に接続できません。Next.js（npm run dev）が起動しているか、EXPO_PUBLIC_UNITERZ_API_BASE_URL を確認してください。"
      );
    }
    throw e instanceof Error ? e : new Error(raw || "request failed");
  }
  const data = (await res.json().catch(() => ({}))) as MeReferralApiPayload;
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `取得に失敗しました（${res.status}）`
    );
  }
  return data;
}

export type BindReferralApiPayload = {
  ok: boolean;
  inviteCode?: string | null;
  referrerUid?: string | null;
  relationCreated?: boolean;
  error?: string;
};

/** Web `bindMeReferral` 相当 */
export async function bindMeReferralNative(
  inviteCode: string
): Promise<BindReferralApiPayload> {
  const base = requireBase();
  const headers = await authHeader();
  let res: Response;
  try {
    res = await fetch(`${base}/api/me/referral/bind`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteCode }),
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e ?? "");
    if (/network|failed|fetch/i.test(raw) || !raw.trim()) {
      throw new Error(
        "API に接続できません。Next.js（npm run dev）が起動しているか、EXPO_PUBLIC_UNITERZ_API_BASE_URL を確認してください。"
      );
    }
    throw e instanceof Error ? e : new Error(raw || "request failed");
  }
  const data = (await res.json().catch(() => ({}))) as BindReferralApiPayload;
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `紐づけに失敗しました（${res.status}）`
    );
  }
  return data;
}
