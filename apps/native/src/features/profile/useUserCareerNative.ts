/**
 * Native: user_career を Firestore 直読（1 read）。
 * 無いときだけ API ensure（Next 起動時）で合成。
 */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  parseUserCareerDoc,
  USER_CAREER_COLLECTION,
  type UserCareerDoc,
} from "../../../../../lib/profile/userCareer";
import { db } from "../../lib/firebase";

export function useUserCareerNative(
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

    void (async () => {
      try {
        const snap = await getDoc(doc(db, USER_CAREER_COLLECTION, uid));
        if (cancelled) return;

        if (snap.exists()) {
          setCareer(parseUserCareerDoc(uid, snap.data()));
          return;
        }

        // 未作成のみ API ensure（バックフィル済みなら通常ここには来ない）
        if (!apiBase) {
          setCareer(null);
          setError("career_missing");
          return;
        }

        const res = await fetch(
          `${apiBase}/api/profile/career?uid=${encodeURIComponent(uid)}`
        );
        if (!res.ok) throw new Error(`career ${res.status}`);
        const json = (await res.json()) as { career?: unknown };
        if (!cancelled) {
          setCareer(parseUserCareerDoc(uid, json.career));
        }
      } catch (err) {
        if (!cancelled) {
          setCareer(null);
          setError(err instanceof Error ? err.message : "career_failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

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
