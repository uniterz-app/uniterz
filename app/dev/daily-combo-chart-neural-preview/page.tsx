"use client";

/**
 * /dev/daily-combo-chart-neural-preview
 * Daily Combo Chart — Neural / HUD デザイン案（本番未接続）
 */

import { useState } from "react";
import DailyComboChartNeuralPreview from "@/app/component/profile/ui/DailyComboChartNeuralPreview";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";

const MOCK_FOR_COMPARE = [
  { date: "2026-06-01", posts: 3, wins: 2, pointsV3: 18.4, scorePrecision: 6.2, upsetPoints: 2.1 },
  { date: "2026-06-02", posts: 5, wins: 4, pointsV3: 24.0, scorePrecision: 8.5, upsetPoints: 0 },
  { date: "2026-06-03", posts: 2, wins: 1, pointsV3: 9.5, scorePrecision: 3.0, upsetPoints: 1.0 },
  { date: "2026-06-04", posts: 6, wins: 5, pointsV3: 31.2, scorePrecision: 11.4, upsetPoints: 4.5 },
  { date: "2026-06-05", posts: 4, wins: 3, pointsV3: 16.8, scorePrecision: 5.6, upsetPoints: 0.8 },
  { date: "2026-06-06", posts: 7, wins: 6, pointsV3: 38.5, scorePrecision: 14.2, upsetPoints: 3.2 },
  { date: "2026-06-07", posts: 3, wins: 2, pointsV3: 12.0, scorePrecision: 4.1, upsetPoints: 0 },
  { date: "2026-06-08", posts: 5, wins: 4, pointsV3: 22.6, scorePrecision: 7.8, upsetPoints: 2.4 },
  { date: "2026-06-09", posts: 8, wins: 7, pointsV3: 42.0, scorePrecision: 15.5, upsetPoints: 5.0 },
  { date: "2026-06-10", posts: 4, wins: 3, pointsV3: 19.3, scorePrecision: 6.9, upsetPoints: 1.2 },
];

export default function DailyComboChartNeuralPreviewPage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");

  return (
    <main
      className="min-h-svh px-4 py-8 text-white md:px-8"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(34,211,238,0.07) 0%, transparent 55%), #030508",
      }}
    >
      <div className="mx-auto max-w-[720px] space-y-8">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400/65",
            ].join(" ")}
          >
            Dev Preview · Daily Combo Chart
          </p>
          <h1
            className={[
              nameRajdhani.className,
              "text-2xl font-bold tracking-wide text-white sm:text-[1.65rem]",
            ].join(" ")}
          >
            Neural / HUD デザイン案
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/50">
            参考画像寄せ：セグメント棒（シアン→紫→白）／ネオングリーン累積線／4列モノスペース
            スタッツ帯。本番 ProfileDailyTrendChart に統合済み。
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "ja" as const, label: "日本語" },
              { id: "en" as const, label: "English" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLanguage(opt.id)}
              className={[
                "rounded border px-3 py-1 text-xs font-bold transition-colors",
                language === opt.id
                  ? "border-cyan-400/45 bg-cyan-400/10 text-cyan-200"
                  : "border-white/12 bg-white/[0.03] text-white/50 hover:text-white/75",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <section className="space-y-3">
          <h2
            className={[
              nameRajdhani.className,
              "text-sm font-semibold tracking-wide text-white/85",
            ].join(" ")}
          >
            案 — Neural Load
          </h2>
          <ProfileKinetikPanelFrame className="overflow-x-clip p-3 sm:p-4">
            <DailyComboChartNeuralPreview
              data={MOCK_FOR_COMPARE}
              language={language}
            />
          </ProfileKinetikPanelFrame>
          <p className="text-[11px] text-white/38">
            棒をタップ／クリックで日付選択 → 下のスタッツ帯が切り替わります。
          </p>
        </section>

        <footer className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/35">
          <p>
            本番は{" "}
            <code className="text-cyan-300/65">ProfileDailyTrendChart</code>{" "}
            経由で同一コンポーネントを表示しています。
          </p>
        </footer>
      </div>
    </main>
  );
}
