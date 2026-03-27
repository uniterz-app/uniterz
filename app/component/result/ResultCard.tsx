// app/component/result/ResultCard.tsx
"use client";

import React from "react";
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

function toFixed1(v: unknown): string | null {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : null;
}

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
  const isEn = language === "en";

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

  const scorePrecisionText = toFixed1(post.stats?.scorePrecision);
  const upsetPointsVal = toInt((post.stats as any)?.upsetPoints);
  const pointsV3Text = toFixed1((post.stats as any)?.pointsV3);
  const hadUpsetGame = Boolean((post.stats as any)?.hadUpsetGame);
  const upsetDisplayText = hadUpsetGame
    ? typeof upsetPointsVal === "number"
      ? `${upsetPointsVal}`
      : "0"
    : "--";

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

  let frame = "border border-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.55)]";
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

  const finalScoreClass = isMobile ? "text-[12px]" : "text-[16px]";
  const nameMt = isMobile ? "mt-1" : "mt-1.5";
  const mobileBadgeClass = isMobile
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-0.5";
  const mobileStreakBadgeClass = isMobile
    ? "text-[9px] px-1.5 py-0.5 gap-1"
    : "text-[11px] px-2.5 py-0.5 gap-1.5";
  const mobileStreakIconClass = isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <div
      onClick={handle}
      className={`
        relative rounded-2xl
        bg-[#050814]/80 text-white
        active:scale-[0.98] transition-transform
        cursor-pointer select-none overflow-hidden
        ${frame}
        ${isMobile ? "w-full px-4 py-3" : "w-full max-w-4xl mx-auto px-8 py-6"}
      `}
    >
      {badge === "streak" && streakBadge && (
        <span
          className={`absolute right-3 top-3 z-10 inline-flex items-center rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
        >
          {!isMobile && (
            <Flame
              className={`${mobileStreakIconClass} ${streakBadge.iconClassName}`}
            />
          )}
          {streakBadge.label}
        </span>
      )}
      {badge === "hit" && (
        <span className={`absolute right-3 top-3 z-10 bg-yellow-400 text-black rounded-md font-extrabold shadow-md ${mobileBadgeClass}`}>
          HIT
        </span>
      )}
      {badge === "upset" && (
        <span className={`absolute right-3 top-3 z-10 bg-red-500 text-white rounded-md font-extrabold shadow-md ${mobileBadgeClass}`}>
          UPSET
        </span>
      )}
      {badge === "miss" && (
        <span className={`absolute right-3 top-3 z-10 bg-gray-500 text-white rounded-md font-extrabold shadow-md ${mobileBadgeClass}`}>
          MISS
        </span>
      )}

      <div className="absolute left-3 top-3 z-10">
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide"
          style={{ backgroundColor: pillBg }}
        >
          {pillText}
        </span>
      </div>

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
          <div
            className={`${nameMt} font-bold leading-tight text-center ${
              isMobile ? "text-[12px]" : "text-[16px]"
            }`}
          >
            {getMobileTeamName(
              post.league,
              post.home?.name ?? "",
              homeL1,
              homeL2
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mt-3">
          <div
            className={`font-black tracking-tight leading-none tabular-nums ${
              isMobile ? "text-2xl" : "text-4xl"
            }`}
            style={{
              fontFamily:
                'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
            }}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div
              className={`mt-2 font-extrabold tabular-nums opacity-85 ${finalScoreClass}`}
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
          <div
            className={`${nameMt} font-bold leading-tight text-center ${
              isMobile ? "text-[12px]" : "text-[16px]"
            }`}
          >
            {getMobileTeamName(
              post.league,
              post.away?.name ?? "",
              awayL1,
              awayL2
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-white/15" />

      <div className="mt-3">
        <div className={`grid grid-cols-3 ${isMobile ? "gap-2" : "gap-3"}`}>
          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              {isEn ? "Score Precision" : "スコア精度"}
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${scorePrecisionValueClass}`}
            >
              {scorePrecisionText ?? "--"}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              {isEn ? "Upset Score" : "Upsetスコア"}
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${upsetValueClass}`}
            >
              {upsetDisplayText}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              {isEn ? "Total Score" : "総合スコア"}
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${pointsV3ValueClass}`}
            >
              {pointsV3Text ?? "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}