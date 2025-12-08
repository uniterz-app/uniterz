"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
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

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { toUiPost } from "@/lib/toUiPost";  


/* -----------------------------------------
   UID → @handle を逆引き
----------------------------------------- */
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
    const qs = await getDocs(query(sref, where("uid", "==", uid)));
    const first = qs.docs[0];
    if (first) return first.id;
  } catch {}

  return null;
}

/* -----------------------------------------
   Post Detail Client（V2）
----------------------------------------- */
export default function PostDetailClient() {
  const { id } = useParams<{ id: string }>();

  const pathname = usePathname();
  const prefix = pathname.startsWith("/web") ? "/web" : "/mobile";

  const [post, setPost] = useState<PredictionPostV2 | null>(null);
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

        const raw = snap.data();

        // ★ Firestore → V2 UI 形式へ正規化
        const mapped = toUiPost(snap.id, raw);

        setPost(mapped);

        // ★ プロフィールリンク
        if (mapped.authorUid) {
          const handle = await fetchHandleByUid(mapped.authorUid);
          setProfileHref(null);  // or そもそも state を消す
        }

        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [id, prefix]);

  if (loading)
    return <div className="p-6 text-white/70 text-center">読み込み中…</div>;

  if (!post)
    return <div className="p-6 text-white/70 text-center">存在しない投稿です。</div>;

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6">
      <PredictionPostCardV2
        post={post}
        mode="detail"
        profileHref={profileHref ?? undefined}
      />
    </div>
  );
}
