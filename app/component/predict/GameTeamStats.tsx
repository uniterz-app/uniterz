"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { motion } from "framer-motion";
import { Alfa_Slab_One } from "next/font/google";

/* ================= Font ================= */

const alfa = Alfa_Slab_One({
  subsets: ["latin"],
  weight: ["400"],
});

/* ================= Types ================= */

type TeamDoc = {
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;

  homeGames: number;
  homeWins: number;
  awayGames: number;
  awayWins: number;

  conference: "east" | "west";

  vsEastGames: number;
  vsEastWins: number;
  vsWestGames: number;
  vsWestWins: number;
};

type Props = {
  league: League;
  homeTeamId: string;
  awayTeamId: string;
  language?: "ja" | "en";
};

type ViewStats = {
  avgFor: number;
  avgAgainst: number;
  diff: number;
  color: string;

  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;

  vsLabel: string;
  vsRecord: string;
};

/* ================= Main ================= */

export default function GameTeamStats({
  league,
  homeTeamId,
  awayTeamId,
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const [home, setHome] = useState<ViewStats | null>(null);
  const [away, setAway] = useState<ViewStats | null>(null);

  useEffect(() => {
    const run = async () => {
      const [hSnap, aSnap] = await Promise.all([
        getDoc(doc(db, "teams", homeTeamId)),
        getDoc(doc(db, "teams", awayTeamId)),
      ]);
      if (!hSnap.exists() || !aSnap.exists()) return;

      const homeDoc = hSnap.data() as TeamDoc;
      const awayDoc = aSnap.data() as TeamDoc;

      const build = (t: TeamDoc, teamId: string): ViewStats => {
        const avgFor = t.gamesPlayed > 0 ? t.pointsForTotal / t.gamesPlayed : 0;
        const avgAgainst =
          t.gamesPlayed > 0 ? t.pointsAgainstTotal / t.gamesPlayed : 0;

        const homeL = Math.max(0, (t.homeGames ?? 0) - (t.homeWins ?? 0));
        const awayL = Math.max(0, (t.awayGames ?? 0) - (t.awayWins ?? 0));

        const oppConf =
          teamId === homeTeamId ? awayDoc.conference : homeDoc.conference;

        const isVsEast = oppConf === "east";
        const vsWins = isVsEast ? t.vsEastWins : t.vsWestWins;
        const vsGames = isVsEast ? t.vsEastGames : t.vsWestGames;
        const vsLosses = Math.max(0, vsGames - vsWins);

        return {
          avgFor: Number(avgFor.toFixed(1)),
          avgAgainst: Number(avgAgainst.toFixed(1)),
          diff: Number((avgFor - avgAgainst).toFixed(1)),
          color: getTeamPrimaryColor(league, teamId) ?? "#3b82f6",

          homeW: t.homeWins ?? 0,
          homeL,
          awayW: t.awayWins ?? 0,
          awayL,

          vsLabel: isVsEast ? "Vs East" : "Vs West",
          vsRecord: `${vsWins}-${vsLosses}`,
        };
      };

      setHome(build(homeDoc, homeTeamId));
      setAway(build(awayDoc, awayTeamId));
    };

    run();
  }, [league, homeTeamId, awayTeamId]);

  if (!home || !away) return null;

  return (
    <section className="mt-3 space-y-4">
      <CenterBarRow
        label={isEn ? "Points For (Avg)" : "平均得点"}
        left={home.avgFor}
        right={away.avgFor}
        leftColor={home.color}
        rightColor={away.color}
        delay={0.15}
      />

      <CenterBarRow
        label={isEn ? "Points Against (Avg)" : "平均失点"}
        left={home.avgAgainst}
        right={away.avgAgainst}
        leftColor={home.color}
        rightColor={away.color}
        inverse
        delay={0.35}
      />

      <DiffRow
        label={isEn ? "Point Diff" : "得失点差"}
        homeDiff={home.diff}
        awayDiff={away.diff}
        homeRecord={`${home.homeW}-${home.homeL}`}
        awayRecord={`${away.awayW}-${away.awayL}`}
        homeVsLabel={home.vsLabel}
        homeVsRecord={home.vsRecord}
        awayVsLabel={away.vsLabel}
        awayVsRecord={away.vsRecord}
        language={language}
      />
    </section>
  );
}

/* ================= UI ================= */

function CenterBarRow({
  label,
  left,
  right,
  leftColor,
  rightColor,
  inverse,
  delay,
}: {
  label: string;
  left: number;
  right: number;
  leftColor: string;
  rightColor: string;
  inverse?: boolean;
  delay: number;
}) {
  const lWin = inverse ? left < right : left > right;
  const rWin = inverse ? right < left : right > left;
  const max = Math.max(left, right, 1);

  return (
    <div className="space-y-1.5">
      <div className="text-center text-xs md:text-sm tracking-widest text-white/60">
        {label}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-5">
        <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
          <span
            className={[
              alfa.className,
              "shrink-0 tabular-nums text-sm md:text-base",
              lWin ? "font-bold text-yellow-300" : "text-white/80 opacity-80",
            ].join(" ")}
          >
            {left.toFixed(1)}
          </span>

          <AnimatedBar
            value={left / max}
            color={leftColor}
            origin="right"
            delay={delay}
          />
        </div>

        <div className="h-4 w-[3px] shrink-0 rounded bg-white/40" />

        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <AnimatedBar
            value={right / max}
            color={rightColor}
            origin="left"
            delay={delay}
          />

          <span
            className={[
              alfa.className,
              "shrink-0 tabular-nums text-sm md:text-base",
              rWin ? "font-bold text-yellow-300" : "text-white/80 opacity-80",
            ].join(" ")}
          >
            {right.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function DiffRow({
  label,
  homeDiff,
  awayDiff,
  homeRecord,
  awayRecord,
  homeVsLabel,
  homeVsRecord,
  awayVsLabel,
  awayVsRecord,
  language = "ja",
}: {
  label: string;
  homeDiff: number;
  awayDiff: number;
  homeRecord: string;
  awayRecord: string;
  homeVsLabel: string;
  homeVsRecord: string;
  awayVsLabel: string;
  awayVsRecord: string;
  language?: "ja" | "en";
}) {
  const homeWin = homeDiff > awayDiff;
  const awayWin = awayDiff > homeDiff;
  const isEn = language === "en";

  return (
    <div className="space-y-3">
      {/* 見出し */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-5">
        <div className="text-left text-xs md:text-sm tracking-widest text-white/60">
          {isEn ? "Home Record" : "Home 戦績"}
        </div>

        <div className="w-[88px] shrink-0 text-center text-xs md:text-sm tracking-widest text-white/60">
          {label}
        </div>

        <div className="text-right text-xs md:text-sm tracking-widest text-white/60">
          {isEn ? "Away Record" : "Away 戦績"}
        </div>
      </div>

      {/* 数値 */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-5">
        <div
          className={[
            alfa.className,
            "tabular-nums text-left text-sm md:text-base text-white/80 whitespace-nowrap",
          ].join(" ")}
        >
          {homeRecord}
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={[
                alfa.className,
                "w-[64px] md:w-[72px] tabular-nums text-right text-sm md:text-base",
                homeWin ? "font-bold text-yellow-300" : "text-white/80 opacity-80",
              ].join(" ")}
            >
              {homeDiff > 0 ? "+" : ""}
              {homeDiff.toFixed(1)}
            </div>

            <div className="h-4 w-[3px] shrink-0 rounded bg-white/40" />

            <div
              className={[
                alfa.className,
                "w-[64px] md:w-[72px] tabular-nums text-left text-sm md:text-base",
                awayWin ? "font-bold text-yellow-300" : "text-white/80 opacity-80",
              ].join(" ")}
            >
              {awayDiff > 0 ? "+" : ""}
              {awayDiff.toFixed(1)}
            </div>
          </div>
        </div>

        <div
          className={[
            alfa.className,
            "tabular-nums text-right text-sm md:text-base text-white/80 whitespace-nowrap",
          ].join(" ")}
        >
          {awayRecord}
        </div>
      </div>

      {/* VS 見出し */}
      <div className="grid grid-cols-2 gap-6 md:gap-10 pt-1">
        <div className="text-right text-xs md:text-sm tracking-widest text-white/60">
          {homeVsLabel}
        </div>
        <div className="text-left text-xs md:text-sm tracking-widest text-white/60">
          {awayVsLabel}
        </div>
      </div>

      {/* VS 数値 */}
      <div className="grid grid-cols-2 gap-6 md:gap-10">
        <div
          className={[
            alfa.className,
            "tabular-nums text-right text-sm md:text-base text-white/80 whitespace-nowrap",
          ].join(" ")}
        >
          {homeVsRecord}
        </div>

        <div
          className={[
            alfa.className,
            "tabular-nums text-left text-sm md:text-base text-white/80 whitespace-nowrap",
          ].join(" ")}
        >
          {awayVsRecord}
        </div>
      </div>
    </div>
  );
}

/* ================= Animated Bar ================= */

function AnimatedBar({
  value,
  color,
  origin,
  delay,
}: {
  value: number;
  color: string;
  origin: "left" | "right";
  delay: number;
}) {
  return (
    <div className="relative h-2 md:h-3 w-[96px] md:w-[180px] shrink-0 overflow-hidden rounded bg-white/10">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(value, 1) }}
        transition={{ duration: 1.3, delay, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          transformOrigin: origin === "left" ? "left center" : "right center",
        }}
      />
    </div>
  );
}