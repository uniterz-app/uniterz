"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProSuccessPage({ plan }: { plan: "monthly" | "annual" }) {
  const router = useRouter();
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  (async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    const h = snap.data()?.handle;
    if (h) setHandle(h);
  })();
}, []);

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-4 text-center">
      {/* ===== 上部メッセージ（カード外） ===== */}
      <div className="mb-6 flex items-center gap-2">
        {/* チェックマーク */}
        <div className="h-6 w-6 rounded-full bg-yellow-400 text-black text-sm font-bold flex items-center justify-center">
          ✓
        </div>

        <h1 className="text-xl font-extrabold text-white/90">
          Upgrade to Pro!
        </h1>
      </div>

      {/* ===== メインカード ===== */}
      <div
        className="
          relative
          w-[320px] h-[320px]
          rounded-[36px]
          bg-white/5
          backdrop-blur-xl
          border border-white/15
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
          px-6 py-6
          flex flex-col justify-between
        "
      >
        {/* ===== ロゴ背景カード（追加部分） ===== */}
        <div className="flex justify-center">
          <div
            className="
              w-[220px] h-[180px]
              rounded-[28px]
              bg-[#0b1f26]
              border border-white/10
              flex flex-col items-center justify-center
              gap-3
            "
          >
            <Image
              src="/logo/logo.png"
              alt="Uniterz"
              width={60}
              height={60}
              priority
            />

            {/* UNITERZ ロゴ文字 */}
            <div className="tracking-[0.22em] text-2xl font-semibold text-white/90">
              UNITERZ
            </div>

            {/* 料金タイプ（月額または年額） */}
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span>
                {plan === "monthly" ? "Pro Monthly Plan" : "Pro Yearly Plan"}
              </span>
            </div>
          </div>
        </div>

        {/* 開始日 */}
        <div className="text-xs text-white/60 text-center mb-2">
          Started on{" "}
          {new Date().toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>

        {/* ===== CTA ===== */}
<button
disabled={!handle}
  onClick={() => router.push(`/mobile/u/${handle}`)}
  className="
    w-full rounded-2xl py-3 font-bold text-white
    transition
    hover:brightness-110
    active:scale-95 active:brightness-90
  "
  style={{
    background: "linear-gradient(90deg, #3B82F6, #22D3EE)",
  }}
>
  Pro データを見る
</button>
      </div>

      {/* ===== カード外（利用規約・お問い合わせリンク） ===== */}
<div className="mt-6 text-xs text-white/60">
  <span>プランに関する質問はサポートに問い合わせしてください。</span>
  <div className="mt-2">
    <span
      onClick={() => router.push("/mobile/terms")}  // 利用規約ページに遷移
      className="text-sm font-bold text-white hover:text-gray-200 cursor-pointer"
    >
      利用規約
    </span>{" "}
    |{" "}
    <span
      onClick={() => router.push("/mobile/contact")}  // お問い合わせページに遷移
      className="text-sm font-bold text-white hover:text-gray-200 cursor-pointer"
    >
      お問い合わせ
    </span>
  </div>
</div>
    </div>
  );
}
