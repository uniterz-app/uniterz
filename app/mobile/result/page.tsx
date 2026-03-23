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
import ResultCard from "@/app/component/result/ResultCard";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

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

function formatDateLabel(ms?: number | null) {
  if (!ms) return "Unknown";
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
        const filtered = list.filter((p) => !seen.has(p.id));
        return [...prev, ...filtered];
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
      const dateLabel = formatDateLabel(groupMs);

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
  }, [posts]);

  if (!authReady) return null;
  if (!uid) return null;

  return (
    <div className="px-4 py-4 space-y-6">
      {grouped.map((day) => (
        <div key={day.dateLabel}>
          <div className="mb-3 flex items-center justify-center">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wide text-white/70 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
              {day.dateLabel}
            </div>
          </div>

          <div className="space-y-4">
            {day.pending.length > 0 && (
              <div className="space-y-3">
                {day.pending.map((post) => (
                  <ResultCard
                    key={post.id}
                    post={post}
                    href={`/mobile/result/${post.id}`}
                  />
                ))}
              </div>
            )}

            {day.final.length > 0 && (
              <div className="space-y-3">
                {day.final.map((post) => (
                  <ResultCard
                    key={post.id}
                    post={post}
                    href={`/mobile/result/${post.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} className="h-10" />

      {loading && (
        <div className="py-6 text-center text-white/60 text-sm">Loading...</div>
      )}

      {!loading && !hasMore && posts.length > 0 && (
        <div className="py-6 text-center text-white/40 text-sm">
          これ以上ありません
        </div>
      )}
    </div>
  );
}