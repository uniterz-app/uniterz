// app/component/result/ResultCard.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

type Props = {
  post: PredictionPostV2;
  href?: string;
  onOpen?: (post: PredictionPostV2) => void;
  language?: Language;
};

const leaguePillBg: Record<string, string> = {
  nba: "#1D428A",
  bj: "#C8102E",
  pl: "#3A0CA3",
  j1: "#E10600",
};

const leagueLabel: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
};

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function isYellow10pt(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 7;
}

function isRedUpset(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function getStreakBadge(
  activeWinStreak: unknown,
  isEn: boolean
): {
  label: string;
  className: string;
  iconClassName: string;
} | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;

  if (v < 3) return null;

  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white border border-red-300/70 shadow-[0_0_18px_rgba(239,68,68,0.5)]",
      iconClassName: "text-yellow-200",
    };
  }

  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-orange-500 via-amber-500 to-red-500 text-white border border-orange-200/70 shadow-[0_0_16px_rgba(249,115,22,0.42)]",
      iconClassName: "text-yellow-100",
    };
  }

  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    className:
      "bg-linear-to-r from-yellow-300 via-amber-300 to-orange-400 text-black border border-yellow-100/80 shadow-[0_0_14px_rgba(250,204,21,0.38)]",
    iconClassName: "text-red-500",
  };
}

/** Mobile用: 文字白・視認性重視・3/5/7で色階層 */
function getStreakBadgeForMobile(
  activeWinStreak: unknown,
  isEn: boolean
): {
  label: string;
  className: string;
  iconClassName: string;
} | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;

  if (v < 3) return null;

  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-[#180f2b] via-[#312e81] to-[#0f172a] text-white border border-violet-400/60 shadow-[0_0_14px_rgba(167,139,250,0.5)]",
      iconClassName: "text-white/90",
    };
  }

  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-[#0a1628] via-[#0e7490] to-[#052e2b] text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.45)]",
      iconClassName: "text-white/90",
    };
  }

  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    className:
      "bg-linear-to-r from-[#0b1f1a] via-[#166534] to-[#0f172a] text-white border border-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,0.4)]",
    iconClassName: "text-white/90",
  };
}

export default function ResultCard({
  post,
  href,
  onOpen,
  language = "ja",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");
  const teamNameFont = bracketMarketTeamTypography(isMobile);
  const isEn = language === "en";
  const hadUpsetGame = Boolean((post.stats as any)?.hadUpsetGame);

  const normalizedLeague = normalizeLeague(post.league);

  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj" ? Jersey : Soccer;

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#0ea5e9";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#f43f5e";

  const [homeL1, homeL2] = splitTeamNameByLeague(
    post.league,
    post.home?.name ?? ""
  );
  const [awayL1, awayL2] = splitTeamNameByLeague(
    post.league,
    post.away?.name ?? ""
  );

  function getMobileTeamName(
    league: string,
    rawName: string,
    l1: string,
    l2?: string
  ) {
    if (league === "nba") return l2 || rawName;
    if (league === "pl") return getTeamAlias(rawName) ?? rawName;
    return [l1, l2].filter(Boolean).join(" ");
  }

  const predictedScore = `${post.prediction.score.home} - ${post.prediction.score.away}`;

  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalScore = hasFinal
    ? `${post.result!.home} - ${post.result!.away}`
    : null;

  const handle = () => {
    if (onOpen) {
      onOpen(post);
    } else if (href) {
      router.push(href);
    }
  };

  const pillBg = leaguePillBg[normalizedLeague] ?? "#334155";
  const pillText =
    leagueLabel[normalizedLeague] ?? normalizedLeague.toUpperCase();

  const activeWinStreak = toInt(
    (post.stats as any)?.pointsV3Detail?.activeWinStreak
  ) ?? 0;

  const streakBadge = isMobile
    ? getStreakBadgeForMobile(activeWinStreak, isEn)
    : getStreakBadge(activeWinStreak, isEn);

  const scorePrecisionValueClass = isYellow10pt(post.stats?.scorePrecision)
    ? "text-yellow-300"
    : "text-white";
  const pointsV3ValueClass = isYellow10pt((post.stats as any)?.pointsV3)
    ? "text-yellow-300"
    : "text-white";
  const upsetValueClass = hadUpsetGame && isRedUpset((post.stats as any)?.upsetPoints)
    ? "text-red-400"
    : "text-white";

  let badge: "hit" | "upset" | "miss" | "streak" | null = null;
  if (post.stats?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  let frame = "";
  if (badge === "upset") {
    frame =
      "border border-red-700 ring-4 ring-red-700/90 shadow-[0_0_28px_rgba(220,38,38,0.75)]";
  } else if (badge === "streak") {
    if (activeWinStreak >= 7) {
      frame =
        "border border-red-400 ring-2 ring-red-400/70 shadow-[0_0_22px_rgba(239,68,68,0.45)]";
    } else if (activeWinStreak >= 5) {
      frame =
        "border border-orange-300 ring-2 ring-orange-300/60 shadow-[0_0_18px_rgba(249,115,22,0.38)]";
    } else {
      frame =
        "border border-yellow-300 ring-1 ring-yellow-300/60 shadow-[0_0_16px_rgba(250,204,21,0.32)]";
    }
  } else if (badge === "hit") {
    frame =
      "border border-yellow-400 ring-1 ring-yellow-400/70 shadow-[0_0_14px_rgba(250,204,21,0.45)]";
  } else if (badge === "miss") {
    frame = "border border-gray-500/60 shadow-[0_0_14px_rgba(107,114,128,0.35)]";
  }

  const nameMt = isMobile ? "mt-1" : "mt-1.5";
  const mobileBadgeClass = isMobile
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-0.5";
  const mobileStreakBadgeClass = isMobile
    ? "text-[9px] px-1.5 py-0.5 gap-1"
    : "text-[11px] px-2.5 py-0.5 gap-1.5";
  const mobileStreakIconClass = isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  const statRows = useMemo(() => {
    const scorePrecision = toNumber(post.stats?.scorePrecision, 0);
    const upsetPoints = toNumber((post.stats as any)?.upsetPoints, 0);
    const pointsV3 = toNumber((post.stats as any)?.pointsV3, 0);

    return [
      {
        key: "scorePrecision" as const,
        label: isEn ? "Score Precision" : "スコア精度",
        value: scorePrecision,
        barMax: 10,
        format: (v: number) => v.toFixed(1),
      },
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Score" : "Upsetスコア",
        value: upsetPoints,
        barMax: 10,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Score" : "総合スコア",
        value: pointsV3,
        barMax: 10,
        format: (v: number) =>
          `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ];
  }, [post.stats, isEn, hadUpsetGame]);

  const barAnimateMs = isMobile ? 480 : 520;
  const barStaggerMs = isMobile ? 80 : 90;

  const contentPad = isMobile ? "px-4 pb-3 pt-8" : "px-8 pb-6 pt-10";

  return (
    <div
      onClick={handle}
      className={[
        "group relative max-w-[1200px] mx-auto w-full overflow-hidden text-white",
        "active:scale-[0.98] transition-transform cursor-pointer select-none",
        MATCH_OVERLAY_GLASS_PANEL,
        frame,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-2 pt-2 sm:px-3 sm:pt-2.5">
        <span
          className="pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-[11px]"
          style={{ backgroundColor: pillBg, ...teamNameFont }}
        >
          {pillText}
        </span>
        <div className="flex min-w-0 flex-1 justify-end">
          {badge === "streak" && streakBadge && (
            <span
              className={`pointer-events-auto inline-flex max-w-full items-center rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
            >
              {!isMobile && (
                <Flame
                  className={`shrink-0 ${mobileStreakIconClass} ${streakBadge.iconClassName}`}
                />
              )}
              <span className="min-w-0 truncate">{streakBadge.label}</span>
            </span>
          )}
          {badge === "hit" && (
            <span
              className={`pointer-events-auto shrink-0 rounded-md bg-yellow-400 text-black font-extrabold shadow-md ${mobileBadgeClass}`}
            >
              HIT
            </span>
          )}
          {badge === "upset" && (
            <span
              className={`pointer-events-auto shrink-0 rounded-md bg-red-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
            >
              UPSET
            </span>
          )}
          {badge === "miss" && (
            <span
              className={`pointer-events-auto shrink-0 rounded-md bg-gray-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
            >
              MISS
            </span>
          )}
        </div>
      </div>

      <div className={`relative z-10 ${contentPad}`}>
      <div
        className={`grid items-center ${
          isMobile ? "grid-cols-3" : "grid-cols-3 gap-8"
        }`}
      >
        <div className="flex flex-col items-center ml-3">
          <Icon
            className={isMobile ? "w-10 h-10" : "w-14 h-14"}
            fill={homeColor}
            stroke="#fff"
          />
          {!isMobile ? (
            <div
              className={`${nameMt} text-center text-base font-bold leading-tight md:text-xl lg:text-2xl`}
              style={teamNameFont}
            >
              {homeL1} {homeL2}
            </div>
          ) : (
            <div
              className={`${nameMt} text-center text-[13px] font-bold leading-tight md:text-[17px]`}
              style={teamNameFont}
            >
              {getMobileTeamName(
                post.league,
                post.home?.name ?? "",
                homeL1,
                homeL2
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col items-center justify-center">
          <div
            className={[
              "leading-none tracking-tight tabular-nums text-xl md:text-5xl",
              resultStatsMetricNumClass,
              "font-black",
            ].join(" ")}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div
              className={`mt-2 tabular-nums opacity-85 text-sm font-bold md:text-base ${resultStatsMetricNumClass}`}
            >
              {finalScore}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center -ml-3">
          <Icon
            className={isMobile ? "w-10 h-10" : "w-14 h-14"}
            fill={awayColor}
            stroke="#fff"
          />
          {!isMobile ? (
            <div
              className={`${nameMt} text-center text-base font-bold leading-tight md:text-xl lg:text-2xl`}
              style={teamNameFont}
            >
              {awayL1} {awayL2}
            </div>
          ) : (
            <div
              className={`${nameMt} text-center text-[13px] font-bold leading-tight md:text-[17px]`}
              style={teamNameFont}
            >
              {getMobileTeamName(
                post.league,
                post.away?.name ?? "",
                awayL1,
                awayL2
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-white/15" />

      <div className={`mt-2.5 ${isMobile ? "space-y-0.5" : "space-y-1"}`}>
        {statRows.map((r, index) => {
          const cap = r.barMax;
          const ratio =
            r.key === "upsetPoints" && !hadUpsetGame
              ? 0
              : cap > 0
                ? clamp01(r.value / cap)
                : 0;
          const display = r.format(r.value);

          const valueClass =
            r.key === "scorePrecision"
              ? scorePrecisionValueClass
              : r.key === "upsetPoints"
                ? upsetValueClass
                : pointsV3ValueClass;

          return (
            <div
              key={r.key}
              className={
                isMobile
                  ? "flex items-center gap-2"
                  : "flex items-center gap-2.5 sm:gap-3"
              }
            >
              <div
                className={
                  isMobile
                    ? "w-26 min-w-0 shrink-0"
                    : "flex w-29 min-w-0 shrink-0 sm:w-31"
                }
              >
                <span
                  className={
                    isMobile
                      ? "truncate text-[11px] font-semibold leading-tight text-white"
                      : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                  }
                >
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                animateMs={barAnimateMs}
                delayMs={index * barStaggerMs}
                size={isMobile ? "sm" : "md"}
              />

              <div
                className={
                  isMobile
                    ? `w-10 shrink-0 text-right text-[11px] ${resultStatsMetricNumClass}`
                    : `w-11 shrink-0 text-right text-[12px] text-white sm:w-12 sm:text-[13px] ${resultStatsMetricNumClass}`
                }
              >
                <span className={valueClass}>{display}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}