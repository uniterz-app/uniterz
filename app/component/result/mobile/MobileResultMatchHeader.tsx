// app/component/result/mobile/MobileResultMatchHeader.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Pencil } from "lucide-react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import CountryFlag from "@/app/component/games/CountryFlag";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import {
  getTeamPrimaryColor,
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultGlassShell from "@/app/component/result/ResultGlassShell";
import {
  resultHitBadgeClass,
  resultMissBadgeClass,
  resultUpsetBadgeClass,
} from "@/lib/result/resultGlass";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { getWinStreakBadge } from "@/lib/ui/winStreakBadge";
import { ResultLeagueBadge } from "@/app/component/result/ResultLeagueBadge";

type Props = {
  post: PredictionPostV2;
  language?: Language;
  inOverlay?: boolean;
  viewerUid?: string | null;
  gamesRoutePrefix?: "/web" | "/mobile";
};

const pad2 = (n: number) => String(n).padStart(2, "0");

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

export default function MobileResultMatchHeader({
  post,
  language = "ja",
  inOverlay: _inOverlay = false,
  viewerUid = null,
  gamesRoutePrefix = "/mobile",
}: Props) {
  const teamNameFont = bracketMarketTeamTypography(true);
  const normalizedLeague = normalizeLeague(post.league);
  const isWc = normalizedLeague === "wc";
  const m = t(language);
  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj" ? Jersey : Soccer;

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#0ea5e9";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#f43f5e";
  const homeJerseyColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.home?.teamId) ??
    homeColor;
  const awayJerseyColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.away?.teamId) ??
    awayColor;
  const homeJerseySecondaryColor = getTeamJerseySecondaryColor(
    normalizedLeague,
    post.home?.teamId
  );
  const awayJerseySecondaryColor = getTeamJerseySecondaryColor(
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

  const predictedHome = post.prediction.score.home;
  const predictedAway = post.prediction.score.away;

  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalHome = hasFinal ? post.result!.home : null;
  const finalAway = hasFinal ? post.result!.away : null;

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

  const activeWinStreak =
    toInt((post.stats as any)?.pointsV3Detail?.activeWinStreak) ?? 0;
  const streakBadge = getWinStreakBadge(activeWinStreak, language, {
    compact: true,
    subtle: true,
  });

  let badge: "hit" | "upset" | "miss" | "streak" | null = null;
  if ((post.stats as any)?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  const predictEditHref = useMemo(() => {
    if (!viewerUid || !post.gameId) return null;
    if (post.authorUid !== viewerUid) return null;
    /** 試合確定後は修正へ導線を出さない */
    const finalized =
      post.status === "final" || post.game?.status === "final";
    if (finalized) return null;
    return `${gamesRoutePrefix}/games/${post.gameId}/predict`;
  }, [viewerUid, post.authorUid, post.gameId, post.status, post.game?.status, gamesRoutePrefix]);

  return (
    <ResultGlassShell
      badge={badge}
      activeWinStreak={activeWinStreak}
      showSweep={badge === "streak" || badge === "upset" || badge === "hit"}
      dense
      lift={false}
      extraPanelClassName="text-white"
      className="relative"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-2 pt-0.5">
        <ResultLeagueBadge
          league={normalizedLeague}
          teamNameFont={teamNameFont}
        />
        <div
          className={[
            "flex min-w-0 flex-1 flex-col items-end gap-1",
            predictEditHref ? "pr-10" : "",
          ].join(" ")}
        >
          <div className="flex max-w-full flex-row flex-wrap items-start justify-end gap-1">
            {badge === "streak" && streakBadge && (
              <span className={streakBadge.className}>
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
              <span className={resultHitBadgeClass(true, { subtle: true })}>
                HIT
              </span>
            )}
            {badge === "upset" && (
              <span className={resultUpsetBadgeClass(true)}>UPSET</span>
            )}
            {badge === "miss" && (
              <span className={resultMissBadgeClass(true, { subtle: true })}>
                MISS
              </span>
            )}
          </div>
        </div>
      </div>
      {predictEditHref ? (
        <div className="pointer-events-auto absolute right-2 top-2 z-30">
          <Link
            href={predictEditHref}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-black/60 text-white/90 shadow-md backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-cyan-950/30 hover:text-cyan-100"
            aria-label={m.results.editPredictionAriaLabel}
          >
            <Pencil className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="relative z-10 px-4 pb-5 pt-11">
      <div className="grid grid-cols-3 items-center pt-1">
        <div className="flex flex-col items-center">
          {isWc ? (
            <CountryFlag
              teamId={post.home?.teamId}
              className="h-[3rem] w-[4.2rem]"
            />
          ) : Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={homeJerseyColor}
              accentEnd={homeJerseySecondaryColor}
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

          <MatchScoreLine
            home={predictedHome}
            away={predictedAway}
            className="font-black text-[clamp(0.9rem,3.4vw,1.2rem)] leading-none tracking-tight text-white/85 md:text-5xl"
          />

          {finalHome != null && finalAway != null ? (
            <div className="mt-1 flex flex-col items-center">
              <div
                className="text-[9px] font-bold uppercase tracking-wide text-white/50"
                style={teamNameFont}
              >
                {m.results.final}
              </div>
              <MatchScoreLine
                home={finalHome}
                away={finalAway}
                className="text-sm font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:text-base"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-center">
          {isWc ? (
            <CountryFlag
              teamId={post.away?.teamId}
              className="h-[3rem] w-[4.2rem]"
            />
          ) : Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={awayJerseyColor}
              accentEnd={awayJerseySecondaryColor}
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
    </ResultGlassShell>
  );
}