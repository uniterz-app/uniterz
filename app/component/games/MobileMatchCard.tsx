"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import type { MatchCardProps } from "./MatchCard";

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

  const fmtShortDate = (d: Date | null) =>
    d ? `${d.getMonth() + 1}/${d.getDate()}` : "";

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

  const kickoff =
    startAtJst instanceof Date
      ? `${String(startAtJst.getHours()).padStart(2, "0")}:${String(
          startAtJst.getMinutes()
        ).padStart(2, "0")}`
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
          <Icon
            className="w-10 h-10"
            fill={homeColor}
            stroke="#fff"
          />
          <div className="mt-1 text-[12px] text-center leading-tight font-bold">
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
          <Icon
            className="w-10 h-10"
            fill={awayColor}
            stroke="#fff"
          />
          <div className="mt-1 text-[12px] text-center leading-tight font-bold">
            {getMobileTeamName(league, away.name, awayL1, awayL2)}
          </div>
        </div>

      </div>
    </div>
  );
}
