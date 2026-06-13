"use client";

/**
 * /dev/profile-edit-tron-preview
 * プロフィール編集 UI — Tron 塔 / Kinetik カードの Web・Mobile プレビュー
 */

import { useState, type ReactNode } from "react";
import ProfileEditTronPanel from "@/app/component/profile/edit/ProfileEditTronPanel";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { nameRajdhani } from "@/lib/fonts";
import {
  computeTopPercentile,
  getKinetikRankBadgeTierFromTopPercent,
  resolveKinetikRankBadge,
} from "@/app/component/profile/edit/kinetikRankBadge";

type Variant = "tron" | "kinetik";

function PreviewSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span
          className={[
            nameRajdhani.className,
            "text-[10px] font-bold tracking-[0.22em] text-cyan-300/70 uppercase",
          ].join(" ")}
        >
          {title}
        </span>
        <span className="h-px flex-1 bg-cyan-400/15" />
        <span className="text-[11px] text-white/40">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-hidden rounded-[22px]">{children}</div>
    </div>
  );
}

export default function ProfileEditTronPreviewPage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [variant, setVariant] = useState<Variant>("tron");
  const [winStreak, setWinStreak] = useState(5);
  const [totalPointsRank, setTotalPointsRank] = useState(14);
  const [rankDenominator, setRankDenominator] = useState(1400);
  const [rankDeltaPlaces, setRankDeltaPlaces] = useState(0);

  const previewBadge = resolveKinetikRankBadge({
    totalPointsRank,
    totalPointsRankDenominator: rankDenominator,
    rankDeltaPlaces,
    language,
  });
  const previewTopPct = computeTopPercentile(totalPointsRank, rankDenominator);
  const previewPercentileTier = getKinetikRankBadgeTierFromTopPercent(previewTopPct);

  return (
    <main className="min-h-screen bg-[#03080d] px-4 py-8 text-white md:px-8">
      <header className="mx-auto mb-8 max-w-[1200px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Preview
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Profile Edit — Layout Variants
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Tron 塔レイアウトと Kinetik カードの 2 案。いずれも Web / Mobile を並べて確認できます。
        </p>
        <p className="mt-2 text-sm">
          <a
            href="/dev/profile-edit-kinetik-streak-preview"
            className="text-[#ccff00]/90 underline-offset-2 hover:underline"
          >
            連勝演出プレビュー（4案比較）→
          </a>
          {" · "}
          <a
            href="/dev/profile-edit-kinetik-web-layout"
            className="text-cyan-300/90 underline-offset-2 hover:underline"
          >
            Web 2カラム配置プレビュー →
          </a>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVariant("tron")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              variant === "tron"
                ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/60 hover:border-white/25",
            ].join(" ")}
          >
            Tron Tower
          </button>
          <button
            type="button"
            onClick={() => setVariant("kinetik")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              variant === "kinetik"
                ? "border-[#a8ff2a]/50 bg-[#a8ff2a]/10 text-[#d4ff7a]"
                : "border-white/15 text-white/60 hover:border-white/25",
            ].join(" ")}
          >
            Kinetik Card
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "ja"
                ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/60 hover:border-white/25",
            ].join(" ")}
          >
            日本語ラベル
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "en"
                ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/60 hover:border-white/25",
            ].join(" ")}
          >
            EN labels
          </button>
        </div>

        {variant === "kinetik" ? (
          <div className="mt-4 flex max-w-xl flex-col gap-4">
            <div className="flex max-w-md flex-col gap-2">
              <label
                className={[
                  nameRajdhani.className,
                  "text-[10px] tracking-[0.14em] text-white/45 uppercase",
                ].join(" ")}
              >
                連勝数（B案）: {winStreak} — 色:{" "}
                {winStreak <= 0
                  ? "なし"
                  : winStreak <= 4
                    ? "緑"
                    : winStreak <= 6
                      ? "シアン"
                      : "赤"}
              </label>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={winStreak}
                onChange={(e) => setWinStreak(Number(e.target.value))}
                className="w-full accent-[#ccff00]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span
                  className={[
                    nameRajdhani.className,
                    "text-[10px] tracking-[0.14em] text-white/45 uppercase",
                  ].join(" ")}
                >
                  総合得点順位: {totalPointsRank}位 / {rankDenominator}人（上位{" "}
                  {previewTopPct.toFixed(1)}%）
                </span>
                <input
                  type="range"
                  min={1}
                  max={Math.max(100, rankDenominator)}
                  step={1}
                  value={totalPointsRank}
                  onChange={(e) => setTotalPointsRank(Number(e.target.value))}
                  className="w-full accent-[#22d3ee]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span
                  className={[
                    nameRajdhani.className,
                    "text-[10px] tracking-[0.14em] text-white/45 uppercase",
                  ].join(" ")}
                >
                  順位母数: {rankDenominator}
                </span>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={rankDenominator}
                  onChange={(e) => setRankDenominator(Number(e.target.value))}
                  className="w-full accent-[#22d3ee]"
                />
              </label>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span
                  className={[
                    nameRajdhani.className,
                    "text-[10px] tracking-[0.14em] text-white/45 uppercase",
                  ].join(" ")}
                >
                  順位変動（+で上昇）: {rankDeltaPlaces > 0 ? "+" : ""}
                  {rankDeltaPlaces} — Rising:{" "}
                  {rankDeltaPlaces >= 5 ? "ON" : "OFF"}
                  {previewPercentileTier
                    ? ` / パーセンタイル: ${previewPercentileTier.toUpperCase()}`
                    : ""}
                </span>
                <input
                  type="range"
                  min={-10}
                  max={30}
                  step={1}
                  value={rankDeltaPlaces}
                  onChange={(e) => setRankDeltaPlaces(Number(e.target.value))}
                  className="w-full accent-[#fb923c]"
                />
              </label>
            </div>
            <p className="text-[11px] text-white/45">
              表示バッジ:{" "}
              <span className="text-white/75">
                {previewBadge?.label ?? "なし"}
              </span>
              {previewBadge ? ` — ${previewBadge.description}` : null}
            </p>
          </div>
        ) : null}
      </header>

      {variant === "tron" ? (
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <PreviewSection title="Web" subtitle="grid-cols-[240px_1fr]">
            <ProfileEditTronPanel layout="web" language={language} editable />
          </PreviewSection>
          <PreviewSection title="Mobile" subtitle="縦積み">
            <MobileFrame>
              <ProfileEditTronPanel layout="mobile" language={language} editable />
            </MobileFrame>
          </PreviewSection>
        </div>
      ) : (
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <PreviewSection title="Web" subtitle="左: ID / 右: metrics">
            <ProfileEditKinetikPanel
              layout="web"
              language={language}
              editable
              winStreak={winStreak}
              totalPointsRank={totalPointsRank}
              totalPointsRankDenominator={rankDenominator}
              rankDeltaPlaces={rankDeltaPlaces}
            />
          </PreviewSection>
          <PreviewSection title="Mobile" subtitle="2-col metrics">
            <MobileFrame>
              <div className="bg-[#060809] p-2">
                <ProfileEditKinetikPanel
                  layout="mobile"
                  language={language}
                  editable
                  winStreak={winStreak}
                  totalPointsRank={totalPointsRank}
                  totalPointsRankDenominator={rankDenominator}
                  rankDeltaPlaces={rankDeltaPlaces}
                />
              </div>
            </MobileFrame>
          </PreviewSection>
        </div>
      )}
    </main>
  );
}
