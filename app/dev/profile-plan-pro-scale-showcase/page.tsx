"use client";

/**
 * /dev/profile-plan-pro-scale-showcase
 * 爬虫類スキン × サイバー背景の比較
 */

import Link from "next/link";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameRajdhani } from "@/lib/fonts";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import {
  PROFILE_PLAN_PRO_SCALE_BG_VARIANTS,
  type ProfilePlanProScaleBgVariant,
} from "@/lib/profile/profilePlanProScaleBgVariants";
import "./profilePlanProScaleShowcase.css";

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="profile-plan-pro-scale-showcase-frame mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4">
        {children}
      </div>
    </div>
  );
}

function panelProps(): Record<string, unknown> {
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
  };
}

function ScaleSwatch({
  variantId,
}: {
  variantId: ProfilePlanProScaleBgVariant;
}) {
  const meta = PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.find((v) => v.id === variantId);
  if (!meta) return null;

  return (
    <div
      className={[
        "profile-plan-pro-scale-swatch relative w-full overflow-hidden rounded-xl border border-white/12",
        PROFILE_PLAN_PRO_CLASS,
        "profile-kinetik-panel",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: meta.swatch }}
        aria-hidden
      />
      <ProfilePlanProBackgroundFx variant={variantId} animate />
      <div className="profile-plan-pro-scale-swatch__label relative z-[1] flex min-h-[110px] flex-col justify-end p-3">
        <span
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.14em] uppercase text-white/90",
          ].join(" ")}
        >
          {meta.label}
        </span>
        <span className="mt-0.5 text-[10px] text-white/50">{meta.tag}</span>
      </div>
    </div>
  );
}

function VariantRow({ variantId }: { variantId: ProfilePlanProScaleBgVariant }) {
  const meta = PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.find((v) => v.id === variantId);
  if (!meta) return null;

  const shared = panelProps();

  return (
    <article
      id={`scale-${variantId}`}
      className="profile-plan-pro-scale-showcase-row rounded-xl border border-white/8 bg-white/[0.02] p-4 md:p-5"
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
          <span className="rounded border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200/80">
            {meta.tag}
          </span>
          <span className="text-[10px] text-white/30">#{variantId}</span>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
          {meta.description}
        </p>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:hidden">
        <ScaleSwatch variantId={variantId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start">
        <div className="hidden lg:block">
          <ScaleSwatch variantId={variantId} />
        </div>
        <MobileFrame>
          <div className="profile-plan-pro-scale-showcase-pro">
            <ProfileEditKinetikPanel
              layout="mobile"
              {...shared}
              isPro
              planProBgVariant={variantId}
            />
          </div>
        </MobileFrame>
      </div>
    </article>
  );
}

export default function ProfilePlanProScaleShowcasePage() {
  return (
    <main className="profile-plan-pro-scale-showcase-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8 md:pb-40">
      <header className="mx-auto mb-10 max-w-[1100px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase",
          ].join(" ")}
        >
          Dev Showcase
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Scale Skin × Cyber — {PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.length} 案
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
          ブラックマンバなど実在種の皮目を、atmos 配置（右下寄せ・中央空け・微細 HUD）で乗せた案。先頭 6
          種がリアル寄り、以降はサイバー寄りの実験枠です。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dev/profile-plan-pro-preview"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            ← プレビューへ
          </Link>
          <Link
            href="/dev/profile-plan-pro-bg-showcase"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            既存背景ショーケース
          </Link>
          <Link
            href="/dev/profile-plan-pro-mobile-bg-showcase"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            ムード背景
          </Link>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.map((v) => (
            <a
              key={v.id}
              href={`#scale-${v.id}`}
              className={[
                nameRajdhani.className,
                "rounded border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/55 transition hover:border-white/25 hover:text-white/80",
              ].join(" ")}
            >
              {v.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-10">
        {PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.map((v) => (
          <VariantRow key={v.id} variantId={v.id} />
        ))}
      </div>
    </main>
  );
}
