/** Web `useResultLeagueFlags` 相当 — Profile と同じ users メモリを共有 */
import { useEffect, useMemo, useState } from "react";
import {
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "../profile/profileUserDocCacheNative";
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
  const [flags, setFlags] = useState<UserResultLeagueFlags>(() => {
    if (!uid) return EMPTY_FLAGS;
    const peek = peekProfileUserDocNative(uid);
    return peek ? parseUserResultLeagueFlags(peek) : EMPTY_FLAGS;
  });
  const [flagsReady, setFlagsReady] = useState(() => {
    if (!uid) return false;
    return peekProfileUserDocNative(uid) !== undefined;
  });

  useEffect(() => {
    if (!uid) {
      setFlags(EMPTY_FLAGS);
      setFlagsReady(false);
      return;
    }
    let cancelled = false;
    const peek = peekProfileUserDocNative(uid);
    if (peek) {
      setFlags(parseUserResultLeagueFlags(peek));
      setFlagsReady(true);
    } else {
      setFlagsReady(false);
    }
    void (async () => {
      try {
        const loaded = await loadProfileUserDocNative(uid);
        if (cancelled) return;
        setFlags(
          loaded?.exists
            ? parseUserResultLeagueFlags(loaded.data)
            : EMPTY_FLAGS
        );
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

  const showResultLeagueTabs = useMemo(
    () => shouldShowResultLeagueTabs(flags),
    [flags]
  );
  const defaultLeagueTab = useMemo(
    () => defaultResultListLeagueTab(flags),
    [flags]
  );

  return { flags, flagsReady, showResultLeagueTabs, defaultLeagueTab };
}

export type { ResultListLeagueTab };
