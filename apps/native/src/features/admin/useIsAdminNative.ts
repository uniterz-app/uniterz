/**
 * Web `useIsAdmin` 相当（Native）
 */
import { useEffect, useState } from "react";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { resolveIsAdminClient } from "../../../../../lib/admin/resolveIsAdminClient";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

export function useIsAdminNative(): {
  isAdmin: boolean;
  loading: boolean;
} {
  const { fUser, status } = useFirebaseUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (status === "loading") return;
      if (!fUser) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      const ok = await resolveIsAdminClient(fUser, getUniterzApiBaseUrl());
      if (!cancelled) {
        setIsAdmin(ok);
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [fUser, status]);

  return { isAdmin, loading: status === "loading" || loading };
}
