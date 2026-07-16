"use client";

/**
 * /dev/rank-gap-preview
 * Rank Intel UI プレビュー（GAP / RIVAL タブ・API 未接続）
 */

import { useMemo, useState } from "react";
import RankGapView from "@/app/component/rankings/gap/RankGapView";
import RankIntelTabBar from "@/app/component/rankings/gap/RankIntelTabBar";
import RankShadowView from "@/app/component/rankings/gap/RankShadowView";
import {
  computeRankGapAnalysis,
  type RankGapAnalysis,
} from "@/lib/rankings/rankGapAnalysis";
import type { RankGapStatsSlice } from "@/lib/rankings/readRankGapBonusSlice";
import type { RankShadowAnchorMetrics } from "@/lib/rankings/readRankShadowAnchorMetrics";
import { resolveShadowBandRange } from "@/lib/rankings/rankShadowBand";
import {
  computeRankShadowAnalysis,
  type RankShadowAnalysis,
} from "@/lib/rankings/rankShadowAnalysis";
import {
  buildMockMyRankProgressPoints,
  buildMockShadowRivalProgressPoints,
} from "@/lib/rankings/myRankRankingProgress";
import { MOCK_SHADOW_RIVAL_NAMES } from "@/lib/rankings/rankShadowRivalRoster";
import { resolveNextRankTierMilestone } from "@/lib/rankings/rankTierMilestone";
import type { RankIntelTab } from "@/lib/navigation/rankIntelTab";
import { t } from "@/lib/i18n/t";
import { jp, nameOxanium } from "@/lib/fonts";

const PRESETS: Array<{
  id: string;
  label: string;
  rank: number;
  priorRank: number;
  self: RankGapStatsSlice;
  cohort: RankGapStatsSlice;
}> = [
  {
    id: "48-top20",
    label: "48位 → TOP20（計画書例）",
    rank: 48,
    priorRank: 50,
    self: {
      pointsSumV3: 1284,
      basePointsSum: 1020,
      upsetBonusSum: 88,
      streakBonusSum: 42,
      goalScorerBonusSum: 134,
      exactHitCount: 2,
      winRate: 0.68,
      posts: 24,
    },
    cohort: {
      pointsSumV3: 1320,
      basePointsSum: 1032,
      upsetBonusSum: 96,
      streakBonusSum: 57,
      goalScorerBonusSum: 156,
      exactHitCount: 4.1,
      winRate: 0.67,
      posts: 28,
    },
  },
  {
    id: "80-top50",
    label: "80位 → TOP50",
    rank: 80,
    priorRank: 78,
    self: {
      pointsSumV3: 980,
      basePointsSum: 820,
      upsetBonusSum: 62,
      streakBonusSum: 28,
      goalScorerBonusSum: 70,
      exactHitCount: 1.5,
      winRate: 0.61,
      posts: 18,
    },
    cohort: {
      pointsSumV3: 1040,
      basePointsSum: 860,
      upsetBonusSum: 78,
      streakBonusSum: 48,
      goalScorerBonusSum: 54,
      exactHitCount: 2.8,
      winRate: 0.63,
      posts: 22,
    },
  },
  {
    id: "14-top10",
    label: "14位 → TOP10（圏内ギリギリ）",
    rank: 14,
    priorRank: 12,
    self: {
      pointsSumV3: 1450,
      basePointsSum: 1180,
      upsetBonusSum: 110,
      streakBonusSum: 95,
      goalScorerBonusSum: 65,
      exactHitCount: 5,
      winRate: 0.72,
      posts: 30,
    },
    cohort: {
      pointsSumV3: 1520,
      basePointsSum: 1210,
      upsetBonusSum: 118,
      streakBonusSum: 102,
      goalScorerBonusSum: 90,
      exactHitCount: 5.5,
      winRate: 0.74,
      posts: 32,
    },
  },
];

function mockAnchorFromSlice(slice: RankGapStatsSlice): RankShadowAnchorMetrics {
  const f = 0.88;
  return {
    totalPoints: Math.round(slice.pointsSumV3 * f),
    exactHitCount: Math.max(0, slice.exactHitCount * f),
    upsetBonusSum: Math.round(slice.upsetBonusSum * f),
    streakBonusSum: Math.round(slice.streakBonusSum * f),
    goalScorerBonusSum: Math.round(slice.goalScorerBonusSum * f),
  };
}

function buildMockCohortSlices(
  avg: RankGapStatsSlice,
  size: number
): RankGapStatsSlice[] {
  return Array.from({ length: size }, (_, i) => {
    const t = size <= 1 ? 1 : i / (size - 1);
    const factor = 0.82 + t * 0.36;
    return {
      pointsSumV3: Math.round(avg.pointsSumV3 * factor),
      basePointsSum: Math.round(avg.basePointsSum * factor),
      upsetBonusSum: Math.round(avg.upsetBonusSum * (0.7 + t * 0.6)),
      streakBonusSum: Math.round(avg.streakBonusSum * (0.65 + t * 0.7)),
      goalScorerBonusSum: Math.round(
        avg.goalScorerBonusSum * (0.75 + t * 0.5)
      ),
      exactHitCount: avg.exactHitCount * (0.8 + t * 0.4),
      winRate: avg.winRate * (0.95 + t * 0.1),
      posts: Math.round(avg.posts),
    };
  });
}

function buildMockGapAnalysis(
  preset: (typeof PRESETS)[number],
  language: "ja" | "en"
): RankGapAnalysis {
  const targetTier = resolveNextRankTierMilestone(preset.rank) ?? 20;
  const cohortSize = targetTier;
  const cohortSlices = buildMockCohortSlices(preset.cohort, cohortSize);
  const result = computeRankGapAnalysis({
    currentRank: preset.rank,
    self: preset.self,
    cohortSlices,
    rankingLeague: "worldcup",
    cutoffRows: [{ rank: targetTier, totalPoints: preset.cohort.pointsSumV3 }],
    language,
  });
  if (!result.ok) {
    throw new Error(
      `mock gap analysis failed: ${(result as { reason: string }).reason}`
    );
  }
  return result;
}

function buildMockShadowAnalysis(
  preset: (typeof PRESETS)[number],
  language: "ja" | "en"
): RankShadowAnalysis {
  const priorBand = resolveShadowBandRange(preset.priorRank);
  const bandWidth = priorBand.high - priorBand.low + 1;
  const cohortSlices = buildMockCohortSlices(preset.cohort, bandWidth);
  const cohortMembers = cohortSlices.map((slice, i) => {
    const priorRank = priorBand.low + i;
    const rankShift =
      priorRank === preset.priorRank
        ? preset.rank - preset.priorRank
        : i % 5 === 0
          ? -12
          : i % 4 === 0
            ? 8
            : i % 3 === 0
              ? 3
              : 0;
    return {
      uid: priorRank === preset.priorRank ? "mock-self" : `mock-${i}`,
      priorRank,
      weekStartRank: Math.max(1, priorRank + (priorRank === preset.priorRank ? preset.rank - preset.priorRank : 0)),
      currentRank: Math.max(1, priorRank + rankShift),
      slice,
      anchorMetrics: mockAnchorFromSlice(slice),
      displayName:
        priorRank === preset.priorRank
          ? language === "ja"
            ? "あなた"
            : "YOU"
          : MOCK_SHADOW_RIVAL_NAMES[i % MOCK_SHADOW_RIVAL_NAMES.length]!,
      photoURL: null,
      progressPoints: buildMockShadowRivalProgressPoints(
        priorRank,
        Math.max(1, priorRank + rankShift),
        7
      ),
    };
  });

  const result = computeRankShadowAnalysis({
    currentRank: preset.rank,
    priorRank: preset.priorRank,
    priorBand,
    weekAnchorDateKey: "2026-07-01",
    selfSlice: preset.self,
    selfAnchorMetrics: mockAnchorFromSlice(preset.self),
    selfWeekStartRank: preset.priorRank,
    cohortMembers,
    rankProgressPoints: buildMockMyRankProgressPoints(preset.rank, 7),
    rankingLeague: "worldcup",
    language,
    selfUid: "mock-self",
  });

  if (!result.ok) {
    throw new Error(
      `mock shadow analysis failed: ${(result as { reason: string }).reason}`
    );
  }

  return result;
}

export default function RankGapPreviewPage() {
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [layout, setLayout] = useState<"mobile" | "web">("mobile");
  const [activeTab, setActiveTab] = useState<RankIntelTab>("gap");

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;
  const m = t(language);

  const gapAnalysis = useMemo(
    () => buildMockGapAnalysis(preset, language),
    [preset, language]
  );

  const shadowAnalysis = useMemo(
    () => buildMockShadowAnalysis(preset, language),
    [preset, language]
  );

  return (
    <div className="min-h-screen bg-app px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60",
            ].join(" ")}
          >
            Dev preview
          </p>
          <h1 className={`${jp.className} mt-1 text-xl font-bold text-white`}>
            Rank Intel プレビュー
          </h1>
          <p className="mt-1 text-xs text-white/45">
            GAP / RIVAL タブ切替。本番 API・ランキング導線は未接続です。
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                presetId === p.id
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/12 bg-white/5 text-white/60 hover:bg-white/8",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={`rounded-lg border px-3 py-1 text-xs ${language === "ja" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            日本語
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-lg border px-3 py-1 text-xs ${language === "en" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLayout("mobile")}
            className={`rounded-lg border px-3 py-1 text-xs ${layout === "mobile" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            mobile
          </button>
          <button
            type="button"
            onClick={() => setLayout("web")}
            className={`rounded-lg border px-3 py-1 text-xs ${layout === "web" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            web
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <RankIntelTabBar
            active={activeTab}
            gapLabel={m.rankings.rankIntel.tabGap}
            shadowLabel={m.rankings.rankIntel.tabShadow}
            onChange={setActiveTab}
          />

          {activeTab === "gap" ? (
            <RankGapView
              analysis={gapAnalysis}
              language={language}
              layout={layout}
            />
          ) : (
            <RankShadowView
              analysis={shadowAnalysis}
              language={language}
              layout={layout}
            />
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-white/35">
          プレビュー URL:{" "}
          <code className="text-cyan-300/70">/dev/rank-gap-preview</code>
          （ランキング画面への組み込みはまだしていません）
        </p>
      </div>
    </div>
  );
}
