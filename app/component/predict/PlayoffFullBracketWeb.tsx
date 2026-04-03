"use client";

import { useMemo } from "react";
import type { League } from "@/lib/leagues";
import type { SeriesId } from "@/lib/playoff-bracket";
import type { TeamSlot } from "@/lib/playoff-bracket-display";
import { slotTeamIdToBracketCode } from "@/lib/playoff-bracket-display";
import BracketCardWeb, {
  type BracketCardHitStatus,
} from "@/app/component/predict/shared/BracketCardWeb";
import ChampionCardWeb from "@/app/component/predict/shared/ChampionCardWeb";
import { PLAYOFF_BRACKET_PANEL } from "@/lib/ui/matchOverlayGlass";
import PlayoffBracketWebHeader from "@/app/component/predict/shared/PlayoffBracketWebHeader";
import PlayoffBracketHitLegend from "@/app/component/predict/shared/PlayoffBracketHitLegend";
import type { Language } from "@/lib/i18n/language";
import {
  buildRound1Series,
  getPlayoffBracketConfig,
} from "@/lib/playoff-bracket-config";

type SeriesPickLike = {
  winner?: string;
  games?: number;
};

type BracketLike = Partial<Record<SeriesId, SeriesPickLike>>;

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

  bracket?: BracketLike;
  results?: BracketLike;
  /** When set, shows hit-mark legend under the season header */
  hitLegend?: { language: Language };
  /** false ＝外枠のガラスパネルなし（オーバーレイ内など、背後のブラーだけ使うとき） */
  showGlassShell?: boolean;
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

const SERIES_PARENTS: Partial<Record<SeriesId, [SeriesId, SeriesId]>> = {
  R2_E1: ["R1_E1", "R1_E2"],
  R2_E2: ["R1_E3", "R1_E4"],
  R2_W1: ["R1_W1", "R1_W2"],
  R2_W2: ["R1_W3", "R1_W4"],
  CF_E: ["R2_E1", "R2_E2"],
  CF_W: ["R2_W1", "R2_W2"],
  FINALS: ["CF_E", "CF_W"],
};

const ALL_SERIES_IDS: SeriesId[] = [
  "R1_E1",
  "R1_E2",
  "R1_E3",
  "R1_E4",
  "R1_W1",
  "R1_W2",
  "R1_W3",
  "R1_W4",
  "R2_E1",
  "R2_E2",
  "R2_W1",
  "R2_W2",
  "CF_E",
  "CF_W",
  "FINALS",
];

function normalizeTeamId(v?: string | null) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

function getSafeItem(list: TeamSlot[] | undefined, index: number): TeamSlot {
  return list?.[index] ?? { teamId: null, wins: "", seed: "" };
}

function sameMatchup(
  aTop?: string | null,
  aBottom?: string | null,
  bTop?: string | null,
  bBottom?: string | null
) {
  const x1 = normalizeTeamId(aTop);
  const x2 = normalizeTeamId(aBottom);
  const y1 = normalizeTeamId(bTop);
  const y2 = normalizeTeamId(bBottom);

  if (!x1 || !x2 || !y1 || !y2) return false;

  return (x1 === y1 && x2 === y2) || (x1 === y2 && x2 === y1);
}

function getSeriesIdFromRound1Index(
  side: "left" | "right",
  index: number
): SeriesId {
  const seriesIndex = Math.floor(index / 2) + 1;
  return `${side === "left" ? "R1_E" : "R1_W"}${seriesIndex}` as SeriesId;
}

function getRound1InitialTeams(season?: string) {
  if (!season) return {} as Record<SeriesId, [string | null, string | null]>;

  const config = getPlayoffBracketConfig(season);
  const { eastR1, westR1 } = buildRound1Series(config);

  return {
    R1_E1: [eastR1[0]?.[0]?.code ?? null, eastR1[0]?.[1]?.code ?? null],
    R1_E2: [eastR1[1]?.[0]?.code ?? null, eastR1[1]?.[1]?.code ?? null],
    R1_E3: [eastR1[2]?.[0]?.code ?? null, eastR1[2]?.[1]?.code ?? null],
    R1_E4: [eastR1[3]?.[0]?.code ?? null, eastR1[3]?.[1]?.code ?? null],
    R1_W1: [westR1[0]?.[0]?.code ?? null, westR1[0]?.[1]?.code ?? null],
    R1_W2: [westR1[1]?.[0]?.code ?? null, westR1[1]?.[1]?.code ?? null],
    R1_W3: [westR1[2]?.[0]?.code ?? null, westR1[2]?.[1]?.code ?? null],
    R1_W4: [westR1[3]?.[0]?.code ?? null, westR1[3]?.[1]?.code ?? null],
  } as Record<SeriesId, [string | null, string | null]>;
}

function getSeriesMatchup(
  seriesId: SeriesId,
  state: BracketLike | undefined,
  round1InitialTeams: Record<SeriesId, [string | null, string | null]>
): [string | null, string | null] {
  if (seriesId.startsWith("R1_")) {
    return round1InitialTeams[seriesId] ?? [null, null];
  }

  const parents = SERIES_PARENTS[seriesId];
  if (!parents) return [null, null];

  const [parentA, parentB] = parents;

  const teamA = normalizeTeamId(state?.[parentA]?.winner || null) || null;
  const teamB = normalizeTeamId(state?.[parentB]?.winner || null) || null;

  return [teamA, teamB];
}

function getSeriesHitStatus(
  seriesId: SeriesId,
  bracket: BracketLike | undefined,
  results: BracketLike | undefined,
  round1InitialTeams: Record<SeriesId, [string | null, string | null]>
): BracketCardHitStatus {
  const predictedWinner = normalizeTeamId(bracket?.[seriesId]?.winner);
  const actualWinner = normalizeTeamId(results?.[seriesId]?.winner);

  if (!predictedWinner || !actualWinner) return "none";

  const [predTop, predBottom] = getSeriesMatchup(
    seriesId,
    bracket,
    round1InitialTeams
  );
  const [actualTop, actualBottom] = getSeriesMatchup(
    seriesId,
    results,
    round1InitialTeams
  );

  if (!sameMatchup(predTop, predBottom, actualTop, actualBottom)) {
    return "none";
  }

  if (predictedWinner !== actualWinner) {
    return "none";
  }

  const predictedGames = bracket?.[seriesId]?.games;
  const actualGames = results?.[seriesId]?.games;

  if (
    predictedGames != null &&
    actualGames != null &&
    Number(predictedGames) === Number(actualGames)
  ) {
    return "winnerAndGames";
  }

  return "winner";
}

function CardAt({
  x,
  y,
  teamId,
  wins,
  seed,
  side,
  league,
  hitStatus = "none",
}: {
  x: number;
  y: number;
  teamId?: string | null;
  wins?: number | string;
  seed?: number | string;
  side: "left" | "right";
  league: League;
  hitStatus?: BracketCardHitStatus;
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
        hitStatus={hitStatus}
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
  bracket,
  results,
  hitLegend,
  showGlassShell = true,
}: PlayoffFullBracketWebProps) {
  const round1InitialTeams = useMemo(() => getRound1InitialTeams(season), [season]);

  const seriesStatusMap = useMemo(() => {
    const map = {} as Record<SeriesId, BracketCardHitStatus>;

    for (const seriesId of ALL_SERIES_IDS) {
      map[seriesId] = getSeriesHitStatus(
        seriesId,
        bracket,
        results,
        round1InitialTeams
      );
    }

    return map;
  }, [bracket, results, round1InitialTeams]);

  function getCardHitStatus(
    seriesId: SeriesId,
    teamId?: string | null
  ): BracketCardHitStatus {
    const winner = normalizeTeamId(bracket?.[seriesId]?.winner);
    const slotCode = slotTeamIdToBracketCode(teamId);

    if (!winner || !slotCode) return "none";
    if (winner !== slotCode) return "none";

    return seriesStatusMap[seriesId] ?? "none";
  }

  const championHitStatus = useMemo<BracketCardHitStatus>(() => {
    const championCode = slotTeamIdToBracketCode(champion?.teamId);
    const predictedChampion = normalizeTeamId(bracket?.FINALS?.winner);

    if (!championCode || !predictedChampion) return "none";
    if (championCode !== predictedChampion) return "none";

    return seriesStatusMap.FINALS ?? "none";
  }, [champion?.teamId, bracket?.FINALS?.winner, seriesStatusMap]);

  return (
    <div
      className={[
        "relative mx-auto w-full max-w-[1200px] overflow-visible",
        showGlassShell ? PLAYOFF_BRACKET_PANEL : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative z-10 flex w-full flex-col items-center space-y-3 px-4 pt-6 sm:px-8 sm:pt-8">
        <PlayoffBracketWebHeader season={season} />
        {hitLegend ? (
          <PlayoffBracketHitLegend language={hitLegend.language} />
        ) : null}
      </div>

      <div
        className="relative z-10 mx-auto flex w-full justify-center pb-6 sm:pb-8"
        style={{
          width: "100%",
          minHeight: DESIGN_H + HEADER_BOTTOM_GAP,
        }}
      >
        <div
          className="relative"
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
            <ChampionCardWeb
              teamId={champion?.teamId}
              league={league}
              hitStatus={championHitStatus}
            />
          </div>

          {R1_Y.map((y, i) => {
            const item = getSafeItem(leftRound1, i);
            const seriesId = getSeriesIdFromRound1Index("left", i);

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(leftRound2, i);
            const seriesId = (["R2_E1", "R2_E2"][
              Math.floor(i / 2)
            ] ?? "R2_E1") as SeriesId;

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R3_Y.map((y, i) => {
            const item = getSafeItem(leftRound3, i);
            const seriesId = (["CF_E", "CF_E"][i] ?? "CF_E") as SeriesId;

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
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
                hitStatus={getCardHitStatus("FINALS", item.teamId)}
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
                hitStatus={getCardHitStatus("FINALS", item.teamId)}
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
            const seriesId = (["CF_W", "CF_W"][i] ?? "CF_W") as SeriesId;

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(rightRound2, i);
            const seriesId = (["R2_W1", "R2_W1", "R2_W2", "R2_W2"][
              i
            ] ?? "R2_W1") as SeriesId;

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R1_Y.map((y, i) => {
            const item = getSafeItem(rightRound1, i);
            const seriesId = getSeriesIdFromRound1Index("right", i);

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
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}