"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import LoginRequiredModal from "@/app/component/modals/LoginRequiredModal";

type Plan = "monthly" | "annual";

export default function ProSubscribePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("monthly");
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  const PAYMENT_ENABLED = false; // 決済準備完了まで false

  return (
    <div className="min-h-screen bg-app px-4 py-10 flex justify-center">
      {/* 一枚のカード */}
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
        {/* Hero Header */}
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
            Get Pro
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 月額 */}
          <div
            onClick={() => setPlan("monthly")}
            className={`
              cursor-pointer rounded-2xl p-4 border transition
              ${
                plan === "monthly"
                  ? "border-white bg-white text-black"
                  : "border-white/20 bg-white/5 text-white"
              }
            `}
          >
            <div className="text-xs font-semibold opacity-60 mb-1">Pro Plan</div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">月額</div>
              {plan === "monthly" && (
                <div className="h-5 w-5 rounded-full bg-yellow-400 text-black text-xs grid place-items-center font-bold">
                  ✓
                </div>
              )}
            </div>
            <div className="text-2xl font-extrabold">¥600</div>
            <div className="mt-0.5 text-[10px] opacity-60">税込み</div>
          </div>

          {/* 年額 */}
          <div
            onClick={() => setPlan("annual")}
            className={`
              cursor-pointer rounded-2xl p-4 border transition
              ${
                plan === "annual"
                  ? "border-white bg-white text-black"
                  : "border-white/20 bg-white/5 text-white"
              }
            `}
          >
            <div className="text-xs font-semibold opacity-60 mb-1">Pro Plan</div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">年額</div>
              {plan === "annual" && (
                <div className="h-5 w-5 rounded-full bg-yellow-400 text-black text-xs grid place-items-center font-bold">
                  ✓
                </div>
              )}
            </div>
            <div className="text-2xl font-extrabold">¥4800</div>
            <div className="mt-0.5 text-[10px] opacity-60">税込み</div>
            <div className="mt-2 inline-block rounded-full bg-yellow-400 text-black text-xs px-3 py-1 font-bold">
              4ヶ月お得
            </div>
          </div>
        </div>

        <p className="mt-3 mb-4 text-center text-[11px] text-white/60">
          ※ 年額プランは途中解約しても返金はありません（期間終了まで利用可）
        </p>

        {/* CTA */}
        <button
          disabled={!PAYMENT_ENABLED}
          onClick={async () => {
            if (!PAYMENT_ENABLED) return;

            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
              setShowLoginRequired(true);
              return;
            }

            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan,
                uid: user.uid,
              }),
            });

            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            }
          }}
          className={`
            w-full rounded-xl py-3 font-bold mb-6 transition
            ${
              !PAYMENT_ENABLED
                ? "bg-white/10 text-white/80 opacity-80 cursor-not-allowed"
                : "hover:brightness-110 active:scale-95"
            }
          `}
        >
          {PAYMENT_ENABLED ? "Pro Planにアップグレード" : "現在準備中"}
        </button>

        <p className="text-center text-[11px] text-white/50 mb-4">
          ※ 現在決済機能準備中のため、まもなく利用可能になります
        </p>

        {/* Disclaimer */}
        <div className="mb-4 text-center text-[10px] text-white/40">
          ※ 機能は順次追加・改善されます 月間データ：月初に集計・更新
        </div>

        {/* Feature List */}
        <ul className="space-y-3 text-sm">
          {[
            "データを基にしたレーダーチャート",
            "あなたの分析タイプ",
            "指標別パーセンタイル",
            "今月の傾向サマリー",
            "月間パフォーマンス比較（平均・上位ユーザー）",
            "Upsetデータ分析",
            "連勝・連敗記録",
            "Home / Away 分析",
            "Market傾向分析",
            "チーム別パフォーマンス",
            "月別パフォーマンス",
          ].map(text => (
            <li key={text} className="flex items-start gap-2 text-white/85">
              <span
                style={{
                  background: "linear-gradient(90deg, #3B82F6, #22D3EE)",
                  color: "#000",
                }}
                className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold"
              >
                ✓
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Notice */}
        <div className="mb-4 text-xs text-white/60 space-y-2 text-center mt-6">
          <p>
            ※ プランは自動更新されます。解約はいつでも可能ですが、次回更新まで利用可能です。
          </p>
          <p>
            安全な外部決済サービスを利用しています。
          </p>
          <p>
            ※ 年額プランは途中で解約しても
            <span className="text-white/80 font-semibold">返金はありません</span>。
            解約後も契約期間終了日までは Pro機能をご利用いただけます。
          </p>
        </div>

        <LoginRequiredModal
          open={showLoginRequired}
          onClose={() => setShowLoginRequired(false)}
          variant="mobile" // web版なら "web"
        />
      </div>
    </div>
  );
}
