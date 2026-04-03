"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { League } from "@/lib/leagues";
import type { SeriesId } from "@/lib/playoff-bracket";
import type { TeamSlot } from "@/lib/playoff-bracket-display";
import { slotTeamIdToBracketCode } from "@/lib/playoff-bracket-display";
import BracketCard, {
  type BracketCardHitStatus,
} from "@/app/component/predict/shared/BracketCardMobile";
import ChampionCard from "@/app/component/predict/shared/ChampionCardMobile";
import { PLAYOFF_BRACKET_PANEL } from "@/lib/ui/matchOverlayGlass";
import PlayoffBracketHeader from "@/app/component/predict/shared/PlayoffBracketMobileHeader";
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

export type PlayoffFullBracketProps = {
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
  hitLegend?: { language: Language };
  /** false ＝外枠のガラスパネルなし（オーバーレイ内など） */
  showGlassShell?: boolean;
};

const SCALE = 0.375;

const CARD_W = 160 * SCALE;
const CARD_H = 72 * SCALE;

const DESIGN_W = 504;
const DESIGN_H = 289;
/** Pull bracket up under header only when there is no hit legend (legend sits above and must not overlap). */
const BRACKET_OFFSET_Y = -36;
const BRACKET_OFFSET_Y_WITH_LEGEND = 4;
/** 下端のカード・スコアが丸み背景内で切れないようデザイン座標で余白を足す */
const MOBILE_BRACKET_BOTTOM_SLACK = 64;

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
  return String(v ?? "").trim().toUpperCase();
}

function getSafeItem(list: TeamSlot[] | undefined, index: number): TeamSlot {
  return list?.[index] ?? { teamId: null, wins: "" };
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
  side,
  league,
  hitStatus = "none",
}: {
  x: number;
  y: number;
  teamId?: string | null;
  wins?: number | string;
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
      <BracketCard
        teamId={teamId}
        wins={wins}
        side={side}
        league={league}
        hitStatus={hitStatus}
      />
    </div>
  );
}

export default function PlayoffFullBracketMobile({
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

  const bracketOffsetY = hitLegend ? BRACKET_OFFSET_Y_WITH_LEGEND : BRACKET_OFFSET_Y;

  /** 正の top オフセット＋下端余白でクリップを防ぐ */
  const scaledHeight =
    (DESIGN_H +
      MOBILE_BRACKET_BOTTOM_SLACK +
      Math.max(0, bracketOffsetY)) *
    viewScale;

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
      ref={wrapRef}
      className={[
        "relative w-full overflow-visible",
        showGlassShell ? PLAYOFF_BRACKET_PANEL : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative z-20 flex w-full flex-col items-center space-y-2 px-2 pb-1 pt-4">
        <PlayoffBracketHeader season={season} />
        {hitLegend ? (
          <PlayoffBracketHitLegend
            language={hitLegend.language}
            className="px-0.5"
            compact
          />
        ) : null}
      </div>

      <div
        className="relative z-10 mx-auto mt-1 flex w-full justify-center pb-4"
        style={{
          width: "100%",
          minHeight: scaledHeight,
          overflow: "visible",
        }}
      >
        <div
          className="absolute left-0"
          style={{
            top: bracketOffsetY * viewScale,
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
            <ChampionCard
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
                side="left"
                league={league}
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(leftRound2, i);
            const seriesId = (i < 2 ? "R2_E1" : "R2_E2") as SeriesId;

            return (
              <CardAt
                key={`left-r2-${i}`}
                x={COL_X.leftR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="left"
                league={league}
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R3_Y.map((y, i) => {
            const item = getSafeItem(leftRound3, i);
            const seriesId = "CF_E" as SeriesId;

            return (
              <CardAt
                key={`left-r3-${i}`}
                x={COL_X.leftR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="left"
                league={league}
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
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
            hitStatus={getCardHitStatus(
              "FINALS",
              getSafeItem(leftRound4, 0).teamId
            )}
          />

          <CardAt
            x={COL_X.center}
            y={CENTER_BOTTOM_Y}
            teamId={getSafeItem(rightRound4, 0).teamId}
            wins={getSafeItem(rightRound4, 0).wins}
            side="right"
            league={league}
            hitStatus={getCardHitStatus(
              "FINALS",
              getSafeItem(rightRound4, 0).teamId
            )}
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
            const seriesId = "CF_W" as SeriesId;

            return (
              <CardAt
                key={`right-r3-${i}`}
                x={COL_X.rightR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                side="right"
                league={league}
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(rightRound2, i);
            const seriesId = (i < 2 ? "R2_W1" : "R2_W2") as SeriesId;

            return (
              <CardAt
                key={`right-r2-${i}`}
                x={COL_X.rightR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
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
                side="right"
                league={league}
                hitStatus={getCardHitStatus(seriesId, item.teamId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}