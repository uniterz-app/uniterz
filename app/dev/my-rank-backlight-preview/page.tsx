"use client";

/**
 * /dev/my-rank-backlight-preview
 * MyRankCard 背面発光（後光）4案 — 本番は案C（reference）を採用
 */

import { useState } from "react";
import MyRankCard, {
  type MyRankMiniMetric,
} from "@/app/component/rankings/MyRankCard";
import {
  MyRankCardBacklight,
  MY_RANK_CARD_RIM_FILTER,
} from "@/app/component/rankings/MyRankCardBacklight";
import { jp } from "@/lib/fonts";

type BacklightVariant = "none" | "subtle" | "beam" | "reference";

const MOCK_METRICS: MyRankMiniMetric[] = [
  { key: "totalPoints", label: "PTS", value: "1,284", pct: 82, dayDelta: "+12.4" },
  { key: "winRate", label: "WIN%", value: "68", pct: 68, dayDelta: "+2.1" },
  { key: "totalPrecision", label: "PREC", value: "312.0", pct: 74, dayDelta: "+4.9" },
  { key: "totalUpset", label: "UPSET", value: "96.5", pct: 61, dayDelta: "-1.2" },
];

const VARIANTS: Array<{
  key: BacklightVariant;
  title: string;
  subtitle: string;
}> = [
  {
    key: "none",
    title: "現状",
    subtitle: "後光なし（ベースライン）",
  },
  {
    key: "subtle",
    title: "案A — 控えめ後光",
    subtitle: "中央 radial · 一覧でも邪魔しない",
  },
  {
    key: "beam",
    title: "案B — 水平ビーム",
    subtitle: "レンズフレア帯 · 後ろから差す光",
  },
  {
    key: "reference",
    title: "案C — 参考寄せ",
    subtitle: "ビーム + 大気 + マゼンタリム",
  },
];

function BacklightLayers({ variant }: { variant: BacklightVariant }) {
  if (variant === "none") return null;

  if (variant === "subtle") {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 58% at 50% 46%, rgba(34,211,238,0.14) 0%, transparent 68%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[44%] z-0 h-24 w-[115%] -translate-x-1/2 -translate-y-1/2 blur-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.12) 45%, rgba(34,211,238,0.18) 50%, rgba(34,211,238,0.12) 55%, transparent 100%)",
          }}
        />
      </>
    );
  }

  if (variant === "beam") {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 48%, rgba(34,211,238,0.08) 0%, transparent 62%)",
          }}
        />
        {/* 水平ビーム本体 */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[46%] z-0 h-[88px] w-[155%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.08) 18%, rgba(34,211,238,0.42) 48%, rgba(140,240,255,0.55) 50%, rgba(34,211,238,0.42) 52%, rgba(34,211,238,0.08) 82%, transparent 100%)",
            filter: "blur(22px)",
          }}
        />
        {/* コアの細い光線 */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-[46%] z-0 h-px -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(186,230,253,0.55) 50%, transparent)",
            boxShadow: "0 0 18px rgba(34,211,238,0.55)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-[48%] z-0 h-[2px] -translate-y-1/2 blur-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 8%, rgba(255,255,255,0.18) 50%, transparent 92%)",
          }}
        />
        {/* ビーム中心のにじみ */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[46%] z-0 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(34,211,238,0.22)" }}
        />
      </>
    );
  }

  /* reference — 本番と同一（MyRankCardBacklight） */
  return (
    <div className="absolute inset-0">
      <MyRankCardBacklight />
    </div>
  );
}

function CardStage({
  variant,
  layout,
  selected,
  onSelect,
}: {
  variant: (typeof VARIANTS)[number];
  layout: "mobile" | "web";
  selected: boolean;
  onSelect: () => void;
}) {
  const rimStyle =
    variant.key === "reference"
      ? { filter: MY_RANK_CARD_RIM_FILTER }
      : variant.key === "beam"
        ? {
            filter: [
              "drop-shadow(0 0 16px rgba(34,211,238,0.28))",
              "drop-shadow(0 14px 26px rgba(0,0,0,0.42))",
            ].join(" "),
          }
        : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group w-full text-left transition-[border-color,box-shadow] duration-200",
        "rounded-none border",
        selected
          ? "border-cyan-400/45 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          : "border-white/10 hover:border-white/20",
      ].join(" ")}
    >
      <div className="border-b border-white/8 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-200/75">
          {variant.title}
        </p>
        <p className="mt-1 text-xs text-white/45">{variant.subtitle}</p>
      </div>

      <div
        className="relative overflow-hidden px-3 py-10 sm:px-5 sm:py-12"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 55%), #020408",
        }}
      >
        <BacklightLayers variant={variant.key} />

        <div className="relative z-10 mx-auto max-w-[420px]" style={rimStyle}>
          <MyRankCard
            rank={14}
            metric="totalScore"
            value={1284}
            displayName="RIKU_09"
            photoURL={null}
            totalPosts={41}
            loading={false}
            language="ja"
            isPro
            mobileWide={layout === "mobile"}
            rankDeltaPlaces={3}
            totalEntries={2840}
            streak={5}
            countryCode="JP"
            miniMetrics={MOCK_METRICS}
            barsReady
            leagueLabel="NBA"
            layout={layout}
          />
        </div>
      </div>
    </button>
  );
}

export default function MyRankBacklightPreviewPage() {
  const [selected, setSelected] = useState<BacklightVariant>("beam");
  const [layout, setLayout] = useState<"mobile" | "web">("mobile");

  const active = VARIANTS.find((v) => v.key === selected) ?? VARIANTS[2];

  return (
    <div
      className={`min-h-dvh bg-[#020408] text-white ${jp.className}`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.06), transparent 60%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">
            DEV PREVIEW
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-cyan-50 sm:text-2xl">
            MyRankCard — 背面発光（後光）比較
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            カードの「後ろ」に光レイヤーを置く案です。本番コードには未接続。
            案をタップして拡大表示、レイアウトは mobile / web を切り替えられます。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["mobile", "web"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayout(key)}
                className={[
                  "rounded-none border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]",
                  layout === key
                    ? "border-cyan-400/40 bg-cyan-500/12 text-cyan-100"
                    : "border-white/12 text-white/55",
                ].join(" ")}
              >
                {key}
              </button>
            ))}
          </div>
        </header>

        {/* 選択中を大きく */}
        <section className="mb-10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            選択中 — {active.title}
          </p>
          <div
            className="relative overflow-hidden rounded-none border border-white/12"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 55%), #010308",
            }}
          >
            <div className="relative px-4 py-14 sm:px-8 sm:py-16">
              <BacklightLayers variant={selected} />
              <div
                className="relative z-10 mx-auto"
                style={{
                  maxWidth: layout === "web" ? 520 : 420,
                  ...(selected === "reference"
                    ? { filter: MY_RANK_CARD_RIM_FILTER }
                    : selected === "beam"
                      ? {
                          filter: [
                            "drop-shadow(0 0 20px rgba(34,211,238,0.32))",
                            "drop-shadow(0 16px 32px rgba(0,0,0,0.45))",
                          ].join(" "),
                        }
                      : undefined),
                }}
              >
                <MyRankCard
                  rank={14}
                  metric="totalScore"
                  value={1284}
                  displayName="RIKU_09"
                  photoURL={null}
                  totalPosts={41}
                  loading={false}
                  language="ja"
                  isPro
                  mobileWide={layout === "mobile"}
                  rankDeltaPlaces={3}
                  totalEntries={2840}
                  streak={5}
                  countryCode="JP"
                  miniMetrics={MOCK_METRICS}
                  barsReady
                  leagueLabel="NBA"
                  layout={layout}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4案グリッド */}
        <section>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            全案比較（タップで選択）
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {VARIANTS.map((variant) => (
              <CardStage
                key={variant.key}
                variant={variant}
                layout={layout}
                selected={selected === variant.key}
                onSelect={() => setSelected(variant.key)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
