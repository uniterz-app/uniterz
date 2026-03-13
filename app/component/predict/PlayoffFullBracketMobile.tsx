"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { League } from "@/lib/leagues";
import type { TeamSlot } from "@/lib/playoff-bracket-display";
import BracketCard from "@/app/component/predict/shared/BracketCardMobile";
import ChampionCard from "@/app/component/predict/shared/ChampionCardMobile";
import PlayoffBracketBackground from "@/app/component/predict/shared/PlayoffBracketBackground";
import PlayoffBracketHeader from "@/app/component/predict/shared/PlayoffBracketMobileHeader";

export type PlayoffFullBracketProps = {
  league?: League;
  className?: string;
  score?: number | string;

  leftRound1: TeamSlot[];
  leftRound2: TeamSlot[];
  leftRound3: TeamSlot[];
  leftRound4: TeamSlot[];

  rightRound1: TeamSlot[];
  rightRound2: TeamSlot[];
  rightRound3: TeamSlot[];
  rightRound4: TeamSlot[];

  champion?: TeamSlot;
};

const SCALE = 0.375;

const CARD_W = 160 * SCALE;
const CARD_H = 72 * SCALE;

const DESIGN_W = 504;
const DESIGN_H = 289;
const BRACKET_OFFSET_Y = -36;

const COL_X = {
  leftR1: 0,
  leftR2: 74,
  leftR3: 138,
  center: 222,
  rightR3: 306,
  rightR2: 370,
  rightR1: 444,
} as const;

const R1_Y = [6, 40, 74, 108, 160, 194, 228, 262];
const R2_Y = [40, 75, 195, 230];
const R3_Y = [110, 160];

const CENTER_TOP_Y = 115;
const CENTER_BOTTOM_Y = 150;

const CHAMPION_X = COL_X.center - 30;
const CHAMPION_Y = CENTER_TOP_Y - 70;

const SCORE_X = DESIGN_W / 2;
const SCORE_Y = CENTER_BOTTOM_Y + CARD_H + 50;

function getSafeItem(list: TeamSlot[] | undefined, index: number): TeamSlot {
  return list?.[index] ?? { teamId: null, wins: "" };
}

function CardAt({
  x,
  y,
  teamId,
  wins,
  side,
  league,
}: {
  x: number;
  y: number;
  teamId?: string | null;
  wins?: number | string;
  side: "left" | "right";
  league: League;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
      }}
    >
      <BracketCard teamId={teamId} wins={wins} side={side} league={league} />
    </div>
  );
}

export default function PlayoffFullBracketMobile({
  league = "nba",
  className = "",
  score,
  leftRound1,
  leftRound2,
  leftRound3,
  leftRound4,
  rightRound1,
  rightRound2,
  rightRound3,
  rightRound4,
  champion,
}: PlayoffFullBracketProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState(0);

  useEffect(() => {
    if (!wrapRef.current) return;

    const node = wrapRef.current;

    const update = () => {
      setWrapWidth(node.clientWidth);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(node);

    return () => ro.disconnect();
  }, []);

  const viewScale = useMemo(() => {
    if (!wrapWidth) return 1;
    return wrapWidth / DESIGN_W;
  }, [wrapWidth]);

  const scaledHeight = DESIGN_H * viewScale;

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <PlayoffBracketBackground />

      <div className="relative z-10 pt-4">
        <PlayoffBracketHeader />
      </div>

      <div
        className="relative mx-auto z-10"
        style={{
          width: "100%",
          height: scaledHeight,
          overflow: "visible",
        }}
      >
        <div
          className="absolute left-0"
          style={{
            top: BRACKET_OFFSET_Y * viewScale,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${viewScale})`,
            transformOrigin: "top left",
          }}
        >
          <div
            className="absolute"
            style={{
              left: CHAMPION_X,
              top: CHAMPION_Y,
            }}
          >
            <ChampionCard teamId={champion?.teamId} league={league} />
          </div>

          {R1_Y.map((y, i) => {
            const item = getSafeItem(leftRound1, i);
            return (
              <CardAt
                key={`left-r1-${i}`}
                x={COL_X.leftR1}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="left"
                league={league}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(leftRound2, i);
            return (
              <CardAt
                key={`left-r2-${i}`}
                x={COL_X.leftR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="left"
                league={league}
              />
            );
          })}

          {R3_Y.map((y, i) => {
            const item = getSafeItem(leftRound3, i);
            return (
              <CardAt
                key={`left-r3-${i}`}
                x={COL_X.leftR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="left"
                league={league}
              />
            );
          })}

          <CardAt
            x={COL_X.center}
            y={CENTER_TOP_Y}
            teamId={getSafeItem(leftRound4, 0).teamId}
            wins={getSafeItem(leftRound4, 0).wins}
            side="left"
            league={league}
          />

          <CardAt
            x={COL_X.center}
            y={CENTER_BOTTOM_Y}
            teamId={getSafeItem(rightRound4, 0).teamId}
            wins={getSafeItem(rightRound4, 0).wins}
            side="right"
            league={league}
          />

          <div
            className="absolute text-center"
            style={{
              left: SCORE_X,
              top: SCORE_Y,
              transform: "translateX(-50%)",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: 30,
              letterSpacing: "0.08em",
              color: "#f8fbff",
              textShadow: `
                0 0 6px rgba(95,124,255,0.45),
                0 0 14px rgba(95,124,255,0.25)
              `,
            }}
          >
            {score ?? 0} / 100
          </div>

          {R3_Y.map((y, i) => {
            const item = getSafeItem(rightRound3, i);
            return (
              <CardAt
                key={`right-r3-${i}`}
                x={COL_X.rightR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="right"
                league={league}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(rightRound2, i);
            return (
              <CardAt
                key={`right-r2-${i}`}
                x={COL_X.rightR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="right"
                league={league}
              />
            );
          })}

          {R1_Y.map((y, i) => {
            const item = getSafeItem(rightRound1, i);
            return (
              <CardAt
                key={`right-r1-${i}`}
                x={COL_X.rightR1}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="right"
                league={league}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}