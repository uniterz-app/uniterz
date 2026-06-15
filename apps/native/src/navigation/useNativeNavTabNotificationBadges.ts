import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import {
  markNavRankingSeenNative,
  markNavResultSeenNative,
  readNavRankingSeenMsNative,
  readNavResultSeenMsNative,
} from "./navTabNotificationSeenNative";

function firestoreTsToMs(v: unknown): number | null {
  const t = v as { toMillis?: () => number; seconds?: number } | null | undefined;
  if (t?.toMillis) return t.toMillis();
  if (typeof t?.seconds === "number") return t.seconds * 1000;
  return null;
}

async function ensureResultSeenBaseline(uid: string): Promise<number> {
  const existing = await readNavResultSeenMsNative(uid);
  if (existing != null) return existing;

  const baselineMs = Date.now();
  try {
    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", uid),
      where("schemaVersion", "==", 2),
      orderBy("settledAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    const latestMs = snap.empty
      ? baselineMs
      : firestoreTsToMs(snap.docs[0]?.data()?.settledAt) ?? baselineMs;
    await markNavResultSeenNative(uid, latestMs);
    return latestMs;
  } catch {
    await markNavResultSeenNative(uid, baselineMs);
    return baselineMs;
  }
}

type Options = {
  rankingTabActive?: boolean;
  resultTabActive?: boolean;
};

/** Native 下部タブの未読ドット（Web `useNavTabNotificationBadges` と同趣旨） */
export function useNativeNavTabNotificationBadges(options: Options = {}) {
  const { rankingTabActive = false, resultTabActive = false } = options;
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const authReady = status === "ready";

  const [rankingUpdatedAtMs, setRankingUpdatedAtMs] = useState<number | null>(
    null
  );
  const [rankingSeenMs, setRankingSeenMs] = useState<number | null>(null);
  const [resultSeenMs, setResultSeenMs] = useState<number | null>(null);
  const [hasNewSettledPost, setHasNewSettledPost] = useState(false);
  const [resultBaselineReady, setResultBaselineReady] = useState(false);

  const active = authReady && !!uid;

  useEffect(() => {
    if (!active || !uid) {
      setRankingUpdatedAtMs(null);
      setRankingSeenMs(null);
      return;
    }

    let cancelled = false;

    void readNavRankingSeenMsNative(uid).then((seen) => {
      if (!cancelled) setRankingSeenMs(seen);
    });

    const unsub = onSnapshot(doc(db, "cumulative_stats", uid), (snap) => {
      const ms = firestoreTsToMs(snap.data()?.snapshotRanks?.updatedAt);
      setRankingUpdatedAtMs(ms);
      void (async () => {
        const seen = await readNavRankingSeenMsNative(uid);
        if (seen == null && ms != null) {
          await markNavRankingSeenNative(uid, ms);
          if (!cancelled) setRankingSeenMs(ms);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [active, uid]);

  useEffect(() => {
    if (!active || !uid) {
      setResultSeenMs(null);
      setHasNewSettledPost(false);
      setResultBaselineReady(false);
      return;
    }

    let cancelled = false;
    void ensureResultSeenBaseline(uid).then((baseline) => {
      if (cancelled) return;
      setResultSeenMs(baseline);
      setResultBaselineReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [active, uid]);

  useEffect(() => {
    if (!active || !uid || !resultBaselineReady || resultSeenMs == null) {
      setHasNewSettledPost(false);
      return;
    }

    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", uid),
      where("schemaVersion", "==", 2),
      where("settledAt", ">", Timestamp.fromMillis(resultSeenMs)),
      orderBy("settledAt", "desc"),
      limit(1)
    );

    return onSnapshot(
      q,
      (snap) => setHasNewSettledPost(snap.size > 0),
      () => setHasNewSettledPost(false)
    );
  }, [active, uid, resultBaselineReady, resultSeenMs]);

  useEffect(() => {
    if (!active || !uid || !rankingTabActive) return;
    const ms = rankingUpdatedAtMs ?? Date.now();
    void markNavRankingSeenNative(uid, ms).then(() => setRankingSeenMs(ms));
  }, [active, uid, rankingTabActive, rankingUpdatedAtMs]);

  useEffect(() => {
    if (!active || !uid || !resultTabActive) return;
    const ms = Date.now();
    void markNavResultSeenNative(uid, ms).then(() => {
      setResultSeenMs(ms);
      setHasNewSettledPost(false);
    });
  }, [active, uid, resultTabActive]);

  const showRankingBadge =
    active &&
    !rankingTabActive &&
    rankingUpdatedAtMs != null &&
    (rankingSeenMs == null || rankingUpdatedAtMs > rankingSeenMs);

  const showResultBadge =
    active && !resultTabActive && resultBaselineReady && hasNewSettledPost;

  return { showRankingBadge, showResultBadge };
}
