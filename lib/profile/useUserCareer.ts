/**
 * user_career を API ensure 経由で取得（無ければサーバーが合成して保存）。
 */

import { useEffect, useState } from "react";
import {
  parseUserCareerDoc,
  type UserCareerDoc,
} from "@/lib/profile/userCareer";

export function useUserCareer(
  uid: string | null | undefined,
  opts?: { apiBaseUrl?: string | null; enabled?: boolean }
): {
  career: UserCareerDoc | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const enabled = opts?.enabled !== false && !!uid;
  const apiBase = (opts?.apiBaseUrl ?? "").replace(/\/$/, "");
  const [career, setCareer] = useState<UserCareerDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || !uid) {
      setCareer(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `${apiBase}/api/profile/career?uid=${encodeURIComponent(uid)}`;
    void fetch(url, { credentials: apiBase ? "omit" : "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`career ${res.status}`);
        const json = (await res.json()) as { career?: unknown };
        const parsed = parseUserCareerDoc(uid, json.career);
        if (!cancelled) setCareer(parsed);
      })
      .catch((err) => {
        if (!cancelled) {
          setCareer(null);
          setError(err instanceof Error ? err.message : "career_failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, enabled, apiBase, tick]);

  return {
    career,
    loading,
    error,
    refetch: () => setTick((n) => n + 1),
  };
}
