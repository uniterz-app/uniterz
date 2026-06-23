// app/component/result/ResultMatchHeader.tsx
"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { isResultWinFrameBadge } from "@/lib/result/resultGlass";
import { resolveResultCardBadge } from "@/lib/result/resultBadge";
import { isResultPostLiveGame, isResultPostMatchStarted } from "@/lib/result/resultLiveGame";
import { useResultCardClockMs } from "@/lib/hooks/useResultCardClockMs";
import ResultOutcomeBadges from "@/app/component/result/ResultOutcomeBadges";
import ResultLiveMark from "@/app/component/result/ResultLiveMark";
import { bracketMarketTeamTypography, wcBracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { ResultLeagueBadge, shouldShowResultLeagueBadge } from "@/app/component/result/ResultLeagueBadge";

type Props = {
  post: PredictionPostV2;
  language?: Language;
  inOverlay?: boolean;
  viewerUid?: string | null;
  gamesRoutePrefix?: "/web" | "/mobile";
  cardClockMs?: number;
  /** 指定時はページ遷移せずコールバック（一覧オーバーレイと同じ予想修正） */
  onRequestPredictEdit?: (post: PredictionPostV2) => void;
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
  r: {
    wins: number;
    losses: number;
    rank?: number;
  } | null
) {
  if (!r) return "(0-0)";
  const record = `(${r.wins}-${r.losses})`;
  if (!r.rank) return record;
  return `${record} :${r.rank}${ordinal(r.rank)}`;
}

/** teams/{teamId} から wins/losses/rank を取る */
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

function ResultMatchHeader({
  post,
  language = "ja",
  inOverlay: _inOverlay = false,
  viewerUid = null,
  gamesRoutePrefix = "/web",
  cardClockMs,
  onRequestPredictEdit,
}: Props) {
  const clock = useResultCardClockMs(cardClockMs);
  const pathname = usePathname();
  const isMobileRoute = pathname?.startsWith("/mobile") ?? false;
  /** モバイルルートではユニ（Canvas）だけ一段大きく */
  const jerseyMarkClass = isMobileRoute
    ? "h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24"
    : "h-20 w-20 sm:h-24 sm:w-24";
  const teamNameFont = bracketMarketTeamTypography(isMobileRoute);
  const normalizedLeague = normalizeLeague(post.league);
  const isWc = normalizedLeague === "wc";
  const displayTeamNameFont = isWc
    ? wcBracketMarketTeamTypography(isMobileRoute)
    : teamNameFont;
  const m = t(language);

  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj"
      ? Jersey
      : Soccer;

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
        const d = new Date(post.startAtMillis as number);
        return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(
          d.getDate()
        )}`;
      })()
    : null;

  const homeRecord = useTeamRecord(post.home?.teamId);
  const awayRecord = useTeamRecord(post.away?.teamId);

  const {
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    activeWinStreak,
    streakBadge,
  } = resolveResultCardBadge(post, language);

  const canPredictEdit = useMemo(() => {
    if (!viewerUid || !post.gameId) return false;
    if (post.authorUid !== viewerUid) return false;
    /** 試合確定後は修正へ導線を出さない */
    const finalized =
      post.status === "final" || post.game?.status === "final";
    if (finalized) return false;
    if (isResultPostMatchStarted(post, clock)) return false;
    return Boolean(onRequestPredictEdit || gamesRoutePrefix);
  }, [
    viewerUid,
    post.authorUid,
    post.gameId,
    post.status,
    post.game?.status,
    post.startAtMillis,
    gamesRoutePrefix,
    clock,
    onRequestPredictEdit,
  ]);

  const predictEditHref = useMemo(() => {
    if (!canPredictEdit || onRequestPredictEdit || !gamesRoutePrefix) return null;
    return `${gamesRoutePrefix}/games/${post.gameId}/predict?edit=1`;
  }, [canPredictEdit, onRequestPredictEdit, gamesRoutePrefix, post.gameId]);

  const isLiveGame = isResultPostLiveGame(post, clock);
  const liveMarkNode = isLiveGame ? (
    <ResultLiveMark isMobile={isMobileRoute} language={language} />
  ) : null;

  return (
    <ResultGlassShell
      badge={badge}
      activeWinStreak={activeWinStreak}
      showSweep={
        badge === "streak" || badge === "upset" || isResultWinFrameBadge(badge)
      }
      lift={false}
      extraPanelClassName="text-white"
      className="relative"
    >
      <div
        className={[
          "absolute inset-x-0 top-0 z-20 flex items-start gap-2 px-2 pt-2 sm:px-3 sm:pt-2.5",
          shouldShowResultLeagueBadge(normalizedLeague)
            ? "justify-between"
            : "justify-end",
        ].join(" ")}
      >
        <ResultLeagueBadge
          league={normalizedLeague}
          teamNameFont={teamNameFont}
        />
        <div
          className={[
            "flex min-w-0 flex-1 flex-col items-end gap-1 sm:gap-1.5",
            predictEditHref || canPredictEdit ? "pr-11 sm:pr-12" : "",
          ].join(" ")}
        >
          <ResultOutcomeBadges
            badge={badge}
            outcomeBadge={outcomeBadge}
            showStreakBadge={showStreakBadge}
            stackBadges={stackBadges}
            streakBadge={streakBadge}
            activeWinStreak={activeWinStreak}
            isMobile={false}
            hitBadgeSubtle
            trailing={liveMarkNode}
          />
        </div>
      </div>
      {canPredictEdit ? (
        <div className="pointer-events-auto absolute right-2 top-2 z-30 sm:right-3 sm:top-2.5">
          {onRequestPredictEdit ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/60 text-white/90 shadow-md backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-cyan-950/30 hover:text-cyan-100 sm:h-9 sm:w-9"
              aria-label={m.results.editPredictionAriaLabel}
              onClick={() => onRequestPredictEdit(post)}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </button>
          ) : predictEditHref ? (
            <Link
              href={predictEditHref}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/60 text-white/90 shadow-md backdrop-blur-sm transition hover:border-cyan-400/50 hover:bg-cyan-950/30 hover:text-cyan-100 sm:h-9 sm:w-9"
              aria-label={m.results.editPredictionAriaLabel}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 px-5 pb-5 pt-12 sm:px-6 sm:pb-6 sm:pt-14">
      <div className="grid grid-cols-3 items-center gap-1 sm:gap-2">
        <div className="flex flex-col items-center">
          {isWc ? (
            <CountryFlag
              teamId={post.home?.teamId}
              className="h-[3.5rem] w-[4.8rem] sm:h-[4.2rem] sm:w-[5.8rem]"
            />
          ) : Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={homeJerseyColor}
              accentEnd={homeJerseySecondaryColor}
              className={jerseyMarkClass}
            />
          ) : (
            <Icon className="h-20 w-20 sm:h-24 sm:w-24" fill={homeColor} stroke="#fff" />
          )}
          {!isMobileRoute ? (
            <div
              className="mt-1.5 text-center text-base font-bold leading-tight sm:mt-2 md:text-xl lg:text-2xl"
              style={displayTeamNameFont}
            >
              {homeL1} {homeL2}
            </div>
          ) : (
            <div
              className="mt-1.5 text-center text-[13px] font-bold leading-tight sm:mt-2 md:text-[17px]"
              style={displayTeamNameFont}
            >
              {getMobileTeamName(
                post.league,
                post.home?.name ?? "",
                homeL1,
                homeL2
              )}
            </div>
          )}
          <div
            className={`mt-0.5 text-center text-[11px] leading-none tracking-tight opacity-70 sm:mt-1 sm:text-[12px] ${resultStatsMetricNumClass}`}
          >
            {fmtRecordWithRank(homeRecord)}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {matchDate && (
            <div
              className="mb-1 text-[12px] opacity-80 sm:mb-1.5 sm:text-[13px]"
              style={teamNameFont}
            >
              {matchDate}
            </div>
          )}

          <MatchScoreLine
            home={predictedHome}
            away={predictedAway}
            className="font-black text-xl leading-none tracking-tight text-white/85 md:text-5xl"
          />

          {finalHome != null && finalAway != null ? (
            <div className="mt-2 flex flex-col items-center sm:mt-2.5">
              <span
                className="text-sm text-white/55 sm:text-base"
                style={teamNameFont}
              >
                {m.results.final}:
              </span>
              <MatchScoreLine
                home={finalHome}
                away={finalAway}
                className="text-sm font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] sm:text-base"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-center">
          {isWc ? (
            <CountryFlag
              teamId={post.away?.teamId}
              className="h-[3.5rem] w-[4.8rem] sm:h-[4.2rem] sm:w-[5.8rem]"
            />
          ) : Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={awayJerseyColor}
              accentEnd={awayJerseySecondaryColor}
              className={jerseyMarkClass}
            />
          ) : (
            <Icon className="h-20 w-20 sm:h-24 sm:w-24" fill={awayColor} stroke="#fff" />
          )}
          {!isMobileRoute ? (
            <div
              className="mt-1.5 text-center text-base font-bold leading-tight sm:mt-2 md:text-xl lg:text-2xl"
              style={displayTeamNameFont}
            >
              {awayL1} {awayL2}
            </div>
          ) : (
            <div
              className="mt-1.5 text-center text-[13px] font-bold leading-tight sm:mt-2 md:text-[17px]"
              style={displayTeamNameFont}
            >
              {getMobileTeamName(
                post.league,
                post.away?.name ?? "",
                awayL1,
                awayL2
              )}
            </div>
          )}
          <div
            className={`mt-0.5 text-center text-[11px] leading-none tracking-tight opacity-70 sm:mt-1 sm:text-[12px] ${resultStatsMetricNumClass}`}
          >
            {fmtRecordWithRank(awayRecord)}
          </div>
        </div>
      </div>
    </div>
    </ResultGlassShell>
  );
}

export default memo(ResultMatchHeader);