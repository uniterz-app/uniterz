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
  peekMarksWriteEpoch,
  removeMarkInMemory,
  replaceMarksMemory,
  subscribeMarksMemory,
} from "../../../../../lib/marks/marksMemoryStore";
import {
  clearMarkedByNative,
  countMarkedByNative,
  deleteMarkNative,
  listMarksNative,
  setMarkedByNative,
  writeMarkNative,
} from "./marksFirestoreNative";
import { prefetchMarksWeeklyBoard } from "../../../../../lib/profile/fetchMarksWeeklyBoard";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

const EMPTY: UserMark[] = [];

/** プロフィールを開くたびに MARK 全件を読み直さない（追加・削除はこの hook 経由でメモリに反映済み） */
const MARKS_RELOAD_MIN_MS = 10 * 60_000;
let lastMarksLoad: { owner: string; at: number } | null = null;
const markedByCountCache = new Map<string, { n: number; at: number }>();

/** hook 以外（起動時プリフェッチ）で全件読んだとき */
export function rememberMarksLoadedNative(owner: string): void {
  lastMarksLoad = { owner, at: Date.now() };
}

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

  const refreshMarkedBy = useCallback(
    async (opts?: { allowCached?: boolean }) => {
      if (!owner) {
        setMarkedByCount(0);
        return;
      }
      const hit = markedByCountCache.get(owner);
      if (
        opts?.allowCached &&
        hit &&
        Date.now() - hit.at < MARKS_RELOAD_MIN_MS
      ) {
        setMarkedByCount(hit.n);
        return;
      }
      const n = await countMarkedByNative(owner);
      markedByCountCache.set(owner, { n, at: Date.now() });
      setMarkedByCount(n);
    },
    [owner]
  );

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!owner) {
      setLoading(false);
      setMarkedByCount(0);
      return;
    }
    const epoch = peekMarksWriteEpoch();
    if (!opts?.silent) setLoading(true);
    try {
      const rows = await Promise.race([
        listMarksNative(owner),
        new Promise<UserMark[]>((_, reject) => {
          setTimeout(() => reject(new Error("marks-list-timeout")), 10000);
        }),
      ]);
      // 書き込みと競合した古い list は捨てる。失敗時に空で消さない。
      if (epoch !== peekMarksWriteEpoch()) return;
      replaceMarksMemory(owner, rows);
      lastMarksLoad = { owner, at: Date.now() };
    } catch {
      // keep existing memory / タイムアウト時は空 hydrated にしてスピナー解除
      if (epoch === peekMarksWriteEpoch()) {
        const current = getMarksMemorySnapshot();
        if (!(current.hydrated && current.owner === owner)) {
          replaceMarksMemory(owner, EMPTY);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    // auth 前の一時的な owner 空でメモリを消さない（lazy:false Profile 起動レース）
    if (!owner) {
      setLoading(false);
      setMarkedByCount(0);
      return;
    }
    const current = getMarksMemorySnapshot();
    // 0 件でも hydrated 済みならスピナーを出さず、古いときだけ裏で再取得
    if (current.hydrated && current.owner === owner) {
      setLoading(false);
      const fresh =
        lastMarksLoad?.owner === owner &&
        Date.now() - lastMarksLoad.at < MARKS_RELOAD_MIN_MS;
      if (!fresh) void refresh({ silent: true });
      return;
    }
    void refresh();
  }, [owner, refresh]);

  useEffect(() => {
    if (!owner || !snap.hydrated || snap.owner !== owner) return;
    void refreshMarkedBy({ allowCached: true });
    prefetchMarksWeeklyBoard(
      marks.map((m) => m.targetUid),
      getUniterzApiBaseUrl() || undefined
    );
  }, [marks, owner, refreshMarkedBy, snap.hydrated, snap.owner]);

  const markedUids = useMemo(
    () => new Set(marks.map((m) => m.targetUid)),
    [marks]
  );

  const addMark = useCallback(
    async (payload: UserMarkWrite) => {
      if (!owner) return { ok: false as const, error: "empty" as const };
      const target = payload.targetUid.trim();
      if (!target) return { ok: false as const, error: "empty" as const };
      const row = {
        targetUid: target,
        handle: payload.handle.trim(),
        displayName:
          payload.displayName.trim() || payload.handle.trim() || "User",
        photoURL: payload.photoURL?.trim() || null,
        createdAtMs: Date.now(),
      };
      beginMarksWrite();
      const next = addMarkInMemory(owner, row, cap);
      if (next === "cap") return { ok: false as const, error: "cap" as const };
      const result = await writeMarkNative(owner, row);
      if (!result.ok) {
        try {
          const rows = await listMarksNative(owner);
          replaceMarksMemory(owner, rows);
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
      removeMarkInMemory(owner, target);
      const result = await deleteMarkNative(owner, target);
      if (!result.ok) {
        try {
          const rows = await listMarksNative(owner);
          replaceMarksMemory(owner, rows);
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
