"use client";

import { Crown } from "lucide-react";
import PlayoffSeriesCard from "@/app/component/predict/PlayoffSeriesCard";
import type { SeriesId } from "@/lib/playoff-bracket";
import type { BracketState } from "@/lib/playoff-bracket-firestore";

type Team = {
  code: string;
  seed: number;
};

type SeriesDef = {
  id: SeriesId;
  teams: [Team, Team];
};

type Props = {
  bracket: BracketState;

  eastR1: SeriesDef[];
  westR1: SeriesDef[];

  eastR2Top: [Team, Team] | null;
  eastR2Bottom: [Team, Team] | null;
  westR2Top: [Team, Team] | null;
  westR2Bottom: [Team, Team] | null;
  eastCF: [Team, Team] | null;
  westCF: [Team, Team] | null;
  finalsTeams: [Team, Team] | null;

  showR2E1: boolean;
  showR2E2: boolean;
  showR2W1: boolean;
  showR2W2: boolean;
  showCFE: boolean;
  showCFW: boolean;
  showFinals: boolean;

  isComplete: boolean;
  hasSubmittedBracket: boolean;
  savedBracketLoading: boolean;
  canEditBracket: boolean;

  onSelectWinner: (seriesId: SeriesId, teamCode: string) => void;
  onSelectGames: (seriesId: SeriesId, games: number) => void;
  onSubmitClick: () => void;
};

const CARD_H = 116;
const CARD_PY = 10;
const ROW_GAP = 6;
const CARD_W = 230;

const R1_CARD_GAP = 14;
const ROUND_GAP_X = 56;
const FINALS_GAP_X = 88;

const LABEL_SPACE_Y = 132;
const LABEL_TOP_Y = 48;
const CHAMPION_CARD_H = 40;

const Y_R1 = [
  0,
  CARD_H + R1_CARD_GAP,
  (CARD_H + R1_CARD_GAP) * 2,
  (CARD_H + R1_CARD_GAP) * 3,
] as const;

const Y_R2_TOP =
  (Y_R1[0] + CARD_H / 2 + (Y_R1[1] + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_R2_BOTTOM =
  (Y_R1[2] + CARD_H / 2 + (Y_R1[3] + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_CF =
  (Y_R2_TOP + CARD_H / 2 + (Y_R2_BOTTOM + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_FINALS = Y_CF;

const LEFT_R1_X = 0;
const LEFT_R2_X = LEFT_R1_X + CARD_W + ROUND_GAP_X;
const LEFT_CF_X = LEFT_R2_X + CARD_W + ROUND_GAP_X;
const FINALS_X = LEFT_CF_X + CARD_W + FINALS_GAP_X;
const RIGHT_CF_X = FINALS_X + CARD_W + FINALS_GAP_X;
const RIGHT_R2_X = RIGHT_CF_X + CARD_W + ROUND_GAP_X;
const RIGHT_R1_X = RIGHT_R2_X + CARD_W + ROUND_GAP_X;

const CANVAS_W = RIGHT_R1_X + CARD_W;
const BRACKET_H = Y_R1[3] + CARD_H;
const CANVAS_H = BRACKET_H + LABEL_SPACE_Y;

function buildRightBracketPath(
  startX: number,
  endX: number,
  yTop: number,
  yBottom: number,
  cardH = CARD_H,
  inset = 26
) {
  const start1Y = yTop + cardH / 2;
  const start2Y = yBottom + cardH / 2;
  const endY = (start1Y + start2Y) / 2;
  const midX = startX + inset;

  return `
    M ${startX} ${start1Y}
    H ${midX}
    V ${endY}
    H ${endX}
    M ${startX} ${start2Y}
    H ${midX}
    V ${endY}
    H ${endX}
  `;
}

function buildLeftBracketPath(
  startX: number,
  endX: number,
  yTop: number,
  yBottom: number,
  cardH = CARD_H,
  inset = 26
) {
  const start1Y = yTop + cardH / 2;
  const start2Y = yBottom + cardH / 2;
  const endY = (start1Y + start2Y) / 2;
  const midX = startX - inset;

  return `
    M ${startX} ${start1Y}
    H ${midX}
    V ${endY}
    H ${endX}
    M ${startX} ${start2Y}
    H ${midX}
    V ${endY}
    H ${endX}
  `;
}

function buildSingleRightPath(startX: number, endX: number, y: number) {
  return `M ${startX} ${y} H ${endX}`;
}

function buildSingleLeftPath(startX: number, endX: number, y: number) {
  return `M ${startX} ${y} H ${endX}`;
}

export default function PlayoffBracketBoard({
  bracket,
  eastR1,
  westR1,
  eastR2Top,
  eastR2Bottom,
  westR2Top,
  westR2Bottom,
  eastCF,
  westCF,
  finalsTeams,
  showR2E1,
  showR2E2,
  showR2W1,
  showR2W2,
  showCFE,
  showCFW,
  showFinals,
  isComplete,
  hasSubmittedBracket,
  savedBracketLoading,
  canEditBracket,
  onSelectWinner,
  onSelectGames,
  onSubmitClick,
}: Props) {
  const champion = bracket["FINALS"]?.winner;

  function renderSeriesCard(seriesId: SeriesId, teams: [Team, Team]) {
    return (
      <PlayoffSeriesCard
        seriesId={seriesId}
        teams={teams}
        winner={bracket[seriesId]?.winner}
        games={bracket[seriesId]?.games}
        disabled={!canEditBracket}
        cardHeight={CARD_H}
        cardPaddingY={CARD_PY}
        rowGap={ROW_GAP}
        onSelectWinner={onSelectWinner}
        onSelectGames={onSelectGames}
      />
    );
  }

function renderAnimatedCard(
  teams: [Team, Team] | null,
  seriesId: SeriesId,
  show: boolean,
  direction: "left" | "right"
) {
    const x = direction === "right" ? 18 : -18;

    return (
      <div
        className="transition-all duration-500 ease-out"
        style={{
          width: CARD_W,
          height: CARD_H,
          opacity: teams ? (show ? 1 : 0) : 0,
          transform: teams
            ? show
              ? "translateX(0px) scale(1)"
              : `translateX(${x}px) scale(0.985)`
            : `translateX(${x}px) scale(0.985)`,
          pointerEvents: teams ? "auto" : "none",
        }}
      >
        {teams ? renderSeriesCard(seriesId, teams) : null}
      </div>
    );
  }

  function renderRoundHeader(left: number, title: string, winnerPts: string) {
    return (
      <div
        className="absolute z-20 text-center"
        style={{
          left,
          top: LABEL_TOP_Y,
          width: CARD_W,
          pointerEvents: "none",
        }}
      >
        <div className="text-[13px] font-semibold leading-none tracking-[0.02em] text-white/82">
          {title}
        </div>
        <div className="mt-1 text-[11px] font-medium leading-none text-white/70">
          Winner {winnerPts}
        </div>
        <div className="mt-1 text-[11px] font-medium leading-none text-white/52">
          Games exact +2 pts
        </div>
      </div>
    );
  }

  function renderChampionCard() {
    if (!champion) return null;

    return (
      <div
        className="absolute z-30"
        style={{
          left: FINALS_X,
          top: LABEL_SPACE_Y + Y_FINALS - CHAMPION_CARD_H - 10,
          width: CARD_W,
          height: CHAMPION_CARD_H,
          pointerEvents: "none",
        }}
      >
        <div className="flex h-full w-full items-center justify-between rounded-[14px] border border-yellow-400/80 bg-[#1a1506] px-3 shadow-[0_0_0_1px_rgba(31,111,235,0.12)]">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-yellow-400">
            <Crown size={12} />
            Champion
          </div>
          <div className="text-[18px] font-semibold leading-none tracking-tight text-yellow-300">
            {champion}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto px-3 pt-5 pb-5">
      <div
        className="mb-3 flex items-center justify-end"
        style={{ width: CANVAS_W }}
      >
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/78">
          Total 100 pts
        </div>
      </div>

      <div
        className="relative"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 z-0"
          style={{ top: LABEL_SPACE_Y }}
          width={CANVAS_W}
          height={BRACKET_H}
          viewBox={`0 0 ${CANVAS_W} ${BRACKET_H}`}
          fill="none"
        >
          <path
            d={buildRightBracketPath(
              LEFT_R1_X + CARD_W,
              LEFT_R2_X,
              Y_R1[0],
              Y_R1[1]
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildRightBracketPath(
              LEFT_R1_X + CARD_W,
              LEFT_R2_X,
              Y_R1[2],
              Y_R1[3]
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildRightBracketPath(
              LEFT_R2_X + CARD_W,
              LEFT_CF_X,
              Y_R2_TOP,
              Y_R2_BOTTOM
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildSingleRightPath(
              LEFT_CF_X + CARD_W,
              FINALS_X,
              Y_CF + CARD_H / 2
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />

          <path
            d={buildLeftBracketPath(
              RIGHT_R1_X,
              RIGHT_R2_X + CARD_W,
              Y_R1[0],
              Y_R1[1]
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildLeftBracketPath(
              RIGHT_R1_X,
              RIGHT_R2_X + CARD_W,
              Y_R1[2],
              Y_R1[3]
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildLeftBracketPath(
              RIGHT_R2_X,
              RIGHT_CF_X + CARD_W,
              Y_R2_TOP,
              Y_R2_BOTTOM
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={buildSingleLeftPath(
              RIGHT_CF_X,
              FINALS_X + CARD_W,
              Y_CF + CARD_H / 2
            )}
            stroke="#1f6feb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
        </svg>

        {renderChampionCard()}

        {isComplete && !hasSubmittedBracket && !savedBracketLoading && (
          <div
            className="absolute z-30 flex justify-center"
            style={{
              left: FINALS_X,
              top: LABEL_SPACE_Y + Y_FINALS + CARD_H + 14,
              width: CARD_W,
            }}
          >
            <button
              onClick={onSubmitClick}
              className="rounded-xl bg-[#163a5f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d4c78]"
            >
              Submit Bracket
            </button>
          </div>
        )}

        {renderRoundHeader(LEFT_R1_X, "1st Round", "4 pts")}
        {renderRoundHeader(LEFT_R2_X, "Conference Semifinals", "5 pts")}
        {renderRoundHeader(LEFT_CF_X, "Conference Finals", "6 pts")}
        {renderRoundHeader(FINALS_X, "NBA Finals", "6 pts")}
        {renderRoundHeader(RIGHT_CF_X, "Conference Finals", "6 pts")}
        {renderRoundHeader(RIGHT_R2_X, "Conference Semifinals", "5 pts")}
        {renderRoundHeader(RIGHT_R1_X, "1st Round", "4 pts")}

        {eastR1.map((series, idx) => (
          <div
            key={series.id}
            className="absolute z-10"
            style={{
              left: LEFT_R1_X,
              top: LABEL_SPACE_Y + Y_R1[idx],
              width: CARD_W,
            }}
          >
            {renderSeriesCard(series.id, series.teams)}
          </div>
        ))}

        <div
          className="absolute z-10"
          style={{
            left: LEFT_R2_X,
            top: LABEL_SPACE_Y + Y_R2_TOP,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(eastR2Top, "R2_E1", showR2E1, "right")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: LEFT_R2_X,
            top: LABEL_SPACE_Y + Y_R2_BOTTOM,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(eastR2Bottom, "R2_E2", showR2E2, "right")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: LEFT_CF_X,
            top: LABEL_SPACE_Y + Y_CF,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(eastCF, "CF_E", showCFE, "right")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: FINALS_X,
            top: LABEL_SPACE_Y + Y_FINALS,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(finalsTeams, "FINALS", showFinals, "right")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: RIGHT_CF_X,
            top: LABEL_SPACE_Y + Y_CF,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(westCF, "CF_W", showCFW, "left")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: RIGHT_R2_X,
            top: LABEL_SPACE_Y + Y_R2_TOP,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(westR2Top, "R2_W1", showR2W1, "left")}
        </div>

        <div
          className="absolute z-10"
          style={{
            left: RIGHT_R2_X,
            top: LABEL_SPACE_Y + Y_R2_BOTTOM,
            width: CARD_W,
          }}
        >
          {renderAnimatedCard(westR2Bottom, "R2_W2", showR2W2, "left")}
        </div>

        {westR1.map((series, idx) => (
          <div
            key={series.id}
            className="absolute z-10"
            style={{
              left: RIGHT_R1_X,
              top: LABEL_SPACE_Y + Y_R1[idx],
              width: CARD_W,
            }}
          >
            {renderSeriesCard(series.id, series.teams)}
          </div>
        ))}
      </div>
    </div>
  );
}