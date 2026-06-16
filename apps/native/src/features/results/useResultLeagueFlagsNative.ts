/** Web `useResultLeagueFlags` のネイティブ向けコピー（@/ 依存回避） */
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  defaultResultListLeagueTab,
  parseUserResultLeagueFlags,
  shouldShowResultLeagueTabs,
  type UserResultLeagueFlags,
} from "../../../../../lib/result/userResultLeagueFlags";
import type { ResultListLeagueTab } from "../../../../../lib/result/result-page-data";

const EMPTY_FLAGS: UserResultLeagueFlags = {
  hasNbaPost: false,
  hasWcPost: false,
};

export function useResultLeagueFlagsNative(uid: string | null) {
  const [flags, setFlags] = useState<UserResultLeagueFlags>(EMPTY_FLAGS);
  const [flagsReady, setFlagsReady] = useState(false);

  useEffect(() => {
    if (!uid) {
      setFlags(EMPTY_FLAGS);
      setFlagsReady(false);
      return;
    }
    let cancelled = false;
    setFlagsReady(false);
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        setFlags(snap.exists() ? parseUserResultLeagueFlags(snap.data()) : EMPTY_FLAGS);
      } catch {
        if (!cancelled) setFlags(EMPTY_FLAGS);
      } finally {
        if (!cancelled) setFlagsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const showResultLeagueTabs = useMemo(() => shouldShowResultLeagueTabs(flags), [flags]);
  const defaultLeagueTab = useMemo(() => defaultResultListLeagueTab(flags), [flags]);

  return { flags, flagsReady, showResultLeagueTabs, defaultLeagueTab };
}

export type { ResultListLeagueTab };
