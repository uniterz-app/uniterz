"use client";

import { useEffect, useState } from "react";

import { auth, authInitialization } from "@/lib/firebase";

type ProfileViewCountState = {
  count: number | null;
  loading: boolean;
};

async function authHeaders(): Promise<Record<string, string> | null> {
  await authInitialization;
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * プロフィール閲覧数（公開表示）。
 * 他人プロフィールでは日次ユニーク閲覧を記録したうえで件数も取得する。
 */
export function useProfileViewCount(
  targetUid: string | null
): ProfileViewCountState {
  const [state, setState] = useState<ProfileViewCountState>({
    count: null,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!targetUid) {
        setState({ count: null, loading: false });
        return;
      }

      try {
        if (!cancelled) setState((prev) => ({ ...prev, loading: true }));

        const headers = await authHeaders();
        const viewerUid = auth.currentUser?.uid ?? null;

        // 他人閲覧の記録（ログイン時のみ）
        if (headers && viewerUid && viewerUid !== targetUid) {
          await fetch("/api/profile/views", {
            method: "POST",
            headers,
            body: JSON.stringify({ targetUid }),
          });
        }

        const qs = new URLSearchParams({ uid: targetUid });
        const res = await fetch(`/api/profile/views?${qs}`, {
          method: "GET",
          headers: headers ?? { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("profile_view_count_failed");
        const data = (await res.json()) as { count?: unknown };
        const count =
          typeof data.count === "number" && Number.isFinite(data.count)
            ? Math.max(0, Math.floor(data.count))
            : 0;
        if (!cancelled) setState({ count, loading: false });
      } catch {
        // 閲覧計測の失敗でプロフィール表示を壊さない。
        if (!cancelled) setState({ count: null, loading: false });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [targetUid]);

  return state;
}
