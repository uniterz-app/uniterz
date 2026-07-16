"use client";

/**
 * /dev/my-rank-free-pro-preview
 * My Rank カード — Free / Pro UI 比較（本番未接続）
 *
 * displayTier="free" | "pro" で MyRankCard の表示ゲートをプレビュー。
 */

import { useMemo, useState } from "react";
import MyRankCard, {
  type MyRankMiniMetric,
} from "@/app/component/rankings/MyRankCard";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { jp, nameOxanium } from "@/lib/fonts";

import {
  buildRankTierGapHint,
  mockCutoffTotalPointsAtRank,
  resolveNextRankTierMilestone,
} from "@/lib/rankings/rankTierMilestone";
import {
  buildMockMyRankProgressPoints,
  buildVolatileMockMyRankProgressPoints,
} from "@/lib/rankings/myRankRankingProgress";

const METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
];

const MOCK_MINI: MyRankMiniMetric[] = [
  {
    key: "totalScore",
    label: "totalPTS",
    value: "1,284",
    pct: 82,
    dayDelta: "+12",
  },
  {
    key: "winRate",
    label: "WIN%",
    value: "68",
    pct: 68,
    dayDelta: "+2",
  },
  {
    key: "marginPrecision",
    label: "PREC",
    value: "312.0",
    pct: 74,
    dayDelta: "+4.9",
  },
  {
    key: "upsetScore",
    label: "UPSET",
    value: "96.5",
    pct: 61,
    dayDelta: "-1.2",
  },
];

const FREE_FEATURES = [
  "順位 · 母数",
  "指標値 · 指標前日比",
  "VOL · AVG",
  "選択指標のセグメントバー（1本）",
  "Ranking Progress（直近3件）",
];

const PRO_FEATURES = [
  "Free のすべて",
  "TOP ◯%（常時 · 左タワー順位の上）",
  "次順位帯までの pt 差（アバター下 · TOP20圏内まで＋pt）",
  "Pro 枠スキン · PRO バッジ",
  "Ranking Progress（直近10件）",
];

const RANK_PRESETS = [
  { rank: 120, label: "120位 → 100位" },
  { rank: 80, label: "80位 → 50位" },
  { rank: 48, label: "48位 → 20位" },
  { rank: 14, label: "14位 → 10位" },
  { rank: 8, label: "8位 · TOP10圏内" },
] as const;

const MOCK_MY_TOTAL_POINTS = 1284;

const PROGRESS_PRESETS = [
  { id: "mild", label: "穏やか" },
  { id: "volatile", label: "大きく動く" },
] as const;

type ProgressPresetId = (typeof PROGRESS_PRESETS)[number]["id"];

export default function MyRankFreeProPreviewPage() {
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [layout, setLayout] = useState<"mobile" | "web">("mobile");
  const [rank, setRank] = useState(48);
  const [progressPreset, setProgressPreset] =
    useState<ProgressPresetId>("volatile");

  const rankTierGap = useMemo(() => {
    const target = resolveNextRankTierMilestone(rank);
    const cutoffRows =
      target != null
        ? [{ rank: target, totalPoints: mockCutoffTotalPointsAtRank(target) }]
        : undefined;
    return buildRankTierGapHint({
      currentRank: rank,
      myTotalPoints: MOCK_MY_TOTAL_POINTS,
      cutoffRows,
    });
  }, [rank]);

  const rankProgress = useMemo(() => {
    const build =
      progressPreset === "volatile"
        ? buildVolatileMockMyRankProgressPoints
        : buildMockMyRankProgressPoints;
    return build(rank, 10);
  }, [rank, progressPreset]);

  const rankProgressSummary = useMemo(() => {
    if (rankProgress.length === 0) return null;
    const ranks = rankProgress.map((p) => p.rank);
    const min = Math.min(...ranks);
    const max = Math.max(...ranks);
    return { min, max, span: max - min };
  }, [rankProgress]);

  const nextMilestoneLabel = useMemo(() => {
    const target = resolveNextRankTierMilestone(rank);
    if (target == null) return "TOP10 圏内";
    return `${rank}位 → 次の目標 ${target}位`;
  }, [rank]);

  const selectedMini = useMemo(
    () => MOCK_MINI.find((m) => m.key === metric) ?? MOCK_MINI[0]!,
    [metric]
  );

  const metricValue =
    metric === "winRate"
      ? 68
      : metric === "totalScore"
        ? 1284
        : metric === "marginPrecision"
          ? 312
          : 96.5;

  const sharedProps = {
    rank,
    metric,
    value: metricValue,
    displayName: "Rikuto",
    photoURL: null as string | null,
    totalPosts: 41,
    loading: false,
    statsScramble: false,
    animateRank: false,
    language: "ja" as const,
    rankDeltaPlaces: 3,
    totalEntries: 1530,
    streak: null,
    countryCode: "JP",
    miniMetrics: MOCK_MINI,
    barsReady: true,
    cardResetKey: metric,
    leagueLabel: "NBA",
    statsSource: {
      totalPosts: 41,
      totalPoints: 1284,
      totalPrecision: 312,
      totalUpset: 96.5,
    },
    mobileWide: layout === "mobile",
    layout,
    disableMotion: true,
  };

  return (
    <div className="min-h-screen bg-[#060708] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <p
          className={[
            nameOxanium.className,
            "text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80",
          ].join(" ")}
        >
          Dev Preview
        </p>
        <h1 className={[jp.className, "mt-2 text-2xl font-black"].join(" ")}>
          My Rank — Free / Pro
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          本番未接続。{" "}
          <code className="text-cyan-300/90">displayTier</code> で Free / Pro
          の表示差を確認します。Ranking Progress はカード内フッター直上に表示。
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {RANK_PRESETS.map(({ rank: r, label }) => (
            <button
              key={r}
              type="button"
              onClick={() => setRank(r)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-bold tracking-wide",
                rank === r
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-2 text-[11px] text-white/40">{nextMilestoneLabel}</p>
        {rankProgressSummary ? (
          <p className="mt-1 text-[11px] text-white/35">
            Progress 変動幅: {rankProgressSummary.min}位〜
            {rankProgressSummary.max}位（幅 {rankProgressSummary.span}）
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {PROGRESS_PRESETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setProgressPreset(id)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-bold tracking-wide",
                progressPreset === id
                  ? "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-100"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              Progress: {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                metric === m
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              {m}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-white/10" aria-hidden />
          {(["mobile", "web"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayout(l)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                layout === l
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <TierHeader
              label="Free"
              sub="displayTier=&quot;free&quot;"
              features={FREE_FEATURES}
              muted
            />
            <MyRankCard
              {...sharedProps}
              displayTier="free"
              isPro={false}
              rankTierGap={rankTierGap}
              rankProgress={rankProgress}
            />
          </section>

          <section>
            <TierHeader
              label="Pro"
              sub="displayTier=&quot;pro&quot; · isPro"
              features={PRO_FEATURES}
            />
            <MyRankCard
              {...sharedProps}
              displayTier="pro"
              isPro
              rankTierGap={rankTierGap}
              rankProgress={rankProgress}
            />
          </section>
        </div>

        <p className="mt-8 text-center text-[11px] text-white/35">
          指標 HUD: {selectedMini.label} · dayDelta {selectedMini.dayDelta}
        </p>
      </div>
    </div>
  );
}

function TierHeader({
  label,
  sub,
  features,
  muted = false,
}: {
  label: string;
  sub: string;
  features: string[];
  muted?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <h2
          className={[
            nameOxanium.className,
            "text-lg font-bold uppercase tracking-[0.12em]",
            muted ? "text-white/70" : "text-amber-200/95",
          ].join(" ")}
        >
          {label}
        </h2>
        <span className="text-[10px] text-white/40">{sub}</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] text-white/45">
        {features.map((f) => (
          <li key={f}>· {f}</li>
        ))}
      </ul>
    </div>
  );
}
