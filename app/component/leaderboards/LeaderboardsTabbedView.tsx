"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import BracketLeaderboardSection from "@/app/component/leaderboards/BracketLeaderboardSection";
import MonthlyLeaderboardSection from "@/app/component/leaderboards/MonthlyLeaderboardSection";
import RankingsCommunityPanel from "@/app/component/rankings/RankingsCommunityPanel";
import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { nameRajdhani } from "@/lib/fonts";
import { getLeaderboardLatestMonthKey } from "@/lib/time/zonedTime";
import { auth } from "@/lib/firebase";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export type LeaderboardsTab = "playoff" | "groups" | "bracket" | "leaderboard";

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

type Props = {
  variant: "web" | "mobile";
};

export default function LeaderboardsTabbedView({ variant }: Props) {
  const [tab, setTab] = useState<LeaderboardsTab>("playoff");
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  const latestMonth = useMemo(() => getLeaderboardLatestMonthKey(), []);
  const [month, setMonth] = useState<string>(latestMonth);
  const season = useMemo(() => getCurrentPlayoffSeason(), []);
  const { language } = useUserLanguage(uid);

  const disableNextMonth = month >= latestMonth;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const TABS: Array<{ key: LeaderboardsTab; label: string }> = [
    { key: "playoff", label: "Playoff" },
    { key: "groups", label: "Group" },
    { key: "bracket", label: "Bracket" },
    { key: "leaderboard", label: "Leaderboard" },
  ];

  const isWeb = variant === "web";

  return (
    <>
      <div
        className={[
          "border-b border-white/10",
          isWeb ? "" : "px-4 pt-3",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-stretch overflow-x-auto",
            isWeb ? "" : "scrollbar-none",
          ].join(" ")}
        >
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={[
                  nameRajdhani.className,
                  "relative flex shrink-0 items-center whitespace-nowrap font-medium leading-none tracking-[0.06em] transition",
                  isWeb
                    ? "h-14 px-4 text-[18px] mr-10 last:mr-0"
                    : "h-12 px-3 text-[15px] mr-8 last:mr-0",
                  active ? "text-white" : "text-white/42",
                ].join(" ")}
              >
                {item.label}
                <span
                  className={[
                    "pointer-events-none absolute bottom-0 h-[2px] rounded-full transition-all",
                    isWeb ? "left-4" : "left-3",
                    active
                      ? isWeb
                        ? "w-[calc(100%-32px)] bg-white"
                        : "w-[calc(100%-24px)] bg-white"
                      : "w-0 bg-transparent",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className={isWeb ? "pt-6" : undefined}>
        <div className={tab === "groups" ? undefined : "hidden"}>
          <RankingsCommunityPanel
            language={language}
            variant={variant}
            active={tab === "groups"}
            onNavigateToGroupsTab={() => setTab("groups")}
          />
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
        ) : tab === "playoff" ? (
          <div className={isWeb ? "mx-auto max-w-5xl" : "px-3"}>
            <div className={isWeb ? undefined : "mx-auto max-w-md"}>
              <PlayoffBracketMarket season={season} />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
