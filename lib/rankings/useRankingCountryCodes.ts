"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type CountryCodeByUid = Record<string, string | null>;

export function useRankingCountryCodes(uids: string[]) {
  const uniqueUids = useMemo(() => Array.from(new Set(uids)).filter(Boolean), [uids]);
  const key = uniqueUids.join("|");

  const [loading, setLoading] = useState(false);
  const [countryCodeByUid, setCountryCodeByUid] = useState<CountryCodeByUid>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (uniqueUids.length === 0) {
        setCountryCodeByUid({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const results = await Promise.all(
          uniqueUids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              const d = snap.data() as any | undefined;
              const code: unknown = d?.countryCode ?? null;
              return [uid, typeof code === "string" ? code : null] as const;
            } catch {
              return [uid, null] as const;
            }
          })
        );

        if (cancelled) return;

        const next: CountryCodeByUid = {};
        for (const [uid, code] of results) {
          next[uid] = code;
        }
        setCountryCodeByUid(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { loading, countryCodeByUid };
}

