// app/mobile/settings/plan-change-complete/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type PlanType = "monthly" | "annual";

export default function PlanChangeCompletePage() {
  const router = useRouter();

  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [proUntil, setProUntil] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.planType === "monthly" || data.planType === "annual") {
        setPlanType(data.planType);
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
      <div className="mb-6 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-green-400 text-black text-sm font-bold flex items-center justify-center">
          ✓
        </div>

        <h1 className="text-xl font-extrabold text-white/90">
          Plan updated successfully
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

            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span>
                {planType === "annual"
                  ? "Pro Annual Plan"
                  : "Pro Monthly Plan"}
              </span>
            </div>
          </div>
        </div>

        {/* 更新日 */}
        <div className="text-xs text-white/70 text-center mb-2">
          次回更新日：
          <span className="ml-1 font-semibold text-white/90">
            {proUntil || "—"}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/mobile/pro/analysis")}
          className="
            w-full rounded-2xl py-3 font-bold text-white
            transition
            hover:brightness-110
            active:scale-95 active:brightness-90
          "
          style={{
            background: "linear-gradient(90deg, #22C55E, #16A34A)",
          }}
        >
          Proデータを見る
        </button>
      </div>

      {/* ===== フッターリンク ===== */}
      <div className="mt-6 text-xs text-white/60">
        <span>プランに関する質問はサポートにお問い合わせください。</span>
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
