"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

type Announcement = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string; // event | campaign | update | maintenance | info
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
};

const TYPE_META: Record<string, { label: string; grad: string; glow: string }> = {
  event:       { label: "イベント",     grad: "from-[#00E5FF] to-[#0077FF]", glow: "shadow-[0_0_22px_rgba(0,229,255,0.35)]" },
  campaign:    { label: "キャンペーン", grad: "from-[#FF4DFF] to-[#A64DFF]", glow: "shadow-[0_0_22px_rgba(255,77,255,0.35)]" },
  update:      { label: "アップデート", grad: "from-[#9DFF00] to-[#3DFF75]", glow: "shadow-[0_0_22px_rgba(61,255,117,0.35)]" },
  maintenance: { label: "メンテナンス", grad: "from-[#FFC400] to-[#FF7A00]", glow: "shadow-[0_0_22px_rgba(255,122,0,0.35)]" },
  info:        { label: "お知らせ",     grad: "from-[#9CA3AF] to-[#6B7280]", glow: "shadow-[0_0_22px_rgba(156,163,175,0.25)]" },
};

function formatDate(d?: Timestamp | Date | null) {
  if (!d) return "";
  const date = d instanceof Timestamp ? d.toDate() : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // ログインユーザー（{ fUser, status }）
  const { fUser: user, status } = useFirebaseUser();

  // 既読ID集合
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // お知らせ読み込み
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          where("visible", "==", true),
          orderBy("pinned", "desc"),
          orderBy("postedAt", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Announcement[];
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 既読の購読（ログイン時のみ）
  useEffect(() => {
    if (status !== "ready" || !user?.uid) {
      setReadIds(new Set());
      return;
    }
    const colRef = collection(db, `users/${user.uid}/reads`);
    const unsub = onSnapshot(colRef, (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setReadIds(s);
    });
    return () => unsub();
  }, [status, user?.uid]);

  // 未読判定
  const isUnread = useMemo(() => {
    if (status !== "ready" || !user?.uid) {
      return (_id: string) => false; // 未ログイン時は未読ドット非表示
    }
    return (id: string) => !readIds.has(id);
  }, [status, user?.uid, readIds]);

  return (
    <div className="relative min-h-screen text-white">
      {/* ダークネオン背景（放射+グラデ） */}
      <div className="absolute inset-0 -z-10 bg-[#0B0F17]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70"
           style={{
             background: "radial-gradient(60% 40% at 20% 0%, rgba(0,229,255,0.10) 0%, rgba(0,0,0,0) 60%), radial-gradient(45% 35% at 100% 10%, rgba(164,77,255,0.08) 0%, rgba(0,0,0,0) 60%)"
           }} />

      {/* ヘッダー */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[#0B0F17]/70 border-b border-white/5">
        <h1 className="text-center text-lg font-bold py-3">お知らせ</h1>
      </div>

      <div className="p-4">
        {/* スケルトン */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
              >
                <div className="h-44 w-full animate-pulse bg-white/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />
                  <div className="h-5 w-4/5 bg-white/10 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-center text-sm text-white/60 mt-10">
            現在お知らせはありません
          </p>
        )}

        {!loading &&
          items.map((a) => {
            const src = (a.heroImageURL ?? "").trim().replace(/\s+/g, "%20");
            const meta = TYPE_META[a.type ?? "info"];
            const unread = isUnread(a.id);

            return (
              <Link href={`/mobile/announcements/${a.id}`} key={a.id}>
                <div
                  className={[
                    "relative rounded-2xl overflow-hidden mb-5 border border-white/10 bg-white/5",
                    "transition-transform duration-150 active:scale-[0.99]",
                    "hover:shadow-[0_0_40px_rgba(0,229,255,0.10),0_0_80px_rgba(164,77,255,0.06)]",
                  ].join(" ")}
                >
                  {/* 未読ドット */}
                  {unread && (
                    <span
                      className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                      aria-label="未読"
                    />
                  )}

                  {/* 画像（16:9） */}
                  {src ? (
                    <Image
                      src={src}
                      alt={a.title}
                      width={800}
                      height={450}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-44 bg-white/5" />
                  )}

                  {/* 本文 */}
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r ${meta.grad} text-black/90 ${meta.glow}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-white/60">
                        {formatDate(a.postedAt)}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold mt-1 leading-tight">
                      {a.title}
                    </h2>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
      {/* 戻るボタン（右下固定） */}
<button
  onClick={() => window.history.back()}
  className="
    fixed bottom-6 right-6 z-50 
    h-12 w-12 rounded-full 
    bg-white/10 backdrop-blur 
    border border-white/20 
    flex items-center justify-center 
    active:scale-95 transition 
    hover:bg-white/20
  "
  aria-label="閉じる"
>
  <span className="text-white text-xl font-bold leading-none">×</span>
</button>

    </div>
  );
}
