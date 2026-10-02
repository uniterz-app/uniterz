/**
 * Web `PATCH /api/admin/redemptions` 相当
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { RedemptionRequestStatus } from "../../../../../lib/redemption/redemptionTypes";

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

export async function patchAdminRedemptionNative(input: {
  id: string;
  status?: RedemptionRequestStatus;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  orderReference?: string | null;
  adminNote?: string | null;
}): Promise<void> {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}/api/admin/redemptions`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
}
