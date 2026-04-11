"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
  } = props;

  const router = useRouter();
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
    <div
      onClick={handle}
      className="
        w-full rounded-2xl bg-white/5 border border-white/10
        px-4 py-3 text-white active:scale-[0.98]
        transition-transform cursor-pointer select-none
      "
    >
      <div className="grid grid-cols-3 items-center">

        {/* HOME */}
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
          <div className="mt-1 text-[14px] text-center leading-tight font-bold">
            {getMobileTeamName(league, home.name, homeL1, homeL2)}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center">
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
        </div>

        {/* AWAY */}
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
          <div className="mt-1 text-[14px] text-center leading-tight font-bold">
            {getMobileTeamName(league, away.name, awayL1, awayL2)}
          </div>
        </div>

      </div>
    </div>
  );
}
