"use client";

import type { League } from "@/lib/leagues";
import type { TeamSlot } from "@/lib/playoff-bracket-display";
import BracketCardWeb from "@/app/component/predict/shared/BracketCardWeb";
import ChampionCardWeb from "@/app/component/predict/shared/ChampionCardWeb";
import PlayoffBracketBackground from "@/app/component/predict/shared/PlayoffBracketBackground";
import PlayoffBracketWebHeader from "@/app/component/predict/shared/PlayoffBracketWebHeader";

export type PlayoffFullBracketWebProps = {
  league?: League;
  className?: string;
  score?: number | string;
  season?: string;

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

const SCALE = 0.64;

const CARD_W = 160 * SCALE;
const CARD_H = 72 * SCALE;

const DESIGN_W = 860;
const DESIGN_H = 500;
const HEADER_BOTTOM_GAP = 8;

const COL_X = {
  leftR1: 0,
  leftR2: 126,
  leftR3: 252,
  center: 400,
  rightR3: 548,
  rightR2: 674,
  rightR1: 800,
} as const;

const R1_Y = [12, 70, 128, 186, 272, 330, 388, 446];
const R2_Y = [70, 128, 330, 388];
const R3_Y = [170, 288];

const CENTER_TOP_Y = 206;
const CENTER_BOTTOM_Y = 254;

const CHAMPION_X = COL_X.center - 46;
const CHAMPION_Y = 56;

const SCORE_X = DESIGN_W / 2;
const SCORE_Y = CENTER_BOTTOM_Y + CARD_H + 60;

function getSafeItem(list: TeamSlot[] | undefined, index: number): TeamSlot {
  return list?.[index] ?? { teamId: null, wins: "", seed: "" };
}

function CardAt({
  x,
  y,
  teamId,
  wins,
  seed,
  side,
  league,
}: {
  x: number;
  y: number;
  teamId?: string | null;
  wins?: number | string;
  seed?: number | string;
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
      <BracketCardWeb
        teamId={teamId}
        wins={wins}
        seed={seed}
        side={side}
        league={league}
      />
    </div>
  );
}

export default function PlayoffFullBracketWeb({
  league = "nba",
  className = "",
  score,
  season,
  leftRound1,
  leftRound2,
  leftRound3,
  leftRound4,
  rightRound1,
  rightRound2,
  rightRound3,
  rightRound4,
  champion,
}: PlayoffFullBracketWebProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[1200px] overflow-visible rounded-[24px] ${className}`}
      style={{ background: "#020611" }}
    >
      <PlayoffBracketBackground />

      <div className="relative z-10 px-8 pt-8">
        <PlayoffBracketWebHeader season={season} />
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          width: DESIGN_W,
          height: DESIGN_H + HEADER_BOTTOM_GAP,
        }}
      >
        <div
          className="absolute left-0"
          style={{
            top: HEADER_BOTTOM_GAP,
            width: DESIGN_W,
            height: DESIGN_H,
          }}
        >
          <div
            className="absolute"
            style={{
              left: CHAMPION_X,
              top: CHAMPION_Y,
            }}
          >
            <ChampionCardWeb teamId={champion?.teamId} league={league} />
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
                seed={item.seed}
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
                seed={undefined}
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
                seed={undefined}
                side="left"
                league={league}
              />
            );
          })}

          {(() => {
            const item = getSafeItem(leftRound4, 0);
            return (
              <CardAt
                x={COL_X.center}
                y={CENTER_TOP_Y}
                teamId={item.teamId}
                wins={item.wins}
                seed={undefined}
                side="left"
                league={league}
              />
            );
          })()}

          {(() => {
            const item = getSafeItem(rightRound4, 0);
            return (
              <CardAt
                x={COL_X.center}
                y={CENTER_BOTTOM_Y}
                teamId={item.teamId}
                wins={item.wins}
                seed={undefined}
                side="right"
                league={league}
              />
            );
          })()}

          <div
            className="absolute text-center"
            style={{
              left: SCORE_X,
              top: SCORE_Y,
              transform: "translateX(-50%)",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: 32,
              letterSpacing: "0.08em",
              color: "#f8fbff",
              textShadow: `
                0 0 8px rgba(95,124,255,0.42),
                0 0 18px rgba(95,124,255,0.22)
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
                seed={undefined}
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
                seed={undefined}
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
                seed={item.seed}
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