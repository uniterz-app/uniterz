"use client";

import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";

type Props = {
  gamesPickCounts: Record<string, number>;
};

function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
}

const GAMES = [4, 5, 6, 7];

export default function PlayoffBracketSeriesGamesTab({
  gamesPickCounts,
}: Props) {
  const total = Object.values(gamesPickCounts).reduce(
    (a, b) => a + Number(b ?? 0),
    0
  );

  return (
    <div className="mt-4 space-y-2">
      {GAMES.map((g, i) => {
        const v = Number(gamesPickCounts[String(g)] ?? 0);
        const p = percent(v, total);

        return (
          <div key={g}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/70">{g} games</span>
              <span className="text-white/80">
                {total > 0 ? `${p}%` : "--"}
              </span>
            </div>

            <div className="flex items-center">
              <ResultStatRatingBar
                ratio={total > 0 ? p / 100 : 0}
                animateMs={520}
                delayMs={i * 140}
                size="sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
