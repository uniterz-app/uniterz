"use client";

/**
 * /dev/profile-edit-kinetik-web-layout
 * Kinetik プロフィール — Web 2カラム / Mobile 縦積み 配置プレビュー
 */

import { useState } from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { nameRajdhani } from "@/lib/fonts";
import {
  computeTopPercentile,
  resolveKinetikRankBadge,
} from "@/app/component/profile/edit/kinetikRankBadge";

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-hidden rounded-[22px] bg-[#060809] p-2">
        {children}
      </div>
    </div>
  );
}

export default function ProfileEditKinetikWebLayoutPreviewPage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [winStreak, setWinStreak] = useState(6);
  const [totalPointsRank, setTotalPointsRank] = useState(14);
  const [rankDenominator, setRankDenominator] = useState(1400);
  const [rankDeltaPlaces, setRankDeltaPlaces] = useState(2);

  const previewBadge = resolveKinetikRankBadge({
    totalPointsRank,
    totalPointsRankDenominator: rankDenominator,
    rankDeltaPlaces,
    language,
  });
  const previewTopPct = computeTopPercentile(totalPointsRank, rankDenominator);

  const panelProps = {
    language,
    editable: true,
    winStreak,
    totalPointsRank,
    totalPointsRankDenominator: rankDenominator,
    rankDeltaPlaces,
    bio: language === "ja"
      ? "WC予想の記録とランキングを追うプレイヤー。"
      : "Tracking WC picks and climbing the grid ranks.",
    metricsTitle: "WORLD CUP // GROUP STAGE STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2026-04-15T00:00:00+09:00").getTime(),
    isPro: true,
    shareHandle: "kinetik_void",
    canOpenMenu: true,
    onOpenMenu: () => undefined,
    metricValueDeltas: {
      totalPoints: 12,
      totalPrecision: 4.9,
      totalUpset: -1.2,
      winRate: 2,
    },
  };

  return (
    <main className="min-h-screen bg-[#03080d] px-4 py-8 text-white md:px-8">
      <header className="mx-auto mb-8 max-w-[1100px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Preview
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Kinetik Profile — Web 2-column layout
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Web は左: アバター / ID / 名前 / タグ / 勝率バー、右: メトリクス / バッジ /
          Stats。Mobile は従来の縦積み。デザイントークンは現行のまま。
        </p>
        <p className="mt-2 text-sm">
          <a
            href="/dev/profile-edit-tron-preview"
            className="text-[#ccff00]/90 underline-offset-2 hover:underline"
          >
            ← 従来プレビュー（Tron / Kinetik 切替）
          </a>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { key: "ja" as const, label: "日本語" },
              { key: "en" as const, label: "EN" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLanguage(item.key)}
              className={[
                "border px-3 py-1.5 text-xs font-medium transition",
                language === item.key
                  ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                  : "border-white/15 text-white/60 hover:border-white/25",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/50">
            連勝: {winStreak}
            <input
              type="range"
              min={0}
              max={12}
              value={winStreak}
              onChange={(e) => setWinStreak(Number(e.target.value))}
              className="accent-[#ccff00]"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/50">
            順位: {totalPointsRank} / {rankDenominator}（上位 {previewTopPct.toFixed(1)}%）
            <input
              type="range"
              min={1}
              max={Math.max(100, rankDenominator)}
              value={totalPointsRank}
              onChange={(e) => setTotalPointsRank(Number(e.target.value))}
              className="accent-[#22d3ee]"
            />
          </label>
        </div>

        {previewBadge ? (
          <p className="mt-3 text-xs text-white/45">
            Tier tag: {previewBadge.label} — {previewBadge.description}
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1100px] gap-10 xl:grid-cols-[1fr_390px] xl:items-start">
        <section>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] font-bold tracking-[0.22em] text-cyan-300/70 uppercase",
              ].join(" ")}
            >
              Web
            </span>
            <span className="h-px flex-1 bg-cyan-400/15" />
            <span className="text-[11px] text-white/40">左 34% / 右 66%</span>
          </div>
          <ProfileEditKinetikPanel layout="web" {...panelProps} />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] font-bold tracking-[0.22em] text-cyan-300/70 uppercase",
              ].join(" ")}
            >
              Mobile
            </span>
            <span className="h-px flex-1 bg-cyan-400/15" />
            <span className="text-[11px] text-white/40">従来レイアウト</span>
          </div>
          <MobileFrame>
            <ProfileEditKinetikPanel layout="mobile" {...panelProps} />
          </MobileFrame>
        </section>
      </div>
    </main>
  );
}
