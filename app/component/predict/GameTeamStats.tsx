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
/** Firestore に入ってる形に合わせる */
type TeamDoc = {
  // 既存
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

  vsLabel: string;   // "Vs East" or "Vs West"
  vsRecord: string;  // "7-19" など
};

/* ================= Main ================= */

export default function GameTeamStats({ league, homeTeamId, awayTeamId }: Props) {
  const [home, setHome] = useState<ViewStats | null>(null);
  const [away, setAway] = useState<ViewStats | null>(null);

  useEffect(() => {
    const run = async () => {
      const [hSnap, aSnap] = await Promise.all([
        getDoc(doc(db, "teams", homeTeamId)),
        getDoc(doc(db, "teams", awayTeamId)),
      ]);
      if (!hSnap.exists() || !aSnap.exists()) return;

      const build = (t: TeamDoc, teamId: string): ViewStats => {
        const avgFor = t.gamesPlayed > 0 ? t.pointsForTotal / t.gamesPlayed : 0;
        const avgAgainst =
          t.gamesPlayed > 0 ? t.pointsAgainstTotal / t.gamesPlayed : 0;

        const homeL = Math.max(0, (t.homeGames ?? 0) - (t.homeWins ?? 0));
        const awayL = Math.max(0, (t.awayGames ?? 0) - (t.awayWins ?? 0));

          const oppConf =
  teamId === homeTeamId
    ? (aSnap.data() as TeamDoc).conference
    : (hSnap.data() as TeamDoc).conference;

const isVsEast = oppConf === "east";

const vsWins = isVsEast ? t.vsEastWins : t.vsWestWins;
const vsGames = isVsEast ? t.vsEastGames : t.vsWestGames;
const vsLosses = vsGames - vsWins;

const vsLabel = isVsEast ? "Vs East" : "Vs West";
const vsRecord = `${vsWins}-${vsLosses}`;

return {
  avgFor: Number(avgFor.toFixed(1)),
  avgAgainst: Number(avgAgainst.toFixed(1)),
  diff: Number((avgFor - avgAgainst).toFixed(1)),
  color: getTeamPrimaryColor(league, teamId),

  homeW: t.homeWins ?? 0,
  homeL,
  awayW: t.awayWins ?? 0,
  awayL,

  vsLabel,
  vsRecord,
};
      };

      setHome(build(hSnap.data() as TeamDoc, homeTeamId));
      setAway(build(aSnap.data() as TeamDoc, awayTeamId));
    };

    run();
  }, [league, homeTeamId, awayTeamId]);

  if (!home || !away) return null;

  return (
    <section className="mt-6 space-y-3">
      <CenterBarRow
        label="平均得点"
        left={home.avgFor}
        right={away.avgFor}
        leftColor={home.color}
        rightColor={away.color}
        delay={0.15}
      />

      <CenterBarRow
        label="平均失点"
        left={home.avgAgainst}
        right={away.avgAgainst}
        leftColor={home.color}
        rightColor={away.color}
        inverse
        delay={0.35}
      />

      {/* 得失点差（中央は今のまま） + 左右にHome/Away戦績 */}
<DiffRow
  label="得失点差"
  homeDiff={home.diff}
  awayDiff={away.diff}
  homeRecord={`${home.homeW}-${home.homeL}`}
  awayRecord={`${away.awayW}-${away.awayL}`}
  homeVsLabel={home.vsLabel}
  homeVsRecord={home.vsRecord}
  awayVsLabel={away.vsLabel}
  awayVsRecord={away.vsRecord}
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
    <div className="space-y-1">
      <div className="text-center text-xs md:text-sm tracking-widest text-white/60">
        {label}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3">
        <div className="flex items-center justify-end gap-1 md:gap-3">
          <span
            className={[
              alfa.className,
              "tabular-nums text-sm",
              lWin
                ? "font-bold text-yellow-300"
                : "text-white/80 opacity-80",
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

        <div className="h-4 w-[3px] rounded bg-white/40" />

        <div className="flex items-center gap-1 md:gap-3">
          <AnimatedBar
            value={right / max}
            color={rightColor}
            origin="left"
            delay={delay}
          />
          <span
            className={[
              alfa.className,
              "tabular-nums text-sm",
              rWin
                ? "font-bold text-yellow-300"
                : "text-white/80 opacity-80",
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
}){
  const homeWin = homeDiff > awayDiff;
  const awayWin = awayDiff > homeDiff;

  return (
    <div className="space-y-2">
      {/* ===== 得失点差 見出し行 ===== */}
      <div className="flex items-center gap-3">
        <div className="flex-1 px-4 md:px-10 text-left">
          <div className="text-xs md:text-sm tracking-widest text-white/60">
            Home 戦績
          </div>
        </div>

        <div className="shrink-0 w-[72px] text-center">
          <div className="text-xs md:text-sm tracking-widest text-white/60">
            {label}
          </div>
        </div>

        <div className="flex-1 px-4 md:px-10 text-right">
          <div className="text-xs md:text-sm tracking-widest text-white/60">
            Away 戦績
          </div>
        </div>
      </div>

      {/* ===== 得失点差 数値行 ===== */}
      <div className="flex items-center gap-3">
        <div
          className={[
            alfa.className,
            "tabular-nums text-sm text-white/80 flex-1 text-left px-8 md:px-10 whitespace-nowrap",
          ].join(" ")}
        >
          {homeRecord}
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={[
                alfa.className,
                "tabular-nums text-sm text-right w-[64px] md:w-[72px]",
                homeWin
                  ? "font-bold text-yellow-300"
                  : "text-white/80 opacity-80",
              ].join(" ")}
            >
              {homeDiff > 0 ? "+" : ""}
              {homeDiff.toFixed(1)}
            </div>

            <div className="h-4 w-[3px] rounded bg-white/40" />

            <div
              className={[
                alfa.className,
                "tabular-nums text-sm text-left w-[64px] md:w-[72px]",
                awayWin
                  ? "font-bold text-yellow-300"
                  : "text-white/80 opacity-80",
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
            "tabular-nums text-sm text-white/80 flex-1 text-right px-8 md:px-10 whitespace-nowrap",
          ].join(" ")}
        >
          {awayRecord}
        </div>
      </div>

{/* ===== Vs 見出し行 ===== */}
<div className="flex items-center gap-3 pt-1">
  <div className="flex-1 pr-11 md:pr-8 text-right">
    <div className="text-xs md:text-sm tracking-widest text-white/60">
      {homeVsLabel}
    </div>
  </div>

  <div className="flex-1 pl-11 md:pl-8 text-left">
    <div className="text-xs md:text-sm tracking-widest text-white/60">
      {awayVsLabel}
    </div>
  </div>
</div>

{/* ===== Vs 数値行 ===== */}
<div className="flex items-center gap-3">
  <div
    className={[
      alfa.className,
      "tabular-nums text-sm text-white/80 flex-1 text-right pr-13 md:pr-8 whitespace-nowrap",
    ].join(" ")}
  >
    {homeVsRecord}
  </div>

  <div
    className={[
      alfa.className,
      "tabular-nums text-sm text-white/80 flex-1 text-left pl-13 md:pl-8 whitespace-nowrap",
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
    <div className="relative h-2 md:h-3 w-29 md:w-115 bg-white/10 rounded overflow-hidden">
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
