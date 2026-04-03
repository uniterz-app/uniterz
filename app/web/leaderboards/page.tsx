"use client";

import { useMemo, useState } from "react";
import BracketLeaderboardSection from "@/app/component/leaderboards/BracketLeaderboardSection";
import MonthlyLeaderboardSection from "@/app/component/leaderboards/MonthlyLeaderboardSection";
import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { nameRajdhani } from "@/lib/fonts";
import { getLeaderboardLatestMonthKey } from "@/lib/time/zonedTime";

type LeaderboardsTab = "playoff" | "bracket" | "leaderboard";

function shiftMonth(month: string, delta: number) {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  const next = new Date(year, monthIndex + delta, 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
}

const TABS: Array<{
  key: LeaderboardsTab;
  label: string;
}> = [
  { key: "playoff", label: "Playoff" },
  { key: "bracket", label: "Bracket" },
  { key: "leaderboard", label: "Leaderboard" },
];

export default function WebLeaderboardsPage() {
  const [tab, setTab] = useState<LeaderboardsTab>("playoff");

  const latestMonth = useMemo(() => getLeaderboardLatestMonthKey(), []);
  const [month, setMonth] = useState<string>(latestMonth);
  const season = useMemo(() => getCurrentPlayoffSeason(), []);

  const disableNextMonth = month >= latestMonth;

  return (
    <div className="min-h-dvh bg-app text-white">
      <main className="mx-auto w-full max-w-7xl px-6 pb-bottom-nav pt-6 lg:px-10">
        <div className="border-b border-white/10">
          <div className="flex overflow-x-auto">
            {TABS.map((item) => {
              const active = tab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={[
                    nameRajdhani.className,
                    "relative shrink-0 whitespace-nowrap px-4 pb-4 pt-2 text-[18px] font-medium tracking-[0.06em] transition",
                    "mr-10 last:mr-0",
                    active ? "text-white" : "text-white/42",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "pointer-events-none absolute bottom-0 left-4 h-[2px] rounded-full transition-all",
                      active ? "w-[calc(100%-32px)] bg-white" : "w-0 bg-transparent",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          {tab === "leaderboard" ? (
            <MonthlyLeaderboardSection
              league="nba"
              month={month}
              title="Leaderboard"
              onPrevMonth={() => setMonth((prev) => shiftMonth(prev, -1))}
              onNextMonth={() => {
                if (disableNextMonth) return;
                setMonth((prev) => shiftMonth(prev, 1));
              }}
              disableNextMonth={disableNextMonth}
            />
          ) : tab === "bracket" ? (
            <BracketLeaderboardSection season={season} />
          ) : (
            <div className="mx-auto max-w-5xl">
              <PlayoffBracketMarket season={season} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}