/**
 * Web `/api/admin/group-battles` 相当（Native）
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

export type AdminGroupBattleRow = {
  id: string;
  name: string;
  phase: string;
  seasonKey: string;
  weeklyLabels: string[];
  monthlyRange: { startKey: string; endKey: string; label: string };
  recruitStartAtMs: number;
  recruitEndAtMs: number;
  battleStartAtMs: number;
  battleEndAtMs: number;
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

async function adminFetch(path: string, init?: RequestInit) {
  const base = requireBase();
  const headers = await authHeader();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...headers,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    battles?: AdminGroupBattleRow[];
    battleId?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

export async function fetchAdminGroupBattlesNative(): Promise<
  AdminGroupBattleRow[]
> {
  const data = await adminFetch("/api/admin/group-battles");
  return (data.battles ?? []) as AdminGroupBattleRow[];
}

export async function createAdminGroupBattleNative(body: {
  name: string;
  seasonKey: string;
  recruitStartAt: string;
  recruitEndAt: string;
  battleStartAt: string;
  battleEndAt: string;
  startRecruiting: boolean;
}): Promise<string> {
  const data = await adminFetch("/api/admin/group-battles", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return String(data.battleId ?? "");
}

export async function setAdminGroupBattlePhaseNative(
  battleId: string,
  phase: string
): Promise<void> {
  await adminFetch(
    `/api/admin/group-battles/${encodeURIComponent(battleId)}/phase`,
    {
      method: "POST",
      body: JSON.stringify({ phase }),
    }
  );
}
