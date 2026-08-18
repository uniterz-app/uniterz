/** 自分の MARK リストと、閲覧中ユーザーがマーク済みか */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  MAX_MARKS_FREE,
  type UserMark,
  type UserMarkWrite,
} from "../../../../../lib/marks/markTypes";
import {
  addMarkInMemory,
  beginMarksWrite,
  getMarksMemorySnapshot,
  hydrateMarksMemory,
  peekMarksWriteEpoch,
  removeMarkInMemory,
  replaceMarksMemory,
  resetMarksMemory,
  subscribeMarksMemory,
} from "../../../../../lib/marks/marksMemoryStore";
import {
  clearMarkedByNative,
  countMarkedByNative,
  listMarksNative,
  persistMarksNative,
  setMarkedByNative,
} from "./marksFirestoreNative";

const EMPTY: UserMark[] = [];

export function useProfileMarksNative(
  myUid: string | null | undefined,
  maxMarks: number = MAX_MARKS_FREE
) {
  const owner = myUid?.trim() || "";
  const cap = Number.isFinite(maxMarks) && maxMarks > 0 ? maxMarks : MAX_MARKS_FREE;
  const snap = useSyncExternalStore(
    subscribeMarksMemory,
    getMarksMemorySnapshot,
    getMarksMemorySnapshot
  );
  const marks = snap.owner === owner ? snap.marks : EMPTY;
  const [loading, setLoading] = useState(
    () => Boolean(owner) && !(snap.hydrated && snap.owner === owner)
  );
  const [markedByCount, setMarkedByCount] = useState(0);

  const refreshMarkedBy = useCallback(async () => {
    if (!owner) {
      setMarkedByCount(0);
      return;
    }
    const n = await countMarkedByNative(owner);
    setMarkedByCount(n);
  }, [owner]);

  const refresh = useCallback(async () => {
    if (!owner) {
      resetMarksMemory();
      setLoading(false);
      setMarkedByCount(0);
      return;
    }
    const epoch = peekMarksWriteEpoch();
    setLoading(true);
    try {
      const rows = await listMarksNative(owner);
      hydrateMarksMemory(owner, rows, epoch);
    } catch {
      hydrateMarksMemory(owner, [], epoch);
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    if (!owner) {
      resetMarksMemory();
      setLoading(false);
      setMarkedByCount(0);
      return;
    }
    const current = getMarksMemorySnapshot();
    if (current.hydrated && current.owner === owner) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [owner, refresh]);

  useEffect(() => {
    void refreshMarkedBy();
  }, [refreshMarkedBy]);

  const markedUids = useMemo(
    () => new Set(marks.map((m) => m.targetUid)),
    [marks]
  );

  const addMark = useCallback(
    async (payload: UserMarkWrite) => {
      if (!owner) return { ok: false as const, error: "empty" as const };
      const target = payload.targetUid.trim();
      if (!target) return { ok: false as const, error: "empty" as const };
      beginMarksWrite();
      const next = addMarkInMemory(
        owner,
        {
          targetUid: target,
          handle: payload.handle.trim(),
          displayName:
            payload.displayName.trim() || payload.handle.trim() || "User",
          photoURL: payload.photoURL?.trim() || null,
          createdAtMs: Date.now(),
        },
        cap
      );
      if (next === "cap") return { ok: false as const, error: "cap" as const };
      const result = await persistMarksNative(owner, next);
      if (!result.ok) {
        const epoch = peekMarksWriteEpoch();
        try {
          const rows = await listMarksNative(owner);
          hydrateMarksMemory(owner, rows, epoch);
        } catch {
          replaceMarksMemory(owner, EMPTY);
        }
        return { ok: false as const, error: result.error };
      }
      await setMarkedByNative(target, owner);
      return { ok: true as const };
    },
    [cap, owner]
  );

  const removeMark = useCallback(
    async (targetUid: string) => {
      if (!owner) return { ok: false as const, error: "failed" as const };
      const target = targetUid.trim();
      beginMarksWrite();
      const next = removeMarkInMemory(owner, target);
      const result = await persistMarksNative(owner, next);
      if (!result.ok) {
        const epoch = peekMarksWriteEpoch();
        try {
          const rows = await listMarksNative(owner);
          hydrateMarksMemory(owner, rows, epoch);
        } catch {
          replaceMarksMemory(owner, EMPTY);
        }
        return { ok: false as const, error: "failed" as const };
      }
      await clearMarkedByNative(target, owner);
      return { ok: true as const };
    },
    [owner]
  );

  const isMarked = useCallback(
    (uid: string | null | undefined) =>
      Boolean(uid && markedUids.has(uid.trim())),
    [markedUids]
  );

  return {
    marks,
    loading,
    markCount: marks.length,
    maxMarks: cap,
    atCap: marks.length >= cap,
    markedByCount,
    refresh,
    refreshMarkedBy,
    addMark,
    removeMark,
    isMarked,
  };
}
