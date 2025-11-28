"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ChevronLeft } from "lucide-react";

/* 一覧と同じマッピング */
const TYPE_META: Record<string, { label: string; grad: string; glow: string }> = {
  event:       { label: "イベント",     grad: "from-[#00E5FF] to-[#0077FF]", glow: "shadow-[0_0_22px_rgba(0,229,255,0.35)]" },
  campaign:    { label: "キャンペーン", grad: "from-[#FF4DFF] to-[#A64DFF]", glow: "shadow-[0_0_22px_rgba(255,77,255,0.35)]" },
  update:      { label: "アップデート", grad: "from-[#9DFF00] to-[#3DFF75]", glow: "shadow-[0_0_22px_rgba(61,255,117,0.35)]" },
  maintenance: { label: "メンテナンス", grad: "from-[#FFC400] to-[#FF7A00]", glow: "shadow-[0_0_22px_rgba(255,122,0,0.35)]" },
  info:        { label: "お知らせ",     grad: "from-[#9CA3AF] to-[#6B7280]", glow: "shadow-[0_0_22px_rgba(156,163,175,0.25)]" },
};

type Ann = {
  title: string;
  body?: string;
  heroImageURL?: string;
  type?: string; // "event" | "campaign" | "update" | "maintenance" | "info"
  postedAt?: Timestamp;
};

function formatDate(d?: Timestamp) {
  if (!d) return "";
  const date = d.toDate();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}

export default function WebAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fUser: user, status } = useFirebaseUser();

  const [a, setA] = useState<Ann | null>(null);

  // 取得
  useEffect(() => {
    (async () => {
      const ref = doc(db, "announcements", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setA(snap.data() as Ann);
    })();
  }, [id]);

  // 既読マーキング
  useEffect(() => {
    if (status !== "ready" || !user?.uid || !id) return;
    (async () => {
      const ref = doc(db, `users/${user.uid}/reads/${id}`);
      await setDoc(ref, { at: serverTimestamp() }, { merge: true });
    })();
  }, [status, user?.uid, id]);

  if (!a) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white">
        <div className="mx-auto max-w-[840px] px-5 py-10">
          <p className="text-white/60">読み込み中...</p>
        </div>
      </div>
    );
  }

  const src = (a.heroImageURL ?? "").trim().replace(/\s+/g, "%20");
  const meta = TYPE_META[a.type ?? "info"];

  return (
    <div className="relative min-h-screen text-white">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-[#0B0F17]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 16% 0%, rgba(0,229,255,0.10) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(164,77,255,0.08) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* header */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[#0B0F17]/70 border-b border-white/5">
        <div className="mx-auto max-w-[840px] px-5">
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95"
              aria-label="戻る"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">お知らせ</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[840px] px-5 py-6">
        {src && (
          <Image
            src={src}
            alt={a.title}
            width={1440}
            height={810}
            className="w-full h-[320px] object-cover rounded-2xl border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
            priority
          />
        )}

        <div className="mt-4 flex items-center gap-3">
          {/* 一覧と同じ “日本語ラベル & グラデ & グロー” */}
          <span
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gradient-to-r ${meta.grad} text-black/90 ${meta.glow}`}
          >
            {meta.label}
          </span>
          <span className="text-xs text-white/60">{formatDate(a.postedAt)}</span>
        </div>

        <h2 className="text-2xl font-bold mt-2 leading-snug">{a.title}</h2>

        <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-white/90">
          {a.body ?? ""}
        </div>
      </div>
    </div>
  );
}
