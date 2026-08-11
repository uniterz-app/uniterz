"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import ProfileEditKinetikGlitchTitle from "@/app/component/profile/edit/ProfileEditKinetikGlitchTitle";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import CyberNumber from "@/app/component/ui/CyberNumber";
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
};

type CareerRow = {
  key: string;
  label: string;
  value: string;
};

/** CAREER グリッドの数値 — CyberNumber で角張ったシアン表示 */
function CareerStatValue({
  rowKey,
  fallback,
  stats,
}: {
  rowKey: string;
  fallback: string;
  stats: ProfileCareerStats;
}) {
  if (fallback === "—") {
    return (
      <span
        className={[
          nameOxanium.className,
          "text-[1.05rem] font-semibold tracking-wide text-cyan-300/35",
        ].join(" ")}
      >
        —
      </span>
    );
  }

  if (rowKey === "bestSport") {
    return (
      <span
        className={[
          nameOxanium.className,
          "text-[1.05rem] font-semibold tracking-[0.12em] text-cyan-100",
        ].join(" ")}
      >
        {fallback}
      </span>
    );
  }

  if (rowKey === "predictions" && stats.predictions != null) {
    return <CyberNumber value={stats.predictions} size={18} glowIntensity={0.55} />;
  }
  if (rowKey === "since" && stats.sinceDate != null) {
    return (
      <CyberNumber
        value={stats.sinceDate}
        size={15}
        format={false}
        glowIntensity={0.55}
      />
    );
  }
  if (rowKey === "allTimeRank" && stats.allTimeRank != null) {
    return (
      <CyberNumber
        value={stats.allTimeRank}
        prefix="#"
        size={18}
        glowIntensity={0.55}
      />
    );
  }
  if (rowKey === "bestMonthlyRank" && stats.bestMonthlyRank != null) {
    return (
      <CyberNumber
        value={stats.bestMonthlyRank}
        prefix="#"
        size={18}
        glowIntensity={0.55}
      />
    );
  }
  if (rowKey === "top10" && stats.top10Finishes != null) {
    return (
      <CyberNumber value={stats.top10Finishes} size={18} glowIntensity={0.55} />
    );
  }
  if (rowKey === "units" && stats.totalUnitsEarned != null) {
    const n = stats.totalUnitsEarned;
    return (
      <CyberNumber
        value={Math.abs(n)}
        cornerSign={n > 0 ? "+" : n < 0 ? "−" : ""}
        size={18}
        glowIntensity={0.55}
      />
    );
  }
  if (rowKey === "winRate" && stats.winRatePct != null) {
    return (
      <CyberNumber
        value={stats.winRatePct.toFixed(1)}
        format={false}
        suffix="%"
        size={18}
        glowIntensity={0.55}
      />
    );
  }

  return (
    <span
      className={[
        nameOxanium.className,
        "text-[1.05rem] font-semibold tabular-nums tracking-wide text-cyan-100",
      ].join(" ")}
    >
      {fallback}
    </span>
  );
}

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
      value: stats.sinceDate ?? "—",
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
}: Props) {
  const msg = t(language);
  const isJa = language === "ja";
  const isMobile = layout === "mobile";
  const isFace = variant === "face";
  const lang: "ja" | "en" = isJa ? "ja" : "en";
  const reduceMotion = useReducedMotion() === true;
  const showProSkin = isPro && isFace;
  /** CAREER は通算（ALL）固定。SEASON/PLAYOFF 切替は表側のみ */
  const allTimeScope = "ALL // TIME";

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

  const rows = useMemo(
    () =>
      buildRows(stats, {
        predictions: msg.profile.careerPredictions,
        since: msg.profile.careerSince,
        allTimeRank: msg.profile.careerAllTimeRank,
        bestMonthlyRank: msg.profile.careerBestMonthlyRank,
        top10Finishes: msg.profile.careerTop10Finishes,
        totalUnitsEarned: msg.profile.careerTotalUnitsEarned,
        winRate: msg.profile.careerWinRate,
        bestSport: msg.profile.careerBestSport,
      }),
    [stats, msg.profile]
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
          {isFace ? (
            <div
              className={[
                "profile-edit-kinetik-metrics-scope-header",
                "profile-edit-kinetik-metrics-scope-header--picker",
                "mt-3",
                showProSkin
                  ? "profile-edit-kinetik-metrics-scope-header--pro"
                  : "",
              ].join(" ")}
            >
              <div className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--static">
                <span
                  className={[
                    nameRajdhani.className,
                    "font-semibold tracking-[0.14em] text-white/95",
                    isMobile ? "text-base" : "text-lg sm:text-xl",
                    showProSkin
                      ? "drop-shadow-[0_0_12px_rgba(34,211,238,0.28)]"
                      : "",
                  ].join(" ")}
                >
                  {allTimeScope}
                </span>
              </div>
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
                  "min-w-0 px-2.5 py-2 text-center",
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
                <dd className="mt-1 flex min-w-0 justify-center truncate">
                  <CareerStatValue
                    rowKey={row.key}
                    fallback={row.value}
                    stats={stats}
                  />
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
