// app/component/post/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  onSnapshot,
  Timestamp as FsTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import PredictionPostCard, {
  type PredictionPost,
  type PredictionLeg,
} from "@/app/component/post/PredictionPostCard";

/* ---- helpers ---- */
function fmtCreatedAt(ts?: any) {
  let d: Date | null = null;
  if (ts?.toDate) d = (ts as FsTimestamp).toDate();
  else if (typeof ts === "number") d = new Date(ts);
  if (!d) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
const pickName = (v: any) => (typeof v === "string" ? v : v?.name ?? "");

/** Firestoreドキュメント -> UI用に防御的に正規化 */
function toUiPost(id: string, x: any): PredictionPost {
  const g = x?.game ?? {};

  const league = g.league ?? x.league ?? "bj";
  const home = pickName(g.home ?? x.home);
  const away = pickName(g.away ?? x.away);
  const status = String(g.status ?? x.status ?? "scheduled").toLowerCase();
  const finalScore = g.finalScore ?? x.finalScore ?? undefined;

  const legs: PredictionLeg[] = Array.isArray(x?.legs)
    ? x.legs
        .map((l: any) => ({
          kind:
            l?.kind === "secondary"
              ? "secondary"
              : l?.kind === "tertiary"
              ? "tertiary"
              : "main",
          label: String(l?.label ?? ""),
          odds: Number(l?.odds ?? 0),
          pct: Number(l?.pct ?? 0),
          outcome:
            l?.outcome === "hit" || l?.outcome === "miss" || l?.outcome === "void"
              ? l.outcome
              : "pending",
        }))
        .filter((l: PredictionLeg) => l.label && Number.isFinite(l.odds))
    : [];

  return {
    id,
    author: x?.authorDisplayName
      ? { name: x.authorDisplayName, avatarUrl: x.authorPhotoURL ?? undefined }
      : undefined,
    createdAtText: fmtCreatedAt(x?.createdAt),
    game:
      league && (home || away)
        ? ({ league, home, away, status, finalScore } as any)
        : undefined,
    legs,
    resultUnits: typeof x?.resultUnits === "number" ? x.resultUnits : null,
    note: typeof x?.note === "string" ? x.note : "",
    authorUid: x?.authorUid ?? null,
    startAtMillis: typeof x?.startAtMillis === "number" ? x.startAtMillis : null,
    likeCount: Number.isFinite(x?.likeCount) ? Number(x.likeCount) : 0,
    saveCount: Number.isFinite(x?.saveCount) ? Number(x.saveCount) : 0,
  };
}

/* ---- page ---- */
export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PredictionPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "posts", id);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data();
        if (!d) {
          setPost(null);
          setLoading(false);
          return;
        }
        setPost(toUiPost(snap.id, d));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [id]);

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (!post) return <div className="p-6 text-white/70">存在しない投稿です。</div>;

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6">
      <PredictionPostCard post={post} />
    </div>
  );
}
