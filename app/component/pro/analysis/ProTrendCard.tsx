"use client";

import { useState } from "react";
import TrendTabs from "./TrendTabs";
import DailyTrendCard from "./DailyTrendCard";
import MonthlyTrendChart from "./MonthlyTrendChart";

type DailyTrendStat = {
  date: string;
  posts: number;
  winRate: number;
  accuracy: number;
  scorePrecision: number;
};

type MonthlyTrendStat = {
  month: string;
  posts: number;
  winRate: number;
  accuracy: number;
  avgPrecision: number;
  avgUpset: number;
};

type Props = {
  daily: DailyTrendStat[];
  monthly: MonthlyTrendStat[];
};

export default function ProTrendCard({ daily, monthly }: Props) {
  const [tab, setTab] = useState<"day" | "month">("day");

  return (
    <div className="space-y-2">
      <TrendTabs value={tab} onChange={setTab} />

      {tab === "day" ? (
        <DailyTrendCard data={daily} />
      ) : (
        <MonthlyTrendChart data={monthly} />
      )}
    </div>
  );
}
