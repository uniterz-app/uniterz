"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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

/** 未読ドットは数分遅れでも可。常時 onSnapshot は開発中の読み取り急増の主因 */
const BADGE_POLL_MS = 120_000;

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

    const refresh = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const snap = await getDoc(ref);
        if (cancelled) return;
        const ms = firestoreTsToMs(snap.data()?.snapshotRanks?.updatedAt);
        setRankingUpdatedAtMs(ms);

        const seen = readNavRankingSeenMs(uid);
        if (seen == null && ms != null) {
          markNavRankingSeen(uid, ms);
        }
      } catch {
        if (!cancelled) setRankingUpdatedAtMs(null);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), BADGE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
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
    if (!active || !uid || !resultBaselineReady || resultSeenMs == null || onResultRoute) {
      if (onResultRoute) setHasNewSettledPost(false);
      return;
    }

    let cancelled = false;
    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", uid),
      where("schemaVersion", "==", 2),
      where("settledAt", ">", Timestamp.fromMillis(resultSeenMs)),
      orderBy("settledAt", "desc"),
      limit(1)
    );

    const refresh = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const snap = await getDocs(q);
        if (!cancelled) setHasNewSettledPost(snap.size > 0);
      } catch {
        if (!cancelled) setHasNewSettledPost(false);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), BADGE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, uid, resultBaselineReady, resultSeenMs, onResultRoute]);

  useEffect(() => {
    if (!active || !uid || !onRankingsRoute) return;
    markNavRankingSeen(uid, rankingUpdatedAtMs ?? Date.now());
  }, [active, uid, onRankingsRoute, rankingUpdatedAtMs]);

  useEffect(() => {
    if (!active || !uid || !onResultRoute) return;
    // ストレージのみ。state の resultSeenMs を毎回変えると posts poll が張り直される
    markNavResultSeen(uid, Date.now());
    setHasNewSettledPost(false);
  }, [active, uid, onResultRoute]);

  useEffect(() => {
    if (!active || !uid || onResultRoute) return;
    const seen = readNavResultSeenMs(uid);
    if (seen == null) return;
    setResultSeenMs((prev) => (prev === seen ? prev : seen));
  }, [active, uid, onResultRoute, seenRev]);

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
