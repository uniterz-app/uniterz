"use client";

import { useEffect, useState } from "react";
import {
  PRO_INSIGHT_SEEN_STORAGE_KEY,
  isProInsightUnread,
  parseProInsightSeenMap,
  withProInsightSeen,
} from "@/lib/predict/proInsightUnread";

function readSeenMap() {
  try {
    return parseProInsightSeenMap(
      window.localStorage.getItem(PRO_INSIGHT_SEEN_STORAGE_KEY)
    );
  } catch {
    return {};
  }
}

/** その試合の Pro Insight が最後に INSIGHT を開いたとき以降に更新されたか。開いている間に既読にする */
export function useProInsightUnread(opts: {
  gameId: string | null | undefined;
  version: string | null;
  viewing: boolean;
}): boolean {
  const gameId = (opts.gameId ?? "").trim();
  const { version, viewing } = opts;
  /** undefined = 端末保存をまだ読んでいない（点をちらつかせない） */
  const [seen, setSeen] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setSeen(gameId ? (readSeenMap()[gameId] ?? null) : undefined);
  }, [gameId]);

  useEffect(() => {
    if (!viewing || !gameId || !version) return;
    try {
      window.localStorage.setItem(
        PRO_INSIGHT_SEEN_STORAGE_KEY,
        JSON.stringify(withProInsightSeen(readSeenMap(), gameId, version))
      );
    } catch {
      // ignore
    }
    setSeen(version);
  }, [viewing, gameId, version]);

  return seen !== undefined && !viewing && isProInsightUnread({ version, seen });
}
