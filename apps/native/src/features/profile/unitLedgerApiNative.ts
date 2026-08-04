/**
 * Web `lib/api/fetchMeUnitLedger` 相当
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { UnitLedgerListPayload } from "../../../../../lib/units/unitLedgerTypes";

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

export async function fetchMeUnitLedgerNative(
  language: "ja" | "en" = "ja"
): Promise<UnitLedgerListPayload> {
  const base = requireBase();
  const headers = await authHeader();
  let res: Response;
  try {
    res = await fetch(`${base}/api/me/unit-ledger?lang=${language}`, {
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
  const data = (await res.json().catch(() => ({}))) as UnitLedgerListPayload;
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `取得に失敗しました（${res.status}）`
    );
  }
  return data;
}
