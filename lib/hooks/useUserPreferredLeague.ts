"use client";

import { useEffect, useState } from "react";
import {
  parsePreferredLeague,
  type PreferredLeague,
} from "@/lib/user/preferredLeague";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

export function useUserPreferredLeague(uid: string | null | undefined): {
  preferredLeague: PreferredLeague | null;
  ready: boolean;
} {
  const [preferredLeague, setPreferredLeague] = useState<PreferredLeague | null>(
    null
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!uid) {
      setPreferredLeague(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    void (async () => {
      try {
        const data = await getUserDocDataCached(uid);
        if (cancelled) return;
        setPreferredLeague(parsePreferredLeague(data?.preferredLeague));
      } catch {
        if (!cancelled) setPreferredLeague(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { preferredLeague, ready };
}
