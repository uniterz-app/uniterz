import { useEffect, useState } from "react";
import { AppState } from "react-native";
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
import { db } from "../lib/firebase";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import {
  markNavRankingSeenNative,
  markNavResultSeenNative,
  readNavRankingSeenMsNative,
  readNavResultSeenMsNative,
} from "./navTabNotificationSeenNative";

/** Web `useNavTabNotificationBadges` と同趣旨 — 常時 onSnapshot を避けて poll */
const BADGE_POLL_MS = 120_000;

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
  const {
    rankingTabActive = false,
    resultTabActive = false,
  } = options;
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
    const ref = doc(db, "cumulative_stats", uid);

    void readNavRankingSeenMsNative(uid).then((seen) => {
      if (!cancelled) setRankingSeenMs(seen);
    });

    const refresh = async () => {
      if (AppState.currentState !== "active") return;
      try {
        const snap = await getDoc(ref);
        if (cancelled) return;
        const ms = firestoreTsToMs(snap.data()?.snapshotRanks?.updatedAt);
        setRankingUpdatedAtMs(ms);
        const seen = await readNavRankingSeenMsNative(uid);
        if (seen == null && ms != null) {
          await markNavRankingSeenNative(uid, ms);
          if (!cancelled) setRankingSeenMs(ms);
        }
      } catch {
        if (!cancelled) setRankingUpdatedAtMs(null);
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), BADGE_POLL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
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
    if (
      !active ||
      !uid ||
      !resultBaselineReady ||
      resultSeenMs == null ||
      resultTabActive
    ) {
      if (resultTabActive) setHasNewSettledPost(false);
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
      if (AppState.currentState !== "active") return;
      try {
        const snap = await getDocs(q);
        if (!cancelled) setHasNewSettledPost(snap.size > 0);
      } catch {
        if (!cancelled) setHasNewSettledPost(false);
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), BADGE_POLL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [active, uid, resultBaselineReady, resultSeenMs, resultTabActive]);

  useEffect(() => {
    if (!active || !uid || !rankingTabActive) return;
    const ms = rankingUpdatedAtMs ?? Date.now();
    void markNavRankingSeenNative(uid, ms).then(() => setRankingSeenMs(ms));
  }, [active, uid, rankingTabActive, rankingUpdatedAtMs]);

  useEffect(() => {
    if (!active || !uid || !resultTabActive) return;
    const ms = Date.now();
    void markNavResultSeenNative(uid, ms).then(() => {
      setHasNewSettledPost(false);
    });
  }, [active, uid, resultTabActive]);

  useEffect(() => {
    if (!active || !uid || resultTabActive) return;
    let cancelled = false;
    void readNavResultSeenMsNative(uid).then((seen) => {
      if (cancelled || seen == null) return;
      setResultSeenMs((prev) => (prev === seen ? prev : seen));
    });
    return () => {
      cancelled = true;
    };
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
