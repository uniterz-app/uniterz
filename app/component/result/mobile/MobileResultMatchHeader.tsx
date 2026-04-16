// app/component/result/mobile/MobileResultMatchHeader.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor, getTeamSecondaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import type { Language } from "@/lib/i18n/language";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  post: PredictionPostV2;
  language?: Language;
  inOverlay?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

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

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function fmtRecordWithRank(
  r: { wins: number; losses: number; rank?: number } | null
) {
  if (!r) return "(0-0)";
  const record = `(${r.wins}-${r.losses})`;
  if (!r.rank) return record;
  return `${record} :${r.rank}${ordinal(r.rank)}`;
}

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

/** teams/{teamId} から wins/losses/rank を取る（MatchCard と同じ） */
function useTeamRecord(teamId?: string) {
  const [rec, setRec] = useState<{
    wins: number;
    losses: number;
    rank?: number;
  } | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const ref = doc(db, "teams", teamId);
    getDoc(ref).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as any;
      const isNba = String(d.league ?? "") === "nba";
      const wl = isNba
        ? nbaRegularSeasonWinsLosses(d)
        : { wins: Number(d.wins ?? 0), losses: Number(d.losses ?? 0) };
      setRec({
        wins: wl.wins,
        losses: wl.losses,
        rank: typeof d.rank === "number" ? d.rank : undefined,
      });
    });
  }, [teamId]);

  return rec;
}

/** Mobile表示用チーム名 */
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

/** Web の ResultMatchHeader と同じ配色（モバイルは下の JSX で文字・アイコンサイズのみ調整） */
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

export default function MobileResultMatchHeader({
  post,
  language = "ja",
  inOverlay: _inOverlay = false,
}: Props) {
  const teamNameFont = bracketMarketTeamTypography(true);
  const normalizedLeague = normalizeLeague(post.league);
  const isEn = language === "en";
  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj" ? Jersey : Soccer;

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#0ea5e9";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#f43f5e";
  const homeSecondaryColor = getTeamSecondaryColor(
    normalizedLeague,
    post.home?.teamId
  );
  const awaySecondaryColor = getTeamSecondaryColor(
    normalizedLeague,
    post.away?.teamId
  );

  const [homeL1, homeL2] = splitTeamNameByLeague(
    post.league,
    post.home?.name ?? ""
  );
  const [awayL1, awayL2] = splitTeamNameByLeague(
    post.league,
    post.away?.name ?? ""
  );

  const predictedScore = `${post.prediction.score.home} - ${post.prediction.score.away}`;

  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalScore = hasFinal
    ? `${post.result!.home} - ${post.result!.away}`
    : null;

  const matchDate = post.startAtMillis
    ? (() => {
        const d = new Date(post.startAtMillis);
        return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(
          d.getDate()
        )}`;
      })()
    : null;

  const homeRecord = useTeamRecord(post.home?.teamId);
  const awayRecord = useTeamRecord(post.away?.teamId);

  const pillBg = leaguePillBg[normalizedLeague] ?? "#334155";
  const pillText =
    leagueLabel[normalizedLeague] ?? normalizedLeague.toUpperCase();

  const activeWinStreak =
    toInt((post.stats as any)?.pointsV3Detail?.activeWinStreak) ?? 0;
  const streakBadge = getStreakBadge(activeWinStreak, isEn);

  let badge: "hit" | "upset" | "miss" | "streak" | null = null;
  if ((post.stats as any)?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  let frame = "border border-white/10";
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
    frame =
      "border border-gray-500/60 shadow-[0_0_14px_rgba(107,114,128,0.35)]";
  }

  const cardBase = `${MATCH_OVERLAY_GLASS_PANEL} overflow-hidden text-white`;

  return (
    <div className={`relative ${cardBase} ${frame}`}>
      {badge === "streak" ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl result-card-streak-sweep"
          aria-hidden
        >
          <div className="result-card-streak-sweep__spin" />
        </div>
      ) : null}
      {badge === "upset" ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl result-card-upset-sweep"
          aria-hidden
        >
          <div className="result-card-upset-sweep__spin" />
        </div>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-2 pt-2">
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: pillBg, ...teamNameFont }}
        >
          {pillText}
        </span>
        <div className="flex min-w-0 flex-1 justify-end">
          {badge === "streak" && streakBadge && (
            <span
              className={`inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold shadow-md ${streakBadge.className}`}
            >
              <Flame
                className={`h-2.5 w-2.5 shrink-0 ${streakBadge.iconClassName}`}
                aria-hidden
              />
              <span className="min-w-0 truncate leading-tight">
                {streakBadge.label}
              </span>
            </span>
          )}
          {badge === "hit" && (
            <span className="shrink-0 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-extrabold text-black shadow-md">
              HIT
            </span>
          )}
          {badge === "upset" && (
            <span className="shrink-0 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-md">
              UPSET
            </span>
          )}
          {badge === "miss" && (
            <span className="shrink-0 rounded-md bg-gray-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-md">
              MISS
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 px-4 pb-5 pt-9">
      <div className="grid grid-cols-3 items-center pt-1">
        <div className="flex flex-col items-center">
          {Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={homeColor}
              accentEnd={homeSecondaryColor}
              className="h-[4.5rem] w-[4.5rem]"
            />
          ) : (
            <Icon className="h-16 w-16" fill={homeColor} stroke="#fff" />
          )}
          <div
            className="mt-1 text-center text-[13px] font-bold leading-tight md:text-[17px]"
            style={teamNameFont}
          >
            {getMobileTeamName(
              post.league,
              post.home?.name ?? "",
              homeL1,
              homeL2
            )}
          </div>
          <div
            className={`mt-0.5 text-center text-[9px] leading-none tracking-tight opacity-70 ${resultStatsMetricNumClass}`}
          >
            {fmtRecordWithRank(homeRecord)}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {matchDate && (
            <div
              className="mb-0.5 text-[10px] opacity-80"
              style={teamNameFont}
            >
              {matchDate}
            </div>
          )}

          <div
            className={[
              "font-black leading-none tracking-tight tabular-nums text-xl text-white/85 md:text-5xl",
              resultStatsMetricNumClass,
            ].join(" ")}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div
              className={`mt-1 flex flex-col items-center tabular-nums ${resultStatsMetricNumClass}`}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-wide text-white/50"
                style={teamNameFont}
              >
                Final
              </div>
              <div className="text-sm font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:text-base">
                {finalScore}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          {Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={awayColor}
              accentEnd={awaySecondaryColor}
              className="h-[4.5rem] w-[4.5rem]"
            />
          ) : (
            <Icon className="h-16 w-16" fill={awayColor} stroke="#fff" />
          )}
          <div
            className="mt-0.5 text-center text-[13px] font-bold leading-tight md:text-[17px]"
            style={teamNameFont}
          >
            {getMobileTeamName(
              post.league,
              post.away?.name ?? "",
              awayL1,
              awayL2
            )}
          </div>
          <div
            className={`mt-0.5 text-center text-[9px] leading-none tracking-tight opacity-70 ${resultStatsMetricNumClass}`}
          >
            {fmtRecordWithRank(awayRecord)}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}