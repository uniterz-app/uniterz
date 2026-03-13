"use client";

import type { SeriesId } from "@/lib/playoff-bracket";

type Team = {
  code: string;
  seed: number;
};

type Props = {
  seriesId: SeriesId;
  teams: [Team, Team];
  winner?: string;
  games?: number;
  disabled?: boolean;
  cardHeight?: number;
  cardPaddingY?: number;
  rowGap?: number;
  onSelectWinner: (seriesId: SeriesId, teamCode: string) => void;
  onSelectGames: (seriesId: SeriesId, games: number) => void;
};

export default function PlayoffSeriesCard({
  seriesId,
  teams,
  winner,
  games,
  disabled = false,
  cardHeight = 116,
  cardPaddingY = 10,
  rowGap = 6,
  onSelectWinner,
  onSelectGames,
}: Props) {
  const rowH = (cardHeight - cardPaddingY * 2 - rowGap) / 2;

  return (
    <div
      className="w-full rounded-[16px] border border-white/10 bg-[#0d1015] px-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
      style={{
        height: cardHeight,
        paddingTop: cardPaddingY,
        paddingBottom: cardPaddingY,
        opacity: disabled ? 0.72 : 1,
      }}
    >
      <div className="grid h-full grid-cols-[1fr_76px] gap-2.5">
        <div className="flex flex-col" style={{ gap: `${rowGap}px` }}>
          {teams.map((team) => {
            const isWinner = winner === team.code;

            return (
              <button
                key={team.code}
                type="button"
                disabled={disabled}
                onClick={() => onSelectWinner(seriesId, team.code)}
                className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 text-left transition ${
                  isWinner ? "bg-[#1f6feb]/18" : ""
                } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={{ height: rowH }}
              >
                <div className="w-3.5 shrink-0 text-[10px] font-medium leading-none text-white/50">
                  {team.seed}
                </div>

                <div className="text-[16px] font-medium leading-none tracking-tight text-white">
                  {team.code}
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="grid grid-cols-2 gap-1.5"
          style={{ gridTemplateRows: `repeat(2, ${rowH}px)` }}
        >
          {[4, 5, 6, 7].map((g) => {
            const selected = games === g;

            return (
              <button
                key={g}
                type="button"
                disabled={disabled}
                onClick={() => onSelectGames(seriesId, g)}
                className={`rounded-lg border text-[11px] font-semibold leading-none transition ${
                  selected
                    ? "border-[#1f6feb]/35 bg-[#1f6feb]/18 text-white"
                    : "border-white/10 bg-[#0b0d10] text-white/70"
                } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}