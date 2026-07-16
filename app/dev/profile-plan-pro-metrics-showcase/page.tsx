"use client";

/**
 * /dev/profile-plan-pro-metrics-showcase
 * PRO メトリクスグリッド — レイアウト・形状 6 案比較（Mobile 正 + Web 2col）
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import ProfilePlanProMetricsVariant, {
  type ProfilePlanProMetricShowcaseData,
} from "@/app/component/profile/dev/ProfilePlanProMetricsVariant";
import { nameRajdhani } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS,
  type ProfilePlanProMetricLayoutVariant,
} from "@/lib/profile/profilePlanProMetricLayoutVariants";
import "./profilePlanProMetricsShowcase.css";

type SurfaceLayout = "web" | "mobile";
type ViewMode = "both" | SurfaceLayout;

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="profile-plan-pro-metrics-showcase-frame mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-1 pb-3">
        {children}
      </div>
    </div>
  );
}

function WebFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="profile-plan-pro-metrics-showcase-frame profile-plan-pro-metrics-showcase-frame--web mx-auto w-full border border-white/10 bg-[#060809] p-1 pb-3">
      {children}
    </div>
  );
}

function MetricsHeader() {
  return (
    <div className="border-b border-white/8 px-2.5 py-2 md:px-3 md:py-2.5">
      <p
        className={[
          nameRajdhani.className,
          "text-[10px] font-semibold tracking-[0.2em] text-cyan-300/55 uppercase md:text-[11px]",
        ].join(" ")}
      >
        World Cup // Stats
      </p>
    </div>
  );
}

function LayoutSurface({
  layout,
  variantId,
  data,
  language,
}: {
  layout: SurfaceLayout;
  variantId: ProfilePlanProMetricLayoutVariant;
  data: ProfilePlanProMetricShowcaseData;
  language: "ja" | "en";
}) {
  const isMobile = layout === "mobile";
  const Frame = isMobile ? MobileFrame : WebFrame;

  return (
    <div className="profile-plan-pro-metrics-showcase-surface">
      <p
        className={[
          nameRajdhani.className,
          "profile-plan-pro-metrics-showcase-surface-label",
          isMobile
            ? "profile-plan-pro-metrics-showcase-surface-label--mobile"
            : "profile-plan-pro-metrics-showcase-surface-label--web",
        ].join(" ")}
      >
        {isMobile ? "Mobile（正）" : "Web 2col"}
      </p>
      <Frame>
        <MetricsHeader />
        <ProfilePlanProMetricsVariant
          variant={variantId}
          data={data}
          language={language}
          layout={layout}
        />
      </Frame>
    </div>
  );
}

function kinetikWinRateSegs(winRate: number): number {
  return Math.round((Math.min(100, Math.max(0, winRate)) / 100) * 6);
}

function kinetikTotalPointsRankSegs(rank: number, denominator: number): number {
  if (!Number.isFinite(rank) || !Number.isFinite(denominator) || denominator < 1) {
    return 0;
  }
  const pct = (rank / denominator) * 100;
  if (pct <= 1) return 5;
  if (pct <= 5) return 4;
  if (pct <= 15) return 3;
  if (pct <= 35) return 2;
  return 1;
}

function VariantCard({
  variantId,
  label,
  tag,
  description,
  data,
  language,
  viewMode,
  highlighted,
}: {
  variantId: ProfilePlanProMetricLayoutVariant;
  label: string;
  tag: string;
  description: string;
  data: ProfilePlanProMetricShowcaseData;
  language: "ja" | "en";
  viewMode: ViewMode;
  highlighted: boolean;
}) {
  const showMobile = viewMode === "both" || viewMode === "mobile";
  const showWeb = viewMode === "both" || viewMode === "web";

  return (
    <article
      id={`layout-${variantId}`}
      className={[
        "profile-plan-pro-metrics-showcase-card scroll-mt-28 rounded-xl transition",
        highlighted ? "ring-1 ring-cyan-400/40" : "",
      ].join(" ")}
    >
      <header className="mb-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={[
              nameRajdhani.className,
              "text-sm font-semibold tracking-[0.18em] uppercase text-white/85",
            ].join(" ")}
          >
            {label}
          </h2>
          <span className="text-[10px] text-white/30">#{variantId}</span>
          <span className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] tracking-wide text-white/45">
            {tag}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{description}</p>
      </header>

      {showMobile ? (
        <LayoutSurface
          layout="mobile"
          variantId={variantId}
          data={data}
          language={language}
        />
      ) : null}

      {showWeb ? (
        <LayoutSurface
          layout="web"
          variantId={variantId}
          data={data}
          language={language}
        />
      ) : null}
    </article>
  );
}

export default function ProfilePlanProMetricsShowcasePage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [active, setActive] = useState<ProfilePlanProMetricLayoutVariant>("bento");

  const data = useMemo<ProfilePlanProMetricShowcaseData>(
    () => ({
      winRate: 63.4,
      posts: 71,
      hits: 45,
      totalPoints: 350,
      totalPointsRank: 1,
      scorePrecision: 8,
      upset: 9,
      winSegs: kinetikWinRateSegs(63.4),
      ptsSegs: kinetikTotalPointsRankSegs(1, 800),
    }),
    []
  );

  return (
    <main className="profile-plan-pro-metrics-showcase-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8">
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
          PRO メトリクス — レイアウト 6 案
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Mobile（正）と Web 2col の両方で比較。各案は配置・形状・情報階層を変えた dev 用プロトタイプ。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dev/profile-plan-pro-preview"
            className="inline-flex border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:border-white/28"
          >
            ← PRO 全体プレビュー
          </Link>
          {(
            [
              { key: "both" as const, label: "両方" },
              { key: "mobile" as const, label: "Mobile（正）" },
              { key: "web" as const, label: "Web 2col" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setViewMode(item.key)}
              className={[
                "border px-3 py-1.5 text-xs font-medium transition",
                viewMode === item.key
                  ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                  : "border-white/15 text-white/60 hover:border-white/25",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
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
                  ? "border-purple-300/50 bg-purple-400/12 text-purple-100"
                  : "border-white/15 text-white/60 hover:border-white/25",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActive(v.id);
                document
                  .getElementById(`layout-${v.id}`)
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

      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-2">
        {PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS.map((variant) => (
          <VariantCard
            key={variant.id}
            variantId={variant.id}
            label={variant.label}
            tag={variant.tag}
            description={variant.description}
            data={data}
            language={language}
            viewMode={viewMode}
            highlighted={active === variant.id}
          />
        ))}
      </div>
    </main>
  );
}
