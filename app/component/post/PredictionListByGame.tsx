"use client";

import React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";  // ← ★ auth を追加
import PredictionPostCard, {
  PredictionPost,
  PredictionLeg,
} from "@/app/component/post/PredictionPostCard";

/** Firestore Timestamp → 表示テキスト */
function fmtCreatedAt(ts?: Timestamp | null) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** createdAt のミリ秒 */
function getCreatedAtMillis(doc: QueryDocumentSnapshot<DocumentData>): number {
  const v: any = doc.get("createdAt");
  if (v?.toMillis) return v.toMillis();
  if (typeof v === "number") return v;
  return 0;
}

/** UI 用に整形 */
function toUiPost(doc: QueryDocumentSnapshot<DocumentData>): PredictionPost {
  const x = doc.data() as any;
  const g = x.game ?? {};

  const pickName = (v: any) => (typeof v === "string" ? v : v?.name ?? "");

  const legs: PredictionLeg[] = Array.isArray(x.legs)
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

  const league = g.league ?? x.league ?? "bj";
  const home = pickName(g.home ?? x.home);
  const away = pickName(g.away ?? x.away);
  const status = String(g.status ?? x.status ?? "scheduled").toLowerCase();
  const finalScore = g.finalScore ?? x.finalScore ?? undefined;

  return {
    id: doc.id,
    author: x.authorDisplayName
      ? { name: x.authorDisplayName, avatarUrl: x.authorPhotoURL ?? undefined }
      : undefined,
    createdAtText: fmtCreatedAt(x.createdAt ?? null),
    game:
      league && (home || away)
        ? { league, home, away, status: status as any, finalScore }
        : undefined,
        gameId: x.gameId ?? x.game?.gameId ?? null,
    legs,
    resultUnits: typeof x.resultUnits === "number" ? x.resultUnits : null,
    note: typeof x.note === "string" ? x.note : "",
    authorUid: x.authorUid ?? null,
    authorHandle: x.authorHandle ?? null,
    startAtMillis: typeof x.startAtMillis === "number" ? x.startAtMillis : null,
    likeCount: Number.isFinite(x.likeCount) ? Number(x.likeCount) : 0,
    saveCount: Number.isFinite(x.saveCount) ? Number(x.saveCount) : 0,
  };
}

export default function PredictionListByGame({
  gameId,
  pageSize = 20,
}: {
  gameId: string;
  pageSize?: number;
}) {
  const [posts, setPosts] = React.useState<PredictionPost[] | null>(null);

  React.useEffect(() => {
    if (!gameId) return;

    // ★ ログインしていない → Firestoreルールで読めない → エラーになるので購読しない
    const me = auth.currentUser;
    if (!me) {
      setPosts([]);      // UI の挙動そのまま（空表示）
      return;
    }

    const qNew = query(
      collection(db, "posts"),
      where("game.gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const qOld = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    let docsNew: QueryDocumentSnapshot<DocumentData>[] = [];
    let docsOld: QueryDocumentSnapshot<DocumentData>[] = [];

    const emit = () => {
      const map = new Map<string, QueryDocumentSnapshot<DocumentData>>();
      for (const d of docsNew) map.set(d.id, d);
      for (const d of docsOld) map.set(d.id, d);
      const merged = Array.from(map.values()).sort(
        (a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a)
      );
      setPosts(merged.map(toUiPost));
    };

    const offNew = onSnapshot(
      qNew,
      (snap) => {
        docsNew = snap.docs;
        emit();
      },
      (err) => {
        console.warn("[PredictionListByGame] new path error:", err);
        docsNew = [];
        emit();
      }
    );

    const offOld = onSnapshot(
      qOld,
      (snap) => {
        docsOld = snap.docs;
        emit();
      },
      (err) => {
        console.warn("[PredictionListByGame] old path error:", err);
        docsOld = [];
        emit();
      }
    );

    return () => {
      offNew();
      offOld();
    };
  }, [gameId, pageSize]);

  if (posts == null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        読み込み中…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        まだこの試合の分析はありません。
      </div>
    );
  }

  return (
  <div className="space-y-3 md:space-y-4">
    {posts.map((p) => {
      const handle =
        (p.authorHandle ?? "").replace(/^@/, "") ||
        p.authorUid ||
        "";
      const profileHref = `/mobile/u/${handle}`;

      return (
        <PredictionPostCard
          key={p.id}
          post={p}
          mode="list"
          profileHref={profileHref}
        />
      );
    })}
  </div>
);
}
