"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CancelCompletePage() {
  const router = useRouter();

  const [proUntil, setProUntil] = useState<string>("");
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.handle) {
        setHandle(data.handle);
      }

      if (data.proUntil) {
        setProUntil(
          data.proUntil.toDate().toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        );
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-4 text-center">
      {/* ===== 上部メッセージ ===== */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-6 w-6 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">
            ✓
          </div>

          <h1 className="text-xl font-extrabold text-white/90">
            Your plan has been canceled!
          </h1>
        </div>

        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          Pro Planのご利用、ありがとうございました。<br />
          皆さまのサポートが、Uniterzの改善につながっています。
        </p>
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
        {/* ロゴカード */}
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

            <div className="tracking-[0.22em] text-2xl font-semibold text-white/90">
              UNITERZ
            </div>

            <div className="text-sm text-white/80">
              Free Plan
            </div>
          </div>
        </div>

        {/* 利用期限 */}
        <div className="text-xs text-white/75 text-center mb-2">
          プランは
          <span className="mx-1 font-semibold text-white/90">
            {proUntil || "—"}
          </span>
          まで利用できます
        </div>

        {/* ===== CTA ===== */}
        <button
          onClick={() => {
            if (!handle) return;
            router.push(`/mobile/u/${handle}`);
          }}
          className="
            w-full rounded-2xl py-3 font-bold text-white
            transition
            hover:brightness-110
            active:scale-95 active:brightness-90
          "
          style={{
            background: "linear-gradient(90deg, #F59E0B, #F97316)",
          }}
        >
          Back to Profile
        </button>
      </div>

      {/* ===== カード外（利用規約・お問い合わせリンク） ===== */}
      <div className="mt-6 text-xs text-white/60">
        <span>プランに関する質問はサポートに問い合わせしてください。</span>
        <div className="mt-2">
          <span
            onClick={() => router.push("/mobile/terms")}
            className="text-sm font-bold text-white hover:text-gray-200 cursor-pointer"
          >
            利用規約
          </span>{" "}
          |{" "}
          <span
            onClick={() => router.push("/mobile/contact")}
            className="text-sm font-bold text-white hover:text-gray-200 cursor-pointer"
          >
            お問い合わせ
          </span>
        </div>
      </div>
    </div>
  );
}
