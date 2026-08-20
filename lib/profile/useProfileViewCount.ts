"use client";

import { useEffect, useState } from "react";

import { auth, authInitialization } from "@/lib/firebase";
import {
  peekProfileViewCountMemory,
  setProfileViewCountMemory,
} from "@/lib/profile/profileViewCountMemory";
import {
  releaseProfileViewRecordSlot,
  takeProfileViewRecordSlot,
} from "@/lib/profile/profileViewRecordMemory";

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
 * 件数 GET を待たずに表示し、記録 POST は並行（表示をブロックしない）。
 */
export function useProfileViewCount(
  targetUid: string | null,
  seedCount: number | null = null
): ProfileViewCountState {
  const [state, setState] = useState<ProfileViewCountState>(() => ({
    count:
      seedCount != null
        ? seedCount
        : peekProfileViewCountMemory(targetUid),
    loading: false,
  }));

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!targetUid) {
        setState({ count: null, loading: false });
        return;
      }

      const seeded =
        seedCount != null ? seedCount : peekProfileViewCountMemory(targetUid);
      if (seeded != null) {
        setProfileViewCountMemory(targetUid, seeded);
        setState({ count: seeded, loading: false });
      } else {
        setState((prev) => ({ ...prev, loading: true }));
      }

      try {
        const headers = await authHeaders();
        const viewerUid = auth.currentUser?.uid ?? null;

        if (headers && viewerUid && viewerUid !== targetUid) {
          if (takeProfileViewRecordSlot(viewerUid, targetUid)) {
            void fetch("/api/profile/views", {
              method: "POST",
              headers,
              body: JSON.stringify({ targetUid }),
            })
              .then(async (res) => {
                if (!res.ok) {
                  releaseProfileViewRecordSlot(viewerUid, targetUid);
                  return;
                }
                const data = (await res.json()) as { counted?: unknown };
                if (data.counted !== true || seeded == null) return;
                setState((prev) => {
                  if (prev.count == null) return prev;
                  const count = prev.count + 1;
                  setProfileViewCountMemory(targetUid, count);
                  return { ...prev, count };
                });
              })
              .catch(() => {
                releaseProfileViewRecordSlot(viewerUid, targetUid);
              });
          }
        }

        if (seeded != null) return;

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
        setProfileViewCountMemory(targetUid, count);
        if (!cancelled) setState({ count, loading: false });
      } catch {
        if (!cancelled) {
          setState({
            count: seedCount ?? peekProfileViewCountMemory(targetUid),
            loading: false,
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [seedCount, targetUid]);

  return state;
}
