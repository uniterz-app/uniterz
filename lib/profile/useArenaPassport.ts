"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseVisitedArenaIds,
  toggleVisitedArenaId,
  type ArenaPassportId,
} from "@/lib/profile/arenaPassport";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";

export type SaveArenaPassportToggle = (
  arenaId: ArenaPassportId
) => Promise<ArenaPassportId[]>;

/**
 * 対象ユーザーの訪問済みアリーナ（ライブ購読）。
 * `save` を渡すと本人用の楽観トグルが使える。
 */
export function useArenaPassport(
  targetUid: string | null | undefined,
  options: { enabled?: boolean; save?: SaveArenaPassportToggle } = {}
): {
  visited: ArenaPassportId[];
  ready: boolean;
  toggle: ((arenaId: ArenaPassportId) => Promise<boolean>) | null;
} {
  const { enabled = true, save } = options;
  const uid = targetUid?.trim() || null;
  const [visited, setVisited] = useState<ArenaPassportId[]>([]);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef(0);

  useEffect(() => {
    if (!enabled || !uid) {
      setVisited([]);
      setReady(!uid);
      return;
    }
    setReady(false);
    return subscribeUserDocLive(uid, (data) => {
      if (pendingRef.current > 0) return;
      setVisited(parseVisitedArenaIds(data as Record<string, unknown> | null));
      setReady(true);
    });
  }, [uid, enabled]);

  const toggle = useCallback(
    async (arenaId: ArenaPassportId): Promise<boolean> => {
      if (!save) return false;
      setVisited((prev) => toggleVisitedArenaId(prev, arenaId));
      pendingRef.current += 1;
      try {
        const next = await save(arenaId);
        pendingRef.current -= 1;
        if (pendingRef.current === 0) setVisited(next);
        return true;
      } catch {
        pendingRef.current -= 1;
        setVisited((prev) => toggleVisitedArenaId(prev, arenaId));
        return false;
      }
    },
    [save]
  );

  return { visited, ready, toggle: save ? toggle : null };
}
