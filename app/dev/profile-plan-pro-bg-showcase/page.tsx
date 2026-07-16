"use client";

/**
 * /dev/profile-plan-pro-bg-showcase
 * 他サイト調査ベースの cyber 背景バリエーション比較
 */

import Link from "next/link";
import { useState } from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import ProfilePlanProBgSwatch from "@/app/component/profile/ui/ProfilePlanProBgSwatch";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameRajdhani } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_BG_VARIANTS,
  PROFILE_PLAN_PRO_BG_DEFAULT,
  PROFILE_PLAN_PRO_DEPTH_VARIANTS,
  type ProfilePlanProBgVariant,
} from "@/lib/profile/profilePlanProBgVariants";
import "./profilePlanProBgShowcase.css";

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="profile-plan-pro-bg-showcase-frame mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4">
        {children}
      </div>
    </div>
  );
}

function VariantCard({
  variant,
  panelProps,
  highlighted,
}: {
  variant: (typeof PROFILE_PLAN_PRO_BG_VARIANTS)[number];
  panelProps: Record<string, unknown>;
  highlighted: boolean;
}) {
  const isCurrent = variant.id === PROFILE_PLAN_PRO_BG_DEFAULT;

  return (
    <article
      id={`variant-${variant.id}`}
      className={[
        "profile-plan-pro-bg-showcase-card scroll-mt-28 rounded-xl transition",
        highlighted ? "ring-1 ring-cyan-400/40" : "",
      ].join(" ")}
    >
      <header className="mb-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={[
              nameRajdhani.className,
              "text-sm font-semibold tracking-[0.18em] uppercase",
              isCurrent ? "text-cyan-300" : "text-white/80",
            ].join(" ")}
          >
            {variant.label}
          </h2>
          <span className="text-[10px] text-white/30">#{variant.id}</span>
          {isCurrent ? (
            <span className="rounded border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-cyan-200/90">
              現行
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-white/40">{variant.tag}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">
          {variant.description}
        </p>
      </header>

      <MobileFrame>
        <div className="profile-plan-pro-bg-showcase-pro">
          <ProfileEditKinetikPanel
            layout="mobile"
            {...panelProps}
            isPro
            planProBgVariant={variant.id as ProfilePlanProBgVariant}
          />
        </div>
      </MobileFrame>
    </article>
  );
}

export default function ProfilePlanProBgShowcasePage() {
  const [activeId, setActiveId] = useState<ProfilePlanProBgVariant>(
    PROFILE_PLAN_PRO_BG_DEFAULT
  );

  const panelProps = {
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
    winStreak: 0,
    totalPointsRank: 12,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "Win now",
    metricsTitle: "WORLD CUP // STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "worldcup" as const,
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
        totalPointsRank: 12,
        totalPointsRankDenominator: 800,
        rankDeltaPlaces: 0,
        metricValueDeltas: null,
      },
    ],
  };

  const scrollToVariant = (id: ProfilePlanProBgVariant) => {
    setActiveId(id);
    document.getElementById(`variant-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="profile-plan-pro-bg-showcase-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8 md:pb-40">
      <header className="mx-auto mb-8 max-w-[1400px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Showcase
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          PRO プロフィール背景 — 全 {PROFILE_PLAN_PRO_BG_VARIANTS.length} 案
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
          奥行き・3D・平面を並列比較。NEW 追加案（Star Warp / Isometric / Topo など）含む。
          本番デフォルト: <strong className="text-cyan-300/80">Void Tunnel</strong>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dev/profile-plan-pro-preview"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            ← Free vs PRO 比較へ
          </Link>
        </div>
      </header>

      {/* 全パターン一覧（コンパクト） */}
      <section className="mx-auto mb-12 max-w-[1400px]">
        <h2
          className={[
            nameRajdhani.className,
            "mb-4 text-xs font-semibold tracking-[0.22em] text-white/45 uppercase",
          ].join(" ")}
        >
          全パターン一覧
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {PROFILE_PLAN_PRO_BG_VARIANTS.map((variant) => (
            <ProfilePlanProBgSwatch
              key={variant.id}
              variant={variant}
              isCurrent={variant.id === PROFILE_PLAN_PRO_BG_DEFAULT}
              selected={activeId === variant.id}
              onSelect={() => scrollToVariant(variant.id)}
            />
          ))}
        </div>
      </section>

      {/* フルカード比較 */}
      <section className="mx-auto max-w-[1400px]">
        <h2
          className={[
            nameRajdhani.className,
            "mb-6 text-xs font-semibold tracking-[0.22em] text-white/45 uppercase",
          ].join(" ")}
        >
          フルカード比較
        </h2>
        <div className="grid gap-10 pb-8 xl:grid-cols-2 xl:items-start 2xl:grid-cols-3">
          {PROFILE_PLAN_PRO_BG_VARIANTS.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              panelProps={panelProps}
              highlighted={activeId === variant.id}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
