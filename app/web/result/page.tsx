"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type DocumentSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import ResultListWithOverlay from "@/app/component/result/ResultListWithOverlay";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";

const PAGE_SIZE = 20;

type PostWithMillis = PredictionPostV2 & {
  createdAtMillis?: number | null;
  settledAtMillis?: number | null;
};

function toCreatedAtMillis(p: any): number | null {
  if (typeof p?.createdAtMillis === "number") return p.createdAtMillis;

  const t = p?.createdAt;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

function toSettledAtMillis(p: any): number | null {
  if (typeof p?.settledAtMillis === "number") return p.settledAtMillis;

  const t = p?.settledAt;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

function formatDateLabel(ms: number | null | undefined, lang: Language) {
  if (!ms) return lang === "en" ? "Unknown" : "不明";
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function getGroupDateMillis(post: PostWithMillis): number {
  return post.createdAtMillis ?? 0;
}

function isFinalPost(post: PostWithMillis): boolean {
  return post.status === "final" && !!post.settledAtMillis;
}

export default function ResultPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const { language } = useUserLanguage(uid);

  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
  }, [authReady, uid]);

  async function loadPage({ reset = false }: { reset?: boolean } = {}) {
    if (!uid) return;
    if (loading) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    try {
      const base = [
        where("authorUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      ] as const;

      const q = reset
        ? query(collection(db, "posts"), ...base)
        : lastDoc
          ? query(collection(db, "posts"), ...base, startAfter(lastDoc))
          : query(collection(db, "posts"), ...base);

      const snap = await getDocs(q);

      const list = snap.docs.map((d) => {
        const raw = d.data() as any;
        const createdAtMillis = toCreatedAtMillis(raw);
        const settledAtMillis = toSettledAtMillis(raw);

        return {
          id: d.id,
          ...raw,
          createdAtMillis: createdAtMillis ?? raw.createdAtMillis ?? null,
          settledAtMillis: settledAtMillis ?? raw.settledAtMillis ?? null,
        } as PostWithMillis;
      });

      const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

      setPosts((prev) => {
        if (reset) return list;

        const seen = new Set(prev.map((p) => p.id));
        const deduped = list.filter((p) => !seen.has(p.id));
        return [...prev, ...deduped];
      });

      setLastDoc(newLast);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady || !uid) return;
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid]);

  useEffect(() => {
    if (!authReady || !uid) return;
    if (!sentinelRef.current) return;

    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (loading) return;
        if (!hasMore) return;
        void loadPage();
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid, loading, hasMore, lastDoc]);

  const grouped = useMemo(() => {
    const dayMap = new Map<
      string,
      {
        dateLabel: string;
        dateMs: number;
        pending: PostWithMillis[];
        final: PostWithMillis[];
      }
    >();

    posts.forEach((post) => {
      const groupMs = getGroupDateMillis(post);
      const dateLabel = formatDateLabel(groupMs, language);

      if (!dayMap.has(dateLabel)) {
        dayMap.set(dateLabel, {
          dateLabel,
          dateMs: groupMs,
          pending: [],
          final: [],
        });
      }

      const bucket = dayMap.get(dateLabel)!;

      if (isFinalPost(post)) {
        bucket.final.push(post);
      } else {
        bucket.pending.push(post);
      }
    });

    const days = Array.from(dayMap.values()).sort((a, b) => b.dateMs - a.dateMs);

    days.forEach((day) => {
      day.pending.sort(
        (a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0)
      );

      day.final.sort(
        (a, b) => (b.settledAtMillis ?? 0) - (a.settledAtMillis ?? 0)
      );
    });

    return days;
  }, [posts, language]);

  if (!authReady || !uid) return null;

  return (
    <div className="px-4 py-4">
      <ResultListWithOverlay
        grouped={grouped}
        loading={loading}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        language={language}
      />
    </div>
  );
}