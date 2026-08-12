/**
 * 自分の未再生 Unit 獲得演出
 */

export type FetchMePendingUnitEarnsResult = {
  ok: boolean;
  entries: Array<{
    id: string;
    amount: number;
    reason: string;
    period?: string;
    label?: string;
    metric?: string;
    rank?: number | null;
    titleJa: string;
    titleEn: string;
    subtitleJa: string | null;
    subtitleEn: string | null;
    createdAtMs: number;
  }>;
  error?: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { auth } = await import("@/lib/firebase");
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMePendingUnitEarns(): Promise<FetchMePendingUnitEarnsResult> {
  const headers = await authHeaders();
  const res = await fetch("/api/me/pending-unit-earns", {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as FetchMePendingUnitEarnsResult;
  if (!res.ok) {
    return {
      ok: false,
      entries: [],
      error: data?.error || res.statusText || "failed",
    };
  }
  return {
    ok: true,
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

export async function claimMePendingUnitEarns(
  ids: string[]
): Promise<{ ok: boolean; claimed?: number; error?: string }> {
  if (ids.length === 0) return { ok: true, claimed: 0 };
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json",
  };
  const res = await fetch("/api/me/pending-unit-earns", {
    method: "POST",
    headers,
    body: JSON.stringify({ ids }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    claimed?: number;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data?.error || res.statusText || "failed" };
  }
  return { ok: true, claimed: data.claimed ?? 0 };
}
