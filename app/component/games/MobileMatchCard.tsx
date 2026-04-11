"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_ENTRY_DURATION_MS,
  GAMES_CYBER_ENTRY_DURATION_SEC,
  GAMES_CYBER_LEAD_IN_SEC,
  GAMES_CYBER_SLOT_GAP_SEC,
} from "./cyberMotion";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor, getTeamSecondaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import type { MatchCardProps } from "./MatchCard";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { TIMEZONE_ET, TIMEZONE_JST } from "@/lib/time/zonedTime";

// ★ 追加：Premier League 用 alias
import { getTeamAlias } from "@/lib/team-alias";

/**
 * 完全モバイル専用の試合カード
 * 予想一覧への遷移のみ
 * RoundLabel / LIVE情報 / ボタン行なし
 */
export default function MobileMatchCard(props: MatchCardProps) {
  const {
    id,
    league,
    startAtJst,
    status,
    home,
    away,
    score,
    viewPredictionHref,
    makePredictionHref,
    scheduleEntryIndex,
    inPredictOverlay = false,
  } = props;

  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const showContentEntry =
    !inPredictOverlay &&
    (scheduleEntryIndex === undefined || scheduleEntryIndex < 3);
  const entryTransition = useMemo(() => {
    if (!showContentEntry || reduceMotion) return null;
    const listStagger =
      scheduleEntryIndex !== undefined
        ? Math.min(scheduleEntryIndex * 0.032, 0.14)
        : 0;
    const ease = GAMES_CYBER_EASE;
    const duration = GAMES_CYBER_ENTRY_DURATION_SEC;
    const slotGap = GAMES_CYBER_SLOT_GAP_SEC;
    const leadIn = GAMES_CYBER_LEAD_IN_SEC;
    return (slot: number) => ({
      delay: listStagger + leadIn + slot * slotGap,
      duration,
      ease,
    });
  }, [showContentEntry, reduceMotion, scheduleEntryIndex]);
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const displayTimeZone = language === "en" ? TIMEZONE_ET : TIMEZONE_JST;

  const fmtShortDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: displayTimeZone,
          month: "numeric",
          day: "numeric",
        }).format(d)
      : "";

  /* ------------------------------
   * League 正規化 & Icon 切り替え
   * ------------------------------ */
  const normalizedLeague = normalizeLeague(league);

  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj"
      ? Jersey
      : Soccer;

  const jerseyDotRevealEnabled =
    showContentEntry &&
    (normalizedLeague === "nba" || normalizedLeague === "bj");

  /** HOME=2 / AWAY=4 の列入場に同期（3列目の後まで待たない） */
  const { jerseyDotHomeDelayMs, jerseyDotAwayDelayMs } = useMemo(() => {
    if (!jerseyDotRevealEnabled || reduceMotion || !entryTransition) {
      return { jerseyDotHomeDelayMs: 0, jerseyDotAwayDelayMs: 0 };
    }
    const entryItemDurationMs = GAMES_CYBER_ENTRY_DURATION_MS;
    const duringColumnMs = Math.round(entryItemDurationMs * 0.32);
    const tailMs = 28;
    const msForSlot = (slot: number) =>
      Math.round(entryTransition(slot).delay * 1000) + duringColumnMs + tailMs;
    return {
      jerseyDotHomeDelayMs: msForSlot(2),
      jerseyDotAwayDelayMs: msForSlot(4),
    };
  }, [jerseyDotRevealEnabled, reduceMotion, entryTransition]);

  /* ------------------------------
   * Team colors
   * ------------------------------ */
  const homeColor =
    getTeamPrimaryColor(normalizedLeague, home.teamId) ?? "#0ea5e9";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, away.teamId) ?? "#f43f5e";
  const homeSecondaryColor = getTeamSecondaryColor(
    normalizedLeague,
    home.teamId
  );
  const awaySecondaryColor = getTeamSecondaryColor(
    normalizedLeague,
    away.teamId
  );

  const kickoff =
    startAtJst instanceof Date
      ? startAtJst.toLocaleTimeString("en-US", {
          timeZone: displayTimeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--";

  const [homeL1, homeL2] = splitTeamNameByLeague(league, home.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(league, away.name);

  const showScore =
    status === "live" || status === "final"
      ? `${score?.home ?? 0} - ${score?.away ?? 0}`
      : kickoff;

  const handle = () => {
    router.push(viewPredictionHref);
  };

  /* ------------------------------
   * ★ Mobile 表示用チーム名ルール
   * ------------------------------ */
  function getMobileTeamName(
    league: string,
    rawName: string,
    l1: string,
    l2?: string
  ) {
    // NBA：nickname（line2）だけ
    if (league === "nba") {
      return l2 || rawName;
    }

    // Premier League：alias で 1 行
    if (league === "pl") {
      return getTeamAlias(rawName) ?? rawName;
    }

    // B1 / J1：従来どおり
    return [l1, l2].filter(Boolean).join(" ");
  }

  return (
    <motion.div
      onClick={handle}
      className="
        w-full rounded-2xl bg-white/5 border border-white/10
        px-4 py-3 text-white active:scale-[0.98]
        transition-transform cursor-pointer select-none
      "
      initial={entryTransition ? { scale: 0.97, opacity: 0.9 } : false}
      animate={entryTransition ? { scale: 1, opacity: 1 } : undefined}
      transition={
        entryTransition
          ? {
              scale: {
                type: "tween" as const,
                delay: entryTransition(0).delay,
                duration: entryTransition(0).duration + 0.05,
                ease: entryTransition(0).ease,
              },
              opacity: {
                type: "tween" as const,
                delay: entryTransition(0).delay,
                duration: entryTransition(0).duration * 0.5,
                ease: entryTransition(0).ease,
              },
            }
          : undefined
      }
    >
      <div className="grid grid-cols-3 items-center">

        {/* HOME */}
        <motion.div
          className="flex flex-col items-center"
          initial={entryTransition ? { opacity: 0, y: 10 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(2) : undefined}
        >
          {Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={homeColor}
              accentEnd={homeSecondaryColor}
              className="h-[4.5rem] w-[4.5rem]"
              enableDotReveal={jerseyDotRevealEnabled}
              dotRevealDelayMs={jerseyDotHomeDelayMs}
            />
          ) : (
            <Icon className="h-16 w-16" fill={homeColor} stroke="#fff" />
          )}
          <div className="mt-1 text-[14px] text-center leading-tight font-bold">
            {getMobileTeamName(league, home.name, homeL1, homeL2)}
          </div>
        </motion.div>

        {/* CENTER */}
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={entryTransition ? { opacity: 0, y: 10 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(3) : undefined}
        >
          <div className="text-[11px] opacity-80 mb-1">
            {fmtShortDate(startAtJst)}
          </div>

          <div
            className="text-2xl font-black tracking-tight leading-none"
            style={{
              fontFamily:
                'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
            }}
          >
            {showScore}
          </div>
        </motion.div>

        {/* AWAY */}
        <motion.div
          className="flex flex-col items-center"
          initial={entryTransition ? { opacity: 0, y: 10 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(4) : undefined}
        >
          {Icon === Jersey ? (
            <HalftoneJerseyMark
              accent={awayColor}
              accentEnd={awaySecondaryColor}
              className="h-[4.5rem] w-[4.5rem]"
              enableDotReveal={jerseyDotRevealEnabled}
              dotRevealDelayMs={jerseyDotAwayDelayMs}
            />
          ) : (
            <Icon className="h-16 w-16" fill={awayColor} stroke="#fff" />
          )}
          <div className="mt-1 text-[14px] text-center leading-tight font-bold">
            {getMobileTeamName(league, away.name, awayL1, awayL2)}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
