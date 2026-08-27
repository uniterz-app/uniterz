/**
 * クライアント用: ID トークンの `admin` claim / session API
 */
"use client";

import { useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { resolveIsAdminClient } from "@/lib/admin/resolveIsAdminClient";

/**
 * uid ごとの判定を共有する。
 * レイアウトとページで `AdminGuard` が入れ子になっても
 * `/api/admin/session` を 1 回に抑える。
 */
const resolvedByUid = new Map<string, boolean>();
const inflightByUid = new Map<string, Promise<boolean>>();

function resolveOnce(
  uid: string,
  user: Parameters<typeof resolveIsAdminClient>[0]
): Promise<boolean> {
  const cached = resolvedByUid.get(uid);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = inflightByUid.get(uid);
  if (pending) return pending;

  const started = resolveIsAdminClient(user, "")
    .then((ok) => {
      resolvedByUid.set(uid, ok);
      return ok;
    })
    .finally(() => {
      inflightByUid.delete(uid);
    });
  inflightByUid.set(uid, started);
  return started;
}

export function useIsAdmin(): {
  isAdmin: boolean;
  loading: boolean;
} {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const [isAdmin, setIsAdmin] = useState(() =>
    uid ? resolvedByUid.get(uid) ?? false : false
  );
  const [loading, setLoading] = useState(
    () => !(uid && resolvedByUid.get(uid) !== undefined)
  );

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
      const cached = resolvedByUid.get(fUser.uid);
      if (cached !== undefined) {
        if (!cancelled) {
          setIsAdmin(cached);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      const ok = await resolveOnce(fUser.uid, fUser);
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
