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

export default function WebAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const { fUser: user, status } = useFirebaseUser();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // fetch announcements
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          where("visible", "==", true),
          orderBy("pinned", "desc"),
          orderBy("postedAt", "desc"),
          limit(30)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Announcement[];
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // subscribe reads
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

  const isUnread = useMemo(() => {
    if (status !== "ready" || !user?.uid) return (_: string) => false;
    return (id: string) => !readIds.has(id);
  }, [status, user?.uid, readIds]);

  return (
    <div className="relative min-h-screen text-white">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-[#0B0F17]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 20% 0%, rgba(0,229,255,0.10) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(164,77,255,0.08) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* header */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[#0B0F17]/70 border-b border-white/5">
        <div className="mx-auto max-w-[840px] px-5">
          <h1 className="text-left text-xl font-bold py-4">お知らせ</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[840px] px-5 py-6">
        {/* skeleton */}
        {loading && (
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <div className="h-56 w-full animate-pulse bg-white/10" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-white/10 animate-pulse rounded" />
                  <div className="h-6 w-3/4 bg-white/10 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-center text-sm text-white/60 mt-16">現在お知らせはありません</p>
        )}

        {!loading && items.map((a) => {
          const src = (a.heroImageURL ?? "").trim().replace(/\s+/g, "%20");
          const meta = TYPE_META[a.type ?? "info"];
          const unread = isUnread(a.id);

          return (
            <Link href={`/web/announcements/${a.id}`} key={a.id}>
              <div
                className={[
                  "relative rounded-2xl overflow-hidden mb-6 border border-white/10 bg-white/5",
                  "transition-transform duration-150 hover:shadow-[0_0_56px_rgba(0,229,255,0.12),0_0_120px_rgba(164,77,255,0.08)] hover:translate-y-[-1px]",
                ].join(" ")}
              >
                {unread && (
                  <span
                    className="absolute right-3 top-3 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.9)]"
                    aria-label="未読"
                  />
                )}

                {src ? (
                  <Image
                    src={src}
                    alt={a.title}
                    width={1200}
                    height={630}
                    className="w-full h-56 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-56 bg-white/5" />
                )}

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gradient-to-r ${meta.grad} text-black/90 ${meta.glow}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-white/60">{formatDate(a.postedAt)}</span>
                  </div>
                  <h2 className="text-lg font-semibold mt-2 leading-snug">{a.title}</h2>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
