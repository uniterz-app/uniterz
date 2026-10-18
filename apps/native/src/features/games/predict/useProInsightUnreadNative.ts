/** Web `useProInsightUnread` 相当 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PRO_INSIGHT_SEEN_STORAGE_KEY,
  isProInsightUnread,
  parseProInsightSeenMap,
  withProInsightSeen,
  type ProInsightSeenMap,
} from "../../../../../../lib/predict/proInsightUnread";

let seenMapCache: ProInsightSeenMap | undefined;

async function loadSeenMap(): Promise<ProInsightSeenMap> {
  if (seenMapCache) return seenMapCache;
  try {
    seenMapCache = parseProInsightSeenMap(
      await AsyncStorage.getItem(PRO_INSIGHT_SEEN_STORAGE_KEY)
    );
  } catch {
    seenMapCache = {};
  }
  return seenMapCache;
}

export function useProInsightUnreadNative(opts: {
  gameId: string | null | undefined;
  version: string | null;
  viewing: boolean;
}): boolean {
  const gameId = (opts.gameId ?? "").trim();
  const { version, viewing } = opts;
  /** undefined = 端末保存をまだ読んでいない（点をちらつかせない） */
  const [seen, setSeen] = useState<string | null | undefined>(() =>
    gameId && seenMapCache ? (seenMapCache[gameId] ?? null) : undefined
  );

  useEffect(() => {
    if (!gameId) {
      setSeen(undefined);
      return;
    }
    let alive = true;
    void loadSeenMap().then((map) => {
      if (alive) setSeen(map[gameId] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!viewing || !gameId || !version) return;
    setSeen(version);
    void loadSeenMap().then((map) => {
      seenMapCache = withProInsightSeen(map, gameId, version);
      void AsyncStorage.setItem(
        PRO_INSIGHT_SEEN_STORAGE_KEY,
        JSON.stringify(seenMapCache)
      ).catch(() => {});
    });
  }, [viewing, gameId, version]);

  return seen !== undefined && !viewing && isProInsightUnread({ version, seen });
}
