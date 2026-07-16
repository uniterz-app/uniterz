"use client";

/**
 * /dev/profile-plan-pro-layout-showcase
 * PRO プロフィール全体 — Cyber メトリクスレイアウト比較（Mobile 正）
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameRajdhani } from "@/lib/fonts";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import {
  PROFILE_PLAN_PRO_CYBER_METRIC_LAYOUT_VARIANTS,
  PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS,
  type ProfilePlanProMetricLayoutVariant,
} from "@/lib/profile/profilePlanProMetricLayoutVariants";
import "./profilePlanProLayoutShowcase.css";
import "../profile-plan-pro-metrics-showcase/profilePlanProMetricsShowcase.css";

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="profile-plan-pro-layout-showcase-frame mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4">
        {children}
      </div>
    </div>
  );
}

const BASE_PANEL_STATIC = {
  layout: "mobile" as const,
  isPro: true,
  planProBgVariant: PROFILE_PLAN_PRO_BG_DEFAULT,
  identity: {
    ...PROFILE_EDIT_KINETIK_MOCK.identity,
    displayName: "MPJ",
    systemId: "3PJVG4Y9",
    handle: "mpj",
  },
  stats: {
    ...PROFILE_EDIT_KINETIK_MOCK.stats,
    winRate: 63.4,
    posts: 71,
    hits: 45,
    totalPoints: 350,
    scorePrecision: 8,
    upset: 9,
  },
  winStreak: 6,
  totalPointsRank: 12,
  totalPointsRankDenominator: 800,
  bio: "Win now",
  countryCode: "JP",
  memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
};

function buildBasePanel(
  language: "ja" | "en",
  rankingLeague: RankingLeagueSource,
  onToggleMetricsScope: () => void
) {
  return {
    ...BASE_PANEL_STATIC,
    language,
    rankingLeague,
    metricsTitle:
      rankingLeague === "worldcup"
        ? "WORLD CUP // STATS"
        : "NBA // PLAYOFFS STATS",
    onToggleMetricsScope,
    stackedMetricsSections:
      rankingLeague === "worldcup"
        ? [
            {
              wcStage: "main" as const,
              stats: {
                winRate: 63.4,
                posts: 71,
                hits: 45,
                scorePrecision: 8,
                totalPoints: 350,
                upset: 9,
              },
              winStreak: 6,
              totalPointsRank: 12,
              totalPointsRankDenominator: 800,
              rankDeltaPlaces: 0,
              metricValueDeltas: null,
            },
          ]
        : undefined,
  };
}

function LayoutCard({
  variantId,
  label,
  tag,
  description,
  cyber,
  language,
  highlighted,
  panelProps,
}: {
  variantId: ProfilePlanProMetricLayoutVariant;
  label: string;
  tag: string;
  description: string;
  cyber: boolean;
  language: "ja" | "en";
  highlighted: boolean;
  panelProps: ReturnType<typeof buildBasePanel>;
}) {
  return (
    <article
      id={`pro-layout-${variantId}`}
      className={[
        "profile-plan-pro-layout-showcase-card scroll-mt-28 rounded-xl transition",
        cyber ? "profile-plan-pro-layout-showcase-card--cyber" : "",
        highlighted ? "ring-1 ring-cyan-400/45" : "",
      ].join(" ")}
    >
      <header className="relative z-[1] mb-4 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={[
              nameRajdhani.className,
              "text-sm font-semibold tracking-[0.18em] uppercase",
              cyber ? "text-cyan-300/90" : "text-white/70",
            ].join(" ")}
          >
            {label}
          </h2>
          <span className="text-[10px] text-white/30">#{variantId}</span>
          <span
            className={[
              "rounded border px-2 py-0.5 text-[10px] tracking-wide",
              cyber
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200/80"
                : "border-white/12 bg-white/5 text-white/45",
            ].join(" ")}
          >
            {tag}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{description}</p>
      </header>

      <MobileFrame>
        <ProfileEditKinetikPanel
          {...panelProps}
          planProMetricLayout={variantId}
        />
      </MobileFrame>
    </article>
  );
}

export default function ProfilePlanProLayoutShowcasePage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [active, setActive] = useState<ProfilePlanProMetricLayoutVariant>("bento");
  const [showBaseline, setShowBaseline] = useState(false);
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("worldcup");

  const panelProps = useMemo(
    () =>
      buildBasePanel(language, rankingLeague, () =>
        setRankingLeague((league) =>
          league === "worldcup" ? "nba" : "worldcup"
        )
      ),
    [language, rankingLeague]
  );

  const cyberVariants = PROFILE_PLAN_PRO_CYBER_METRIC_LAYOUT_VARIANTS;
  const baseline = PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS.find((v) => v.id === "grid");
  const visibleVariants = showBaseline && baseline
    ? [...cyberVariants, baseline]
    : cyberVariants;

  return (
    <main className="profile-plan-pro-layout-showcase-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8">
      <header className="profile-plan-pro-layout-showcase mx-auto mb-8 max-w-[900px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Preview
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          PRO Cyber レイアウト — 全体比較
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Mobile（正）のフルプロフィールで、メトリクス部分のレイアウト案を並べています。
          Void Tunnel 背景・枠スイープ・6連勝ライム枠は共通。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dev/profile-plan-pro-preview"
            className="inline-flex border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:border-white/28"
          >
            ← PRO 全体プレビュー
          </Link>
          <Link
            href="/dev/profile-plan-pro-metrics-showcase"
            className="inline-flex border border-purple-400/25 px-3 py-1.5 text-xs text-purple-200/75 transition hover:border-purple-300/40"
          >
            メトリクス単体 6 案
          </Link>
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
          <button
            type="button"
            onClick={() => setShowBaseline((v) => !v)}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              showBaseline
                ? "border-white/30 bg-white/8 text-white/75"
                : "border-white/15 text-white/45 hover:border-white/25",
            ].join(" ")}
          >
            {showBaseline ? "現行 Grid を隠す" : "現行 Grid も表示"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleVariants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActive(v.id);
                document
                  .getElementById(`pro-layout-${v.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={[
                "border px-3 py-1.5 text-xs font-medium transition",
                active === v.id
                  ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                  : "border-white/15 text-white/55 hover:border-white/25",
              ].join(" ")}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="profile-plan-pro-layout-showcase mx-auto flex max-w-[900px] flex-col gap-12">
        {visibleVariants.map((variant) => (
          <LayoutCard
            key={variant.id}
            variantId={variant.id}
            label={variant.label}
            tag={variant.tag}
            description={variant.description}
            cyber={variant.id !== "grid"}
            language={language}
            highlighted={active === variant.id}
            panelProps={panelProps}
          />
        ))}
      </div>
    </main>
  );
}
