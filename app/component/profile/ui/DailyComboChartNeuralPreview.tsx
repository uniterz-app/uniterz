"use client";

/**
 * Dev プレビュー用ラッパー（モックデータ付き）
 */

import { useMemo } from "react";
import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { ProfileDailyTrendPoint } from "./ProfileDailyTrendChart";
import ProfileDailyComboChartNeural from "./ProfileDailyComboChartNeural";

function makeMockDailyRows(): ProfileDailyTrendPoint[] {
  const base = new Date("2026-06-01T12:00:00+09:00");
  const pattern = [
    { posts: 3, wins: 2, pointsV3: 18.4, scorePrecision: 6.2, upsetPoints: 2.1 },
    { posts: 5, wins: 4, pointsV3: 24.0, scorePrecision: 8.5, upsetPoints: 0 },
    { posts: 2, wins: 1, pointsV3: 9.5, scorePrecision: 3.0, upsetPoints: 1.0 },
    { posts: 6, wins: 5, pointsV3: 31.2, scorePrecision: 11.4, upsetPoints: 4.5 },
    { posts: 4, wins: 3, pointsV3: 16.8, scorePrecision: 5.6, upsetPoints: 0.8 },
    { posts: 7, wins: 6, pointsV3: 38.5, scorePrecision: 14.2, upsetPoints: 3.2 },
    { posts: 3, wins: 2, pointsV3: 12.0, scorePrecision: 4.1, upsetPoints: 0 },
    { posts: 5, wins: 4, pointsV3: 22.6, scorePrecision: 7.8, upsetPoints: 2.4 },
    { posts: 8, wins: 7, pointsV3: 42.0, scorePrecision: 15.5, upsetPoints: 5.0 },
    { posts: 4, wins: 3, pointsV3: 19.3, scorePrecision: 6.9, upsetPoints: 1.2 },
  ];

  return pattern.map((row, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return { date: `${y}-${m}-${day}`, ...row };
  });
}

type Props = {
  data?: ProfileDailyTrendPoint[];
  language?: Language;
  rankingLeague?: RankingLeagueSource;
};

export default function DailyComboChartNeuralPreview({
  data,
  language = "ja",
  rankingLeague = "nba",
}: Props) {
  const rows = useMemo(
    () => (Array.isArray(data) && data.length > 0 ? data : makeMockDailyRows()),
    [data]
  );

  return (
    <ProfileDailyComboChartNeural
      data={rows}
      language={language}
      rankingLeague={rankingLeague}
    />
  );
}
