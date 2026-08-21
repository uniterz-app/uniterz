/**
 * クライアント用: ID トークンの `admin` claim / session API
 */
"use client";

import { useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { resolveIsAdminClient } from "@/lib/admin/resolveIsAdminClient";

export function useIsAdmin(): {
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
      const ok = await resolveIsAdminClient(fUser, "");
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
