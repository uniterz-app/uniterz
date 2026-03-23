// app/component/result/mobile/MobileResultMatchHeader.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Props = {
  post: PredictionPostV2;
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
      setRec({
        wins: d.wins ?? 0,
        losses: d.losses ?? 0,
        rank: d.rank,
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

function getStreakBadge(activeWinStreak: unknown): {
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
      label: `${v}連勝`,
      className:
        "bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white border border-red-300/70 shadow-[0_0_18px_rgba(239,68,68,0.5)]",
      iconClassName: "text-yellow-200",
    };
  }

  if (v >= 5) {
    return {
      label: `${v}連勝`,
      className:
        "bg-linear-to-r from-orange-500 via-amber-500 to-red-500 text-white border border-orange-200/70 shadow-[0_0_16px_rgba(249,115,22,0.42)]",
      iconClassName: "text-yellow-100",
    };
  }

  return {
    label: `${v}連勝`,
    className:
      "bg-linear-to-r from-yellow-300 via-amber-300 to-orange-400 text-black border border-yellow-100/80 shadow-[0_0_14px_rgba(250,204,21,0.38)]",
    iconClassName: "text-red-500",
  };
}

export default function MobileResultMatchHeader({ post }: Props) {
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
  const streakBadge = getStreakBadge(activeWinStreak);

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

  const cardBase =
    "rounded-2xl border border-white/15 bg-[#050814]/80 text-white overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.55)]";

  return (
    <div className={`relative ${cardBase} ${frame} px-6 py-8`}>
      <div className="absolute left-3 top-3 z-10">
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide"
          style={{ backgroundColor: pillBg }}
        >
          {pillText}
        </span>
      </div>

      {badge === "streak" && streakBadge && (
        <span
          className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md font-extrabold shadow-md ${streakBadge.className}`}
        >
          <Flame className={`h-3.5 w-3.5 ${streakBadge.iconClassName}`} />
          {streakBadge.label}
        </span>
      )}
      {badge === "hit" && (
        <span className="absolute right-3 top-3 z-10 bg-yellow-400 text-black text-[11px] px-2 py-0.5 rounded-md font-extrabold shadow-md">
          HIT
        </span>
      )}
      {badge === "upset" && (
        <span className="absolute right-3 top-3 z-10 bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-md font-extrabold shadow-md">
          UPSET
        </span>
      )}
      {badge === "miss" && (
        <span className="absolute right-3 top-3 z-10 bg-gray-500 text-white text-[11px] px-2 py-0.5 rounded-md font-extrabold shadow-md">
          MISS
        </span>
      )}

      <div className="grid grid-cols-3 items-center pt-6">
        <div className="flex flex-col items-center">
          <Icon className="w-10 h-10" fill={homeColor} stroke="#fff" />
          <div className="mt-1 text-[12px] text-center leading-tight font-bold">
            {getMobileTeamName(
              post.league,
              post.home?.name ?? "",
              homeL1,
              homeL2
            )}
          </div>
          <div className="mt-0.5 text-[10px] opacity-70 leading-none tracking-tight text-center">
            {fmtRecordWithRank(homeRecord)}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {matchDate && <div className="text-[11px] opacity-80 mb-1">{matchDate}</div>}

          <div
            className="font-black tracking-tight leading-none tabular-nums"
            style={{
              fontSize: "28px",
              lineHeight: "1",
              fontFamily:
                'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
            }}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div className="mt-1.5 text-[12px] font-extrabold tabular-nums opacity-85">
              Final: {finalScore}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <Icon className="w-10 h-10" fill={awayColor} stroke="#fff" />
          <div className="mt-1 text-[12px] text-center leading-tight font-bold">
            {getMobileTeamName(
              post.league,
              post.away?.name ?? "",
              awayL1,
              awayL2
            )}
          </div>
          <div className="mt-0.5 text-[10px] opacity-70 leading-none tracking-tight text-center">
            {fmtRecordWithRank(awayRecord)}
          </div>
        </div>
      </div>
    </div>
  );
}