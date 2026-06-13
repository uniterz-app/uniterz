"use client";

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
import { db } from "@/lib/firebase";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import {
  isRankingsRoute,
  isResultRoute,
  markNavRankingSeen,
  markNavResultSeen,
  NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT,
  readNavRankingSeenMs,
  readNavResultSeenMs,
} from "@/lib/nav/navTabNotificationSeen";

type Options = {
  enabled?: boolean;
  pathname?: string;
  prefix?: "/web" | "/mobile";
  /** React Native タブ：ランキング表示中 */
  rankingTabActive?: boolean;
  /** React Native タブ：リザルト表示中 */
  resultTabActive?: boolean;
};

function firestoreTsToMs(v: unknown): number | null {
  const t = v as { toMillis?: () => number; seconds?: number } | null | undefined;
  if (t?.toMillis) return t.toMillis();
  if (typeof t?.seconds === "number") return t.seconds * 1000;
  return null;
}

async function ensureResultSeenBaseline(uid: string): Promise<number> {
  const existing = readNavResultSeenMs(uid);
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
    markNavResultSeen(uid, latestMs);
    return latestMs;
  } catch {
    markNavResultSeen(uid, baselineMs);
    return baselineMs;
  }
}

/**
 * 下部ナビ：ランキング更新・試合確定（リザルト）の未読ドット。
 * Web は pathname、Native は rankingTabActive / resultTabActive で既読化。
 */
export function useNavTabNotificationBadges(options: Options = {}) {
  const {
    enabled = true,
    pathname = "",
    prefix = "/web",
    rankingTabActive = false,
    resultTabActive = false,
  } = options;
  const { fUser: user, status } = useFirebaseUser();
  const uid = user?.uid ?? null;

  const [seenRev, setSeenRev] = useState(0);
  const [rankingUpdatedAtMs, setRankingUpdatedAtMs] = useState<number | null>(
    null
  );
  const [resultSeenMs, setResultSeenMs] = useState<number | null>(null);
  const [hasNewSettledPost, setHasNewSettledPost] = useState(false);
  const [resultBaselineReady, setResultBaselineReady] = useState(false);

  const authReady = isAuthStateResolved(status);
  const active = enabled && authReady && !!uid;

  const onRankingsRoute =
    rankingTabActive ||
    (!!pathname && isRankingsRoute(pathname, prefix));
  const onResultRoute =
    resultTabActive ||
    (!!pathname && isResultRoute(pathname, prefix));

  useEffect(() => {
    const bump = () => setSeenRev((n) => n + 1);
    window.addEventListener(NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener(NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    if (!active || !uid) {
      setRankingUpdatedAtMs(null);
      return;
    }

    let cancelled = false;
    const ref = doc(db, "cumulative_stats", uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        const ms = firestoreTsToMs(snap.data()?.snapshotRanks?.updatedAt);
        setRankingUpdatedAtMs(ms);

        const seen = readNavRankingSeenMs(uid);
        if (seen == null && ms != null) {
          markNavRankingSeen(uid, ms);
        }
      },
      () => {
        if (!cancelled) setRankingUpdatedAtMs(null);
      }
    );

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

    void (async () => {
      const baseline = await ensureResultSeenBaseline(uid);
      if (cancelled) return;
      setResultSeenMs(baseline);
      setResultBaselineReady(true);
    })();

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

    const unsub = onSnapshot(
      q,
      (snap) => {
        setHasNewSettledPost(snap.size > 0);
      },
      () => {
        setHasNewSettledPost(false);
      }
    );

    return () => unsub();
  }, [active, uid, resultBaselineReady, resultSeenMs]);

  useEffect(() => {
    if (!active || !uid || !onRankingsRoute) return;
    markNavRankingSeen(uid, rankingUpdatedAtMs ?? Date.now());
  }, [active, uid, onRankingsRoute, rankingUpdatedAtMs]);

  useEffect(() => {
    if (!active || !uid || !onResultRoute) return;
    const nextSeen = Date.now();
    markNavResultSeen(uid, nextSeen);
    setResultSeenMs(nextSeen);
    setHasNewSettledPost(false);
  }, [active, uid, onResultRoute]);

  void seenRev;

  const rankingSeenMs = uid ? readNavRankingSeenMs(uid) : null;
  const showRankingBadge =
    active &&
    !onRankingsRoute &&
    rankingUpdatedAtMs != null &&
    (rankingSeenMs == null || rankingUpdatedAtMs > rankingSeenMs);

  const showResultBadge =
    active && !onResultRoute && resultBaselineReady && hasNewSettledPost;

  return { showRankingBadge, showResultBadge };
}
