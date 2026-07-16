"use client";

/**
 * /dev/profile-plan-pro-mobile-bg-showcase
 * Mobile PRO — ムード背景 × Free vs PRO
 */

import Link from "next/link";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameRajdhani } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_MOOD_BG_VARIANTS,
  type ProfilePlanProMoodBgVariant,
} from "@/lib/profile/profilePlanProMoodBgVariants";
import "./profilePlanProMobileBgShowcase.css";

function MobileFrame({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "free" | "pro";
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className={[
          nameRajdhani.className,
          "mb-2 text-[10px] font-semibold tracking-[0.18em] uppercase",
          tone === "pro" ? "text-white/80" : "text-white/40",
        ].join(" ")}
      >
        {label}
      </p>
      <div className="profile-plan-pro-mobile-bg-showcase-frame mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div
          className={[
            "overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4",
            tone === "free"
              ? "profile-plan-pro-mobile-bg-showcase-free"
              : "profile-plan-pro-mobile-bg-showcase-pro",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function panelProps() {
  return {
    language: "ja" as const,
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
    editable: false,
    canOpenMenu: true,
    onOpenMenu: () => undefined,
    winStreak: 0,
    totalPointsRank: 14,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "Win now",
    metricsTitle: "WORLD CUP // STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "worldcup" as const,
    onToggleMetricsScope: () => undefined,
    stackedMetricsSections: [
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
        winStreak: 0,
        totalPointsRank: 14,
        totalPointsRankDenominator: 800,
        rankDeltaPlaces: 0,
        metricValueDeltas: null,
      },
    ],
  };
}

function VariantRow({ variantId }: { variantId: ProfilePlanProMoodBgVariant }) {
  const meta = PROFILE_PLAN_PRO_MOOD_BG_VARIANTS.find((v) => v.id === variantId);
  if (!meta) return null;

  const shared = panelProps();

  return (
    <article
      id={`mobile-mood-${variantId}`}
      className="profile-plan-pro-mobile-bg-showcase-row rounded-xl border border-white/8 bg-white/[0.02] p-4 md:p-5"
    >
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={[
              nameRajdhani.className,
              "text-base font-semibold tracking-[0.16em] uppercase text-white/90",
            ].join(" ")}
          >
            {meta.label}
          </h2>
          <span
            className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/55"
            style={{ background: meta.swatch }}
          >
            {meta.tag}
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
          {meta.description}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <MobileFrame label="Free" tone="free">
          <ProfileEditKinetikPanel layout="mobile" {...shared} isPro={false} />
        </MobileFrame>
        <MobileFrame label="PRO — Mobile ステージ" tone="pro">
          <ProfileEditKinetikPanel
            layout="mobile"
            {...shared}
            isPro
            planProBgVariant={variantId}
          />
        </MobileFrame>
      </div>
    </article>
  );
}

export default function ProfilePlanProMobileBgShowcasePage() {
  return (
    <main className="profile-plan-pro-mobile-bg-showcase-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8 md:pb-40">
      <header className="mx-auto mb-10 max-w-[1200px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase",
          ].join(" ")}
        >
          Dev Showcase
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Mobile — ムード背景 {PROFILE_PLAN_PRO_MOOD_BG_VARIANTS.length} 案
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
          色味・雰囲気だけ変えた新背景。左 Free / 右 PRO。非 PRO ユーザーが「自分のプロフィールこうなったら」と想像しやすい比較です。
        </p>
        <div className="mt-4">
          <Link
            href="/dev/profile-plan-pro-preview"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            ← プレビューへ
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        {PROFILE_PLAN_PRO_MOOD_BG_VARIANTS.map((v) => (
          <VariantRow key={v.id} variantId={v.id} />
        ))}
      </div>
    </main>
  );
}
