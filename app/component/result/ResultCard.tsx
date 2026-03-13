// app/component/result/ResultCard.tsx
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

type Props = {
  post: PredictionPostV2;
  href: string;
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

/** 1件用の色ルール */
function isYellow10pt(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 7;
}
function isRedUpset(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export default function ResultCard({ post, href }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");

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

  // 実スコア（posts/{id}.result）
  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalScore = hasFinal
    ? `${post.result!.home} - ${post.result!.away}`
    : null;

  const handle = () => router.push(href);

  const pillBg = leaguePillBg[normalizedLeague] ?? "#334155";
  const pillText =
    leagueLabel[normalizedLeague] ?? normalizedLeague.toUpperCase();

  const scorePrecisionText = toFixed1(post.stats?.scorePrecision);
  const upsetPointsVal = toInt((post.stats as any)?.upsetPoints);
  const pointsV3Val = toInt((post.stats as any)?.pointsV3);

  // 色クラス（指定ルール）
  const scorePrecisionValueClass = isYellow10pt(post.stats?.scorePrecision)
    ? "text-yellow-300"
    : "text-white";
  const pointsV3ValueClass = isYellow10pt((post.stats as any)?.pointsV3)
    ? "text-yellow-300"
    : "text-white";
  const upsetValueClass = isRedUpset((post.stats as any)?.upsetPoints)
    ? "text-red-400"
    : "text-white";

  // ==============================
  // 結果バッジ + 外枠
  // ==============================
  let badge: "hit" | "upset" | "miss" | null = null;
  if (post.stats?.upsetHit) badge = "upset";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  // ★ Detail/Proカードと同じトーン（bgを合わせる）
  let frame = "border border-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.55)]";
  if (badge === "upset") {
    frame =
      "border border-red-700 ring-4 ring-red-700/90 shadow-[0_0_28px_rgba(220,38,38,0.75)]";
  } else if (badge === "hit") {
    frame =
      "border border-yellow-400 ring-1 ring-yellow-400/70 shadow-[0_0_14px_rgba(250,204,21,0.45)]";
  } else if (badge === "miss") {
    frame = "border border-gray-500/60 shadow-[0_0_14px_rgba(107,114,128,0.35)]";
  }

  // 実スコアの文字サイズ：チーム名と同じくらい
  const finalScoreClass = isMobile ? "text-[12px]" : "text-[16px]";

  const nameMt = isMobile ? "mt-1" : "mt-1.5";

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
      {/* 右上：結果バッジ */}
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

      {/* 左上：リーグピル */}
      <div className="absolute left-3 top-3 z-10">
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide"
          style={{ backgroundColor: pillBg }}
        >
          {pillText}
        </span>
      </div>

      {/* 上段（ユニフォーム + 点数） */}
      <div
        className={`grid items-center ${
          isMobile ? "grid-cols-3" : "grid-cols-3 gap-8"
        }`}
      >
        {/* HOME */}
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

        {/* CENTER */}
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

          {/* 実スコア（予想スコアの下） */}
          {finalScore && (
            <div
              className={`mt-2 font-extrabold tabular-nums opacity-85 ${finalScoreClass}`}
            >
              {finalScore}
            </div>
          )}
        </div>

        {/* AWAY */}
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

      {/* 破線 */}
      <div className="mt-4 border-t border-dashed border-white/15" />

      {/* 下段：スタッツブロック */}
      <div className="mt-3">
        <div className={`grid grid-cols-3 ${isMobile ? "gap-2" : "gap-3"}`}>
          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              スコア精度
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${scorePrecisionValueClass}`}
            >
              {scorePrecisionText ?? "--"}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              Upsetスコア
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${upsetValueClass}`}
            >
              {typeof upsetPointsVal === "number" ? `+${upsetPointsVal}` : "--"}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/60">
              総合スコア
            </div>
            <div
              className={`mt-1 text-[13px] font-extrabold tabular-nums ${pointsV3ValueClass}`}
            >
              {typeof pointsV3Val === "number" ? pointsV3Val : "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}