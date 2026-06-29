import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import {
  defaultWcKnockoutAdvancement,
  parseWcKnockoutAdvancementDoc,
} from "@/lib/wc/wc-knockout-advancement-store";

type Options = {
  enabled?: boolean;
};

/**
 * Web `useWcKnockoutAdvancement` 相当 — `wcKnockoutAdvancement/{season}` を Native Firestore から取得。
 */
export function useNativeWcKnockoutAdvancement(
  season = WC_KNOCKOUT_SEASON,
  options: Options = {}
) {
  const { enabled = true } = options;
  const [advancement, setAdvancement] = useState<WcKnockoutAdvancement>(() =>
    defaultWcKnockoutAdvancement(season)
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fallback = defaultWcKnockoutAdvancement(season);

    if (!enabled) {
      setAdvancement(fallback);
      setReady(false);
      return;
    }

    let cancelled = false;
    const ref = doc(db, "wcKnockoutAdvancement", season);

    async function load() {
      try {
        const snap = await getDoc(ref);
        if (cancelled) return;
        const parsed = parseWcKnockoutAdvancementDoc(snap.data());
        setAdvancement(parsed ?? fallback);
      } catch (e) {
        if (!cancelled) {
          console.warn("wcKnockoutAdvancement load failed", e);
          setAdvancement(fallback);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [season, enabled]);

  return { advancement, ready };
}
