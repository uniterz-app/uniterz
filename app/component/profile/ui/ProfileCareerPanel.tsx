"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import ProfileEditKinetikGlitchTitle from "@/app/component/profile/edit/ProfileEditKinetikGlitchTitle";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import { jp, nameOxanium, nameRajdhani } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  buildProfileCareerStats,
  formatCareerCount,
  formatCareerRank,
  formatCareerUnitsEarned,
  formatCareerWinRate,
  type ProfileCareerBadgeLike,
  type ProfileCareerStats,
} from "@/lib/profile/profileCareerStats";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import {
  getNbaKinetikScopeTitle,
  type ProfileKinetikMetricsPeriod,
} from "@/lib/profile/useNbaKinetikMonthlyStats";

type Props = {
  language?: Language;
  layout?: "web" | "mobile";
  posts?: number | null;
  winRate?: number | null;
  totalPointsRank?: number | null;
  totalPointsRankDenominator?: number | null;
  memberSinceMs?: number | null;
  badges?: readonly ProfileCareerBadgeLike[];
  loading?: boolean;
  /**
   * section: overview 用の独立パネル
   * face: カード裏面用（表と同じ Pro スキン枠）
   */
  variant?: "section" | "face";
  className?: string;
  isPro?: boolean;
  planProBgVariant?: ProfilePlanProBgVariant;
  /** SEASON / PLAYOFF 切替（face で表と同期） */
  metricsPeriod?: ProfileKinetikMetricsPeriod;
  onMetricsPeriodChange?: (period: ProfileKinetikMetricsPeriod) => void;
  /** 期間タブ併記時のシーズンキー（見出し用） */
  seasonKey?: string | null;
};

type CareerRow = {
  key: string;
  label: string;
  value: string;
};

function buildRows(
  stats: ProfileCareerStats,
  labels: {
    predictions: string;
    since: string;
    allTimeRank: string;
    bestMonthlyRank: string;
    top10Finishes: string;
    totalUnitsEarned: string;
    winRate: string;
    bestSport: string;
  }
): CareerRow[] {
  return [
    {
      key: "predictions",
      label: labels.predictions,
      value: formatCareerCount(stats.predictions),
    },
    {
      key: "since",
      label: labels.since,
      value: stats.sinceYear != null ? String(stats.sinceYear) : "—",
    },
    {
      key: "allTimeRank",
      label: labels.allTimeRank,
      value: formatCareerRank(stats.allTimeRank),
    },
    {
      key: "bestMonthlyRank",
      label: labels.bestMonthlyRank,
      value: formatCareerRank(stats.bestMonthlyRank),
    },
    {
      key: "top10",
      label: labels.top10Finishes,
      value: formatCareerCount(stats.top10Finishes),
    },
    {
      key: "units",
      label: labels.totalUnitsEarned,
      value: formatCareerUnitsEarned(stats.totalUnitsEarned),
    },
    {
      key: "winRate",
      label: labels.winRate,
      value: formatCareerWinRate(stats.winRatePct),
    },
    {
      key: "bestSport",
      label: labels.bestSport,
      value: stats.bestSport ?? "—",
    },
  ];
}

/** 予想者としての履歴書 — overview 公開ブロック / カード裏面 */
export default function ProfileCareerPanel({
  language = "ja",
  layout = "mobile",
  posts = null,
  winRate = null,
  totalPointsRank = null,
  totalPointsRankDenominator = null,
  memberSinceMs = null,
  badges = [],
  loading = false,
  variant = "section",
  className = "",
  isPro = false,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
  metricsPeriod = "season",
  onMetricsPeriodChange,
  seasonKey = null,
}: Props) {
  const msg = t(language);
  const isJa = language === "ja";
  const isMobile = layout === "mobile";
  const isFace = variant === "face";
  const lang: "ja" | "en" = isJa ? "ja" : "en";
  const reduceMotion = useReducedMotion() === true;
  const showProSkin = isPro && isFace;
  const showPeriodSwitcher = isFace && !!onMetricsPeriodChange;

  const stats = useMemo(
    () =>
      buildProfileCareerStats({
        language: lang,
        posts,
        winRate,
        totalPointsRank,
        totalPointsRankDenominator,
        memberSinceMs,
        badges,
      }),
    [
      lang,
      posts,
      winRate,
      totalPointsRank,
      totalPointsRankDenominator,
      memberSinceMs,
      badges,
    ]
  );

  const scopeTitle = getNbaKinetikScopeTitle(
    metricsPeriod,
    seasonKey ?? undefined
  );

  const togglePeriod = () => {
    onMetricsPeriodChange?.(
      metricsPeriod === "season" ? "playoffs" : "season"
    );
  };

  const rows = useMemo(
    () =>
      buildRows(stats, {
        predictions: msg.profile.careerPredictions,
        since: msg.profile.careerSince,
        allTimeRank:
          metricsPeriod === "playoffs"
            ? msg.profile.careerPlayoffRank
            : msg.profile.careerSeasonRank,
        bestMonthlyRank: msg.profile.careerBestMonthlyRank,
        top10Finishes: msg.profile.careerTop10Finishes,
        totalUnitsEarned: msg.profile.careerTotalUnitsEarned,
        winRate: msg.profile.careerWinRate,
        bestSport: msg.profile.careerBestSport,
      }),
    [stats, msg.profile, metricsPeriod]
  );

  const body = (
    <div className="relative z-[3] flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isFace ? (
            <div className="flex w-full justify-center py-1">
              <div className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--static">
                <ProfileEditKinetikGlitchTitle compact={isMobile}>
                  {msg.profile.careerSheetTitle}
                </ProfileEditKinetikGlitchTitle>
              </div>
            </div>
          ) : (
            <>
              <p
                className={[
                  nameRajdhani.className,
                  "text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70",
                ].join(" ")}
              >
                PREDICTOR DOSSIER
              </p>
              <h3
                className={[
                  nameRajdhani.className,
                  "mt-1 font-semibold tracking-[0.14em] text-white/95",
                  isMobile ? "text-lg" : "text-xl sm:text-[1.72rem]",
                ].join(" ")}
              >
                {msg.profile.careerTitle}
              </h3>
              <div
                className={[
                  "mt-1.5 h-px w-16",
                  "bg-white/20",
                ].join(" ")}
                aria-hidden
              />
            </>
          )}
          {showPeriodSwitcher ? (
            <div
              className={[
                "profile-edit-kinetik-metrics-scope-header",
                "profile-edit-kinetik-metrics-scope-header--picker",
                "profile-edit-kinetik-metrics-scope-header--toggle",
                "mt-3",
                showProSkin
                  ? "profile-edit-kinetik-metrics-scope-header--pro"
                  : "",
              ].join(" ")}
            >
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--prev"
                onClick={togglePeriod}
                aria-label={isJa ? "前の統計ボード" : "Previous stats board"}
              >
                <span
                  className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--left"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--breath"
                onClick={togglePeriod}
                aria-label={
                  isJa
                    ? "SEASON / PLAYOFF を切り替え"
                    : "Switch Season / Playoff"
                }
              >
                <span
                  className={[
                    nameRajdhani.className,
                    "font-semibold tracking-[0.14em] text-white/95",
                    isFace || isMobile ? "text-base" : "text-lg sm:text-xl",
                    showProSkin
                      ? "drop-shadow-[0_0_12px_rgba(34,211,238,0.28)]"
                      : "",
                  ].join(" ")}
                >
                  {scopeTitle}
                </span>
              </button>
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--next"
                onClick={togglePeriod}
                aria-label={isJa ? "次の統計ボード" : "Next stats board"}
              >
                <span
                  className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--right"
                  aria-hidden
                />
              </button>
            </div>
          ) : null}
          {!isFace ? (
            <p
              className={[
                isJa ? jp.className : "",
                "mt-2 max-w-[520px] text-xs leading-relaxed text-slate-300/80 sm:text-[14px]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {msg.profile.careerDesc}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className="mt-4 h-36 skeleton-scan rounded-md border border-white/10 bg-white/6"
          aria-hidden
        />
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className={[
                  "min-w-0 px-2.5 py-2",
                  showProSkin
                    ? "border border-white/[0.08] bg-black/20"
                    : "border border-white/[0.06] bg-white/[0.03]",
                ].join(" ")}
              >
                <dt
                  className={[
                    nameRajdhani.className,
                    "text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40",
                  ].join(" ")}
                >
                  {row.label}
                </dt>
                <dd
                  className={[
                    nameOxanium.className,
                    "mt-1 truncate text-[1.02rem] font-semibold tabular-nums tracking-wide text-white/90",
                  ].join(" ")}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <p
              className={[
                nameRajdhani.className,
                "mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40",
              ].join(" ")}
            >
              {msg.profile.careerAwards}
            </p>
            {stats.awards.length === 0 ? (
              <p
                className={[
                  isJa ? jp.className : "",
                  "mt-1.5 text-sm text-white/35",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                —
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {stats.awards.map((award) => (
                  <li
                    key={award.key}
                    className={[
                      nameRajdhani.className,
                      "border border-white/12 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold tracking-wide text-white/80",
                    ].join(" ")}
                  >
                    {award.label}
                    {award.count > 1 ? ` ×${award.count}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isFace ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {stats.seasonOptions.map((opt) => {
                const active = stats.seasonKey === opt;
                const label =
                  opt === "all-time" ? msg.profile.careerSeasonAllTime : opt;
                return (
                  <span
                    key={opt}
                    aria-current={active ? "true" : undefined}
                    className={[
                      nameRajdhani.className,
                      "rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]",
                      active
                        ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-50"
                        : "border-white/10 bg-white/[0.03] text-white/35",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                );
              })}
              <span
                className={[
                  isJa ? jp.className : "",
                  "ml-1 text-[10px] text-white/30",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {msg.profile.careerSeasonSoon}
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  if (isFace) {
    return (
      <ProfileKinetikPanelFrame
        as="div"
        isPlanPro={isPro}
        animatePlanProBg={isPro && !reduceMotion}
        planProBgVariant={planProBgVariant}
        proMobileStage={isPro && isMobile}
        web={layout === "web"}
        planProBgAccentReady
        className={[
          "flex h-full min-h-full w-full min-w-0 flex-col overflow-y-auto p-3",
          isPro
            ? "profile-edit-kinetik-card--pro-mobile"
            : "border border-t-0 border-cyan-300/20 bg-[#061018]/96",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {body}
      </ProfileKinetikPanelFrame>
    );
  }

  return (
    <ProfileKinetikPanelFrame
      as="section"
      className={["block w-full min-w-0 p-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {body}
    </ProfileKinetikPanelFrame>
  );
}
