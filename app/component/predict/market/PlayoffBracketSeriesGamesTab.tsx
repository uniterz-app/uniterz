"use client";

import { useEffect, useState } from "react";

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
  const [animate, setAnimate] = useState(false);

  const total = Object.values(gamesPickCounts).reduce(
    (a, b) => a + Number(b ?? 0),
    0
  );

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 40);
    return () => clearTimeout(t);
  }, []);

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

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-2 rounded-full transition-all ease-out"
                style={{
                  width: animate ? `${p}%` : "0%",
                  transitionDuration: "1400ms",
                  transitionDelay: `${i * 180}ms`,
                  background:
                    "linear-gradient(90deg,#60a5fa 0%,#3b82f6 55%,#1d4ed8 100%)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}