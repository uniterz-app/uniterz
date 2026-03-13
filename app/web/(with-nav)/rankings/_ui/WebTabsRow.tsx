"use client";

import type { LeagueTab, Period } from "@/lib/rankings/types";
import { jp } from "@/app/mobile/(with-nav)/rankings/fonts";

export default function WebTabsRow(props: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const { league, setLeague, period, setPeriod } = props;

  const PERIODS: Period[] = ["day", "week", "month"];
  const PERIOD_LABEL: Record<Period, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
  };

  const LeagueTabBtn = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm backdrop-blur-md transition-colors",
        active
          ? "border-cyan-200/25 bg-white/10 font-extrabold text-white shadow-[0_0_18px_rgba(0,255,255,0.10)]"
          : "border-white/10 bg-white/5 text-white/70",
        jp.className,
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <LeagueTabBtn
          label="NBA"
          active={league === "nba"}
          onClick={() => setLeague("nba")}
        />
        <LeagueTabBtn
          label="B1"
          active={league === "b1"}
          onClick={() => setLeague("b1")}
        />
      </div>

      <button
        onClick={() => {
          const idx = PERIODS.indexOf(period);
          setPeriod(PERIODS[(idx + 1) % PERIODS.length]);
        }}
        className={[
          "rounded-xl px-5 py-2",
          "border border-white/15 bg-white/8",
          "text-base font-black text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
          "backdrop-blur-md transition active:scale-95",
          jp.className,
        ].join(" ")}
      >
        {PERIOD_LABEL[period]}
      </button>
    </div>
  );
}