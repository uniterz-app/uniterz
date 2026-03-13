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
import { usePathname } from "next/navigation";
import ResultCard from "@/app/component/result/ResultCard";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

function toMillis(p: any): number | null {
  if (typeof p?.createdAtMillis === "number") return p.createdAtMillis;

  const t = p?.createdAt;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

function formatDateLabel(ms?: number | null) {
  if (!ms) return "Unknown";
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

const PAGE_SIZE = 20;

export default function ResultPage() {
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");
  const prefix = isMobile ? "/mobile" : "/web";

  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
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

  // uidが変わったら初期化
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
        const createdAtMillis = toMillis(raw);
        return {
          id: d.id,
          ...raw,
          createdAtMillis: createdAtMillis ?? raw.createdAtMillis ?? null,
        } as PredictionPostV2;
      });

      const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

      // ★ 追加：id重複を除去（既に入っているpost.idは追加しない）
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

  // 初回ロード
  useEffect(() => {
    if (!authReady || !uid) return;
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid]);

  // 無限スクロール（末尾に来たら次の20件）
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
    const map = new Map<string, PredictionPostV2[]>();
    posts.forEach((p) => {
      const key = formatDateLabel(p.createdAtMillis);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, [posts]);

  if (!authReady || !uid) return null;

  return (
    <div className="px-4 py-4 space-y-6">
      {grouped.map(([date, list]) => (
        <div key={date}>
          <div className="mb-3 flex items-center justify-center">
            <div className="px-5 py-2 text-sm font-bold tracking-wide text-white/80 bg-white/5 border border-white/15 rounded-full backdrop-blur-sm">
              {date}
            </div>
          </div>

          <div className="space-y-3">
            {list.map((post) => (
              <ResultCard
                key={post.id}
                post={post}
                href={`${prefix}/result/${post.id}`}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 末尾センサー */}
      <div ref={sentinelRef} className="h-10" />

      {/* ローディング表示 */}
      {loading && (
        <div className="py-6 text-center text-white/60 text-sm">Loading...</div>
      )}

      {/* もう無い */}
      {!loading && !hasMore && posts.length > 0 && (
        <div className="py-6 text-center text-white/40 text-sm">
          これ以上ありません
        </div>
      )}
    </div>
  );
}