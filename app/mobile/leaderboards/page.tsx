"use client";

import { useMemo, useState } from "react";
import BracketLeaderboardSection from "@/app/component/leaderboards/BracketLeaderboardSection";
import MonthlyLeaderboardSection from "@/app/component/leaderboards/MonthlyLeaderboardSection";
import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { nameRajdhani } from "@/lib/fonts";

type LeaderboardsTab = "playoff" | "bracket" | "leaderboard";

function getLastMonthJst() {
  const now = new Date();
  const jstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );

  const year = jstNow.getFullYear();
  const month = jstNow.getMonth();

  const lastMonthDate = new Date(year, month - 1, 1);
  const y = lastMonthDate.getFullYear();
  const m = String(lastMonthDate.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
}

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

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<LeaderboardsTab>("playoff");

  const latestMonth = useMemo(() => getLastMonthJst(), []);
  const [month, setMonth] = useState<string>(latestMonth);
  const season = useMemo(() => getCurrentPlayoffSeason(), []);

  const disableNextMonth = month >= latestMonth;

  return (
    <div className="min-h-dvh bg-app">
      <main className="pb-bottom-nav">
        <div className="border-b border-white/10 px-4 pt-3">
          <div className="scrollbar-none flex overflow-x-auto">
            {TABS.map((item) => {
              const active = tab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={[
                    nameRajdhani.className,
                    "relative shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-[15px] font-medium tracking-[0.06em] transition",
                    "mr-8 last:mr-0",
                    active ? "text-white" : "text-white/42",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "pointer-events-none absolute bottom-0 left-3 h-[2px] rounded-full transition-all",
                      active ? "w-[calc(100%-24px)] bg-white" : "w-0 bg-transparent",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>

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
          <div className="px-3">
            <div className="mx-auto max-w-md">
              <PlayoffBracketMarket season={season} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}