// app/mobile/settings/plan-change/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Plan = "monthly" | "annual";

export default function PlanChangePage() {
  const [currentPlan, setCurrentPlan] = useState<Plan>("monthly");
  const [userPlan, setUserPlan] = useState<"pro" | "free">("free");
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
      setUserPlan(data.plan === "pro" ? "pro" : "free");
      setCurrentPlan(data.planType === "annual" ? "annual" : "monthly");
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  return (
    <div className="min-h-screen bg-app px-4 py-10 flex justify-center">
      <div
        className="
          w-full max-w-3xl
          rounded-3xl
          bg-black
          border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          px-6 py-8
        "
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/logo/logo.png"
                alt="Uniterz"
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            プラン変更
          </h1>
        </div>

        {/* 現在のプラン */}
        <div className="text-center text-white mb-6">
          <div className="text-lg font-semibold mb-2">現在のプラン</div>
          <div
            className={`text-2xl font-extrabold ${
              currentPlan === "monthly" ? "text-blue-300" : "text-green-400"
            }`}
          >
            {currentPlan === "monthly" ? "月額プラン" : "年額プラン"}
          </div>
        </div>

        {/* 変更後プラン（表示のみ・選択不可） */}
        <div className="mb-6">
          {currentPlan === "monthly" ? (
            // 年額表示
            <div className="rounded-2xl p-4 border border-white/20 bg-white/5 text-white opacity-80">
              <div className="text-xs font-semibold opacity-60 mb-1">
                Pro Plan
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">年額プラン</div>
              </div>
              <div className="text-2xl font-extrabold">¥4,800</div>
              <div className="mt-0.5 text-[10px] opacity-60">
                税込み（4ヶ月お得）
              </div>
            </div>
          ) : (
            // 月額表示
            <div className="rounded-2xl p-4 border border-white/20 bg-white/5 text-white opacity-80">
              <div className="text-xs font-semibold opacity-60 mb-1">
                Pro Plan
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">月額プラン</div>
              </div>
              <div className="text-2xl font-extrabold">¥600</div>
              <div className="mt-0.5 text-[10px] opacity-60">税込み</div>
            </div>
          )}
          <p className="mt-2 text-xs text-white/60 text-center">
            実際の変更内容・請求日は次の画面で確認できます
          </p>
        </div>

        {/* CTA（そのまま） */}
        <button
  onClick={async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        returnUrl: "/mobile/plan-change"
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }}
  style={{
    background: "linear-gradient(90deg, #F59E0B, #F97316)",
    color: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
  }}
  className="
    w-full rounded-xl py-3 font-bold mb-6
    transition
    hover:brightness-110
    active:scale-95 active:brightness-90
  "
>
  {currentPlan === "monthly"
    ? "年額プランへ変更"
    : "月額プランへ変更"}
</button>

        <div className="text-xs text-white/60 space-y-1 text-center">
  <p>※ プランは自動更新されます。</p>
  <p>
    ※ 年額 → 月額などのダウングレードは、
    <span className="text-white/80 font-semibold">
      現在の契約期間終了後
    </span>
    に適用されます。
  </p>
  <p>※ 変更までの期間は現在のプランの機能をご利用いただけます。</p>
  <p>※ ダウングレード時の返金はありません。</p>
</div>
      </div>
    </div>
  );
}
