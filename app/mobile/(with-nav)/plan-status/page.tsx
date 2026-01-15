// app/mobile/settings/plan-status/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

type PlanType = "monthly" | "annual" | null;

export default function PlanStatusPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [planType, setPlanType] = useState<PlanType>(null);
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [planStart, setPlanStart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();

      setPlan(data.plan === "pro" ? "pro" : "free");
      setPlanType(data.planType ?? null);

      setProUntil(
        data.proUntil
          ? data.proUntil.toDate().toLocaleDateString("ja-JP")
          : null
      );

      setPlanStart(
        data.planStartDate
          ? data.planStartDate.toDate().toLocaleDateString("ja-JP")
          : null
      );

      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-black/80 border border-white/10 px-6 py-8 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
        {/* ロゴ + 開始日（Proのみ） */}
        <div className="mb-4 flex items-center gap-3">
          <Image
            src="/logo/logo.png"
            alt="Uniterz"
            width={40}
            height={40}
            className="opacity-90"
          />
          {plan === "pro" && planStart && (
            <div className="text-xs text-white/50">
              Started on {planStart}
            </div>
          )}
        </div>

        {/* プラン名 */}
        <div className="text-2xl font-extrabold text-white">
          {plan === "free" ? (
            "Free Plan"
          ) : (
            <>
              Pro Plan
              {planType && (
                <span className="ml-2 text-lg text-white/40">
                  {planType === "annual" ? "Yearly" : "Monthly"}
                </span>
              )}
            </>
          )}
        </div>

        {/* 次回更新日 */}
        <div className="mt-2 text-sm text-white/70">
          次回更新日：{plan === "pro" && proUntil ? proUntil : "-----"}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-white/10" />

        {/* Actions */}
{plan === "free" ? (
  <button
    onClick={() => router.push("/mobile/pro/subscribe")}
    className="
      w-full rounded-xl py-3 font-bold text-white
      transition
      hover:brightness-110
      active:scale-95 active:brightness-90
    "
    style={{
      background: "linear-gradient(90deg, #22d3ee, #3b82f6)",
    }}
  >
    Pro にアップグレード
  </button>
) : (
  <div className="flex gap-3">
    <button
  onClick={() => router.push("/mobile//plan-change")}
  className="
    flex-1 rounded-xl py-3 font-bold text-white
    transition
    hover:brightness-110
    active:scale-95 active:brightness-90
  "
  style={{
    background: "linear-gradient(90deg, #F59E0B, #F97316)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
  }}
>
  プラン変更
</button>

    {/* 解約ボタン */}
<button
  onClick={() => router.push("/mobile//cancel-plan")}
  className="
    flex-1 rounded-xl py-3 font-bold text-red-400
    border border-red-400/40
    transition
    hover:bg-red-400/10
    active:scale-95 active:bg-red-400/20
  "
>
  解約
</button>
  </div>
)}
      </div>
    </div>
  );
}
