"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import PredictionPostCard, {
  type PredictionPost,
} from "@/app/component/post/PredictionPostCard";

/** uid -> handle を解決（users優先→slugs逆引き） */
async function fetchHandleByUid(uid: string): Promise<string | null> {
  try {
    const uref = doc(db, "users", uid);
    const usnap = await getDoc(uref);
    if (usnap.exists()) {
      const d: any = usnap.data();
      const handle = d?.handle ?? d?.slug ?? d?.username ?? null;
      if (handle && typeof handle === "string") return handle;
    }
  } catch {}

  try {
    const sref = collection(db, "slugs");
    const q = query(sref, where("uid", "==", uid));
    const qs = await getDocs(q);
    const first = qs.docs[0];
    if (first) return first.id;
  } catch {}

  return null;
}

export default function PostDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PredictionPost | null>(null);
  const [profileHref, setProfileHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "posts", id);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          setPost(null);
          setLoading(false);
          return;
        }

        const d: any = snap.data() || {};
        const g: any = d.game ?? {};

        const fsRaw = g.finalScore ?? d.finalScore ?? null;
        const finalScore =
          fsRaw != null
            ? { home: Number(fsRaw.home), away: Number(fsRaw.away) }
            : undefined;

        const mapped: PredictionPost = {
          id: snap.id,
          author: d.author ?? {
            name: d.authorDisplayName ?? "ユーザー",
            avatarUrl: d.authorPhotoURL ?? "",
          },
          createdAtText: d.createdAtText ?? "",
          game: {
            league: (g.league ?? d.league ?? "bj") as any,
            home:
              typeof g.home === "string" ? g.home : g.home?.name ?? d.home ?? "",
            away:
              typeof g.away === "string" ? g.away : g.away?.name ?? d.away ?? "",
            status: (g.status ?? d.status ?? "scheduled") as any,
            finalScore,
          },
          legs: Array.isArray(d.legs) ? d.legs : [],
          resultUnits: typeof d.resultUnits === "number" ? d.resultUnits : null,
          note: typeof d.note === "string" ? d.note : "",
          authorUid: d.authorUid ?? null,
          startAtMillis:
            typeof d.startAtMillis === "number" ? d.startAtMillis : null,
          likeCount: Number.isFinite(d.likeCount) ? d.likeCount : 0,
          saveCount: Number.isFinite(d.saveCount) ? d.saveCount : 0,
        };

        setPost(mapped);

        // 🔥 プロフィールリンク生成（唯一の追加）
        if (mapped.authorUid) {
          const handle = await fetchHandleByUid(mapped.authorUid);
          if (handle) {
            setProfileHref(`/mobile/u/${handle}`);
          } else {
            setProfileHref(`/mobile/u/${mapped.authorUid}`);
          }
        }

        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [id]);

  if (loading)
    return <div className="p-6 text-white/70 text-center">読み込み中…</div>;
  if (!post)
    return <div className="p-6 text-white/70 text-center">存在しない投稿です。</div>;

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6">
      <PredictionPostCard post={post} profileHref={profileHref ?? undefined} />
    </div>
  );
}
