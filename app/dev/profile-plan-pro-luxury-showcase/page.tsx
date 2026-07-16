"use client";

/**
 * /dev/profile-plan-pro-luxury-showcase
 * PRO 豪華化 8 案 — Mobile カード比較
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameRajdhani } from "@/lib/fonts";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import {
  PROFILE_PLAN_PRO_LUXURY_VARIANTS,
  type ProfilePlanProLuxuryVariant,
} from "@/lib/profile/profilePlanProLuxuryVariants";
import "./profilePlanProLuxuryShowcase.css";

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4">
        {children}
      </div>
    </div>
  );
}

function LuxuryVariantCard({
  variantId,
  label,
  tag,
  description,
  winStreak,
  panelProps,
}: {
  variantId: ProfilePlanProLuxuryVariant;
  label: string;
  tag: string;
  description: string;
  winStreak: number;
  panelProps: Record<string, unknown>;
}) {
  return (
    <section
      id={`luxury-${variantId}`}
      className="profile-plan-pro-luxury-showcase-card profile-plan-pro-luxury-showcase-frame rounded-xl border border-white/10 p-3"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p
            className={[
              nameRajdhani.className,
              "text-[10px] font-semibold tracking-[0.18em] text-cyan-300/60 uppercase",
            ].join(" ")}
          >
            {tag}
          </p>
          <h2 className="text-sm font-semibold text-white/92">{label}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-white/48">
            {description}
          </p>
        </div>
      </div>
      <MobileFrame>
        <ProfileEditKinetikPanel
          layout="mobile"
          {...panelProps}
          isPro
          winStreak={winStreak}
          planProBgVariant={PROFILE_PLAN_PRO_BG_DEFAULT}
          planProLuxuryVariant={variantId}
        />
      </MobileFrame>
    </section>
  );
}

export default function ProfilePlanProLuxuryShowcasePage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("worldcup");

  const panelProps = useMemo(
    () => ({
      language,
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
      totalPointsRank: 14,
      totalPointsRankDenominator: 800,
      rankDeltaPlaces: 0,
      bio: language === "ja" ? "Win now" : "Win now",
      metricsTitle:
        rankingLeague === "worldcup"
          ? "WORLD CUP // STATS"
          : "NBA // PLAYOFFS STATS",
      countryCode: "JP",
      memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
      shareHandle: "mpj",
      rankingLeague,
      onToggleMetricsScope: () =>
        setRankingLeague((league) =>
          league === "worldcup" ? "nba" : "worldcup"
        ),
    }),
    [language, rankingLeague]
  );

  const scrollTo = (id: ProfilePlanProLuxuryVariant) => {
    document.getElementById(`luxury-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-[#030508] px-4 py-10 text-white md:px-8">
      <header className="mx-auto mb-8 max-w-[1200px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.22em] text-cyan-300/55 uppercase",
          ].join(" ")}
        >
          Dev / Profile Plan PRO
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          PRO 豪華化 — {PROFILE_PLAN_PRO_LUXURY_VARIANTS.length} 案
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          右の PRO カードを豪華にする案を1枚ずつ適用。背景は Void Tunnel 固定。
          案8（Streak Frame）は 6 連勝表示。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROFILE_PLAN_PRO_LUXURY_VARIANTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="border border-white/15 px-2.5 py-1 text-[10px] font-medium text-white/55 transition hover:border-cyan-400/35 hover:text-cyan-100/90"
            >
              {item.tag} {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "ja"
                ? "border-cyan-400/45 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/55",
            ].join(" ")}
          >
            日本語
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "en"
                ? "border-cyan-400/45 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/55",
            ].join(" ")}
          >
            English
          </button>
          <Link
            href="/dev/profile-plan-pro-preview"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25"
          >
            ← Free vs PRO 比較へ
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 sm:grid-cols-2">
        {PROFILE_PLAN_PRO_LUXURY_VARIANTS.map((item) => (
          <LuxuryVariantCard
            key={item.id}
            variantId={item.id}
            label={item.label}
            tag={item.tag}
            description={item.description}
            winStreak={item.id === "streak-frame" ? 6 : 0}
            panelProps={panelProps}
          />
        ))}
      </div>
    </div>
  );
}
