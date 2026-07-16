"use client";

/**
 * /dev/profile-plan-pro-preview
 * PRO プロフィールカード — 本番相当のプレビュー
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { resolveKinetikRankBadge } from "@/app/component/profile/edit/kinetikRankBadge";
import { nameRajdhani } from "@/lib/fonts";
import type { ProfileKinetikMetricsSection } from "@/lib/profile/profileKinetikMetricsSection";
import { getProfileKinetikMetricsTitleForWcStage } from "@/lib/profile/profileKinetikMetricsSection";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { ResolvedBadge } from "@/lib/profile/useProfileBadges";
import "./profilePlanProPreview.css";

const PREVIEW_SHOWCASE_LINKS = [
  {
    href: "/dev/profile-plan-pro-scale-showcase",
    label: "Scale Skin × Cyber",
  },
  {
    href: "/dev/profile-plan-pro-bg-showcase",
    label: "背景バリエーション",
  },
  {
    href: "/dev/profile-plan-pro-mobile-bg-showcase",
    label: "ムード背景",
  },
] as const;

/** スクリーンショット相当の配布バッジ（10個・横スライド確認用） */
const PREVIEW_BADGE_SOURCES = [
  {
    icon: "/play-in2026badge/1st.png",
    title: "1st",
    description: "Play-In 2026 総合1位の実績バッジ",
  },
  {
    icon: "/play-in2026badge/2nd.png",
    title: "2nd",
    description: "Play-In 2026 総合2位の実績バッジ",
  },
  {
    icon: "/play-in2026badge/3rd.png",
    title: "3rd",
    description: "Play-In 2026 総合3位の実績バッジ",
  },
  {
    icon: "/play-in2026badge/top20.png",
    title: "PLAY IN 総合得点 TOP20 (2025-26)",
    description:
      "2025-26 プレーイン期間のトータルポイントランキング4位〜20位に授与されるバッジ。",
  },
] as const;

const PREVIEW_MOCK_BADGES: ResolvedBadge[] = Array.from({ length: 10 }, (_, index) => {
  const source = PREVIEW_BADGE_SOURCES[index % PREVIEW_BADGE_SOURCES.length]!;
  return {
    id: `preview-badge-${index + 1}`,
    title: source.title,
    description: source.description,
    icon: source.icon,
    grantedAt: new Date(`2026-0${(index % 6) + 1}-15T00:00:00+09:00`),
  };
});

const PREVIEW_RANK = 59;
const PREVIEW_RANK_DENOM = 320;

const PREVIEW_WC_STATS = {
  winRate: 78.3,
  posts: 23,
  hits: 18,
  scorePrecision: 2,
  totalPoints: 148,
  upset: 6,
  winStreak: 0,
  totalPointsRank: PREVIEW_RANK,
  totalPointsRankDenominator: PREVIEW_RANK_DENOM,
  rankDeltaPlaces: null as number | null,
};

function buildWcStackedSection(
  wcStage: "main" | "qualifying",
  language: "ja" | "en"
): ProfileKinetikMetricsSection {
  const stats =
    wcStage === "main"
      ? PREVIEW_WC_STATS
      : {
          ...PREVIEW_WC_STATS,
          winRate: 72.1,
          posts: 31,
          hits: 22,
          scorePrecision: 3,
          totalPoints: 164,
          upset: 5.5,
          totalPointsRank: 48,
        };

  const rank = stats.totalPointsRank ?? PREVIEW_RANK;
  const denom = stats.totalPointsRankDenominator ?? PREVIEW_RANK_DENOM;

  return {
    wcStage,
    title: getProfileKinetikMetricsTitleForWcStage(wcStage),
    stats,
    metricValueDeltas: null,
    totalPointsRank: rank,
    totalPointsRankDenominator: denom,
    rankDeltaPlaces: null,
    winStreak: 0,
    rankBadge: resolveKinetikRankBadge({
      totalPointsRank: rank,
      totalPointsRankDenominator: denom,
      rankDeltaPlaces: null,
      language,
    }),
  };
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div className="overflow-visible rounded-[22px] bg-[#060809] p-2 pb-4">{children}</div>
    </div>
  );
}

function PreviewCard({
  label,
  tone,
  isPro,
  layout,
  panelProps,
}: {
  label: string;
  tone: "free" | "pro";
  isPro: boolean;
  layout: "web" | "mobile";
  panelProps: Record<string, unknown>;
}) {
  const shellClass =
    tone === "free" ? "profile-plan-pro-preview-free" : "profile-plan-pro-preview-pro";

  const panel = (
    <div className={shellClass}>
      <ProfileEditKinetikPanel
        layout={layout}
        {...panelProps}
        isPro={isPro}
        planProBgVariant="atmos"
      />
    </div>
  );

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span
          className={[
            nameRajdhani.className,
            "profile-plan-pro-preview-label",
            tone === "pro" ? "text-cyan-300/80" : "text-white/45",
          ].join(" ")}
        >
          {label}
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      {layout === "mobile" ? <MobileFrame>{panel}</MobileFrame> : panel}
    </section>
  );
}

export default function ProfilePlanProPreviewPage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [layout, setLayout] = useState<"web" | "mobile">("mobile");
  const [badgeCount, setBadgeCount] = useState(10);

  const previewBadges = useMemo(
    () => PREVIEW_MOCK_BADGES.slice(0, badgeCount),
    [badgeCount]
  );

  const panelProps = useMemo(
    () => ({
      language,
      identity: {
        ...PROFILE_EDIT_KINETIK_MOCK.identity,
        displayName: "MPJ",
        systemId: "3PJVG4Y9",
        handle: "mpj",
      },
      stats: PREVIEW_WC_STATS,
      editable: false,
      canOpenMenu: true,
      onOpenMenu: () => undefined,
      winStreak: 0,
      totalPointsRank: PREVIEW_RANK,
      totalPointsRankDenominator: PREVIEW_RANK_DENOM,
      rankDeltaPlaces: 0,
      bio: "Win now",
      metricsTitle: "WORLD CUP // GROUP STAGE STATS",
      countryCode: "JP",
      memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
      shareHandle: "mpj",
      rankingLeague: "worldcup" as RankingLeagueSource,
      onToggleMetricsScope: () => undefined,
      badges: previewBadges,
      stackedMetricsSections: [
        buildWcStackedSection("main", language),
        buildWcStackedSection("qualifying", language),
      ],
    }),
    [language, previewBadges]
  );

  const previewBadge = resolveKinetikRankBadge({
    totalPointsRank: PREVIEW_RANK,
    totalPointsRankDenominator: PREVIEW_RANK_DENOM,
    rankDeltaPlaces: 0,
    language,
  });

  return (
    <main className="profile-plan-pro-preview-page min-h-screen bg-[#03080d] px-4 py-8 pb-32 text-white md:px-8 md:pb-40">
      <header className="mx-auto mb-8 max-w-[1200px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Preview — PRO Profile
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          PRO プロフィールカード
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          本番相当のモック（WC グループステージ・ANALYST・配布バッジ10個・横スライド・atmos 背景）
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PREVIEW_SHOWCASE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-emerald-400/30 bg-emerald-400/8 px-3 py-1.5 text-xs font-medium text-emerald-100/90 transition hover:border-emerald-300/45 hover:bg-emerald-400/14"
            >
              {link.label} →
            </Link>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { key: "web" as const, label: "Web 2col" },
              { key: "mobile" as const, label: "Mobile" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLayout(item.key)}
              className={[
                "border px-3 py-1.5 text-xs font-medium transition",
                layout === item.key
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
                  ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                  : "border-white/15 text-white/60 hover:border-white/25",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] tracking-[0.14em] text-white/40 uppercase">Badges</span>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setBadgeCount(count)}
              className={[
                "min-w-8 border px-2 py-1 text-xs font-medium transition",
                badgeCount === count
                  ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
                  : "border-white/15 text-white/60 hover:border-white/25",
              ].join(" ")}
            >
              {count}
            </button>
          ))}
        </div>

        {previewBadge ? (
          <p className="mt-3 text-xs text-white/45">
            Tier: {previewBadge.label} — {previewBadge.description}
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 pb-8 lg:grid-cols-2 lg:items-start">
        <PreviewCard
          label="Free — baseline"
          tone="free"
          isPro={false}
          layout={layout}
          panelProps={panelProps}
        />
        <PreviewCard
          label="PRO — Atmos"
          tone="pro"
          isPro={true}
          layout={layout}
          panelProps={panelProps}
        />
      </div>
    </main>
  );
}
