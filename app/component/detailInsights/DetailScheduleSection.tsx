"use client";

import type { TeamScheduleDifficulty } from "@/lib/nba/detailInsights/detailInsightTypes";
import type { NbaTeamUpcomingGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  scheduleDifficultyTierColor,
  scheduleDifficultyTierLabel,
} from "@/lib/nba/detailInsights/buildScheduleDifficulty";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

type Props = {
  upcomingGames: NbaTeamUpcomingGame[];
  scheduleDifficulty: TeamScheduleDifficulty | null;
  accent: string;
  isJa: boolean;
  sectionTitle?: string;
};

export function DetailScheduleSection({
  upcomingGames,
  scheduleDifficulty,
  accent,
  isJa,
  sectionTitle = "UPCOMING",
}: Props) {
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const emptyCopy = isJa ? "データがありません" : "No data yet";

  if (!upcomingGames.length) {
    return (
      <section className="space-y-2.5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {sectionTitle}
        </h2>
        <div
          className="overflow-hidden border bg-black/40 px-3 py-2.5 text-[12px] font-bold text-white/45"
          style={{ borderColor: frame }}
        >
          {emptyCopy}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2.5">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
        {sectionTitle}
      </h2>
      {scheduleDifficulty ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-semibold text-white/72">
            {isJa
              ? scheduleDifficulty.summaryJa
              : scheduleDifficulty.summaryEn}
          </p>
          <span
            className="rounded px-2 py-0.5 text-[9px] font-extrabold tracking-wide"
            style={{
              color: scheduleDifficultyTierColor(scheduleDifficulty.overallTier),
              border: `1px solid ${scheduleDifficultyTierColor(scheduleDifficulty.overallTier)}88`,
            }}
          >
            {scheduleDifficultyTierLabel(scheduleDifficulty.overallTier, isJa)}
          </span>
        </div>
      ) : null}
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: frame }}
      >
        {upcomingGames.map((game, i) => (
          <div
            key={`${game.dateLabel}-${game.oppAbbr}-${i}`}
            className="flex items-center gap-1.5 px-2.5 py-2.5"
            style={
              i < upcomingGames.length - 1
                ? { borderBottom: `1px solid ${line}` }
                : undefined
            }
          >
            <span className="w-11 shrink-0 text-[13px] text-white/40">
              {game.dateLabel}
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
              {game.home ? "vs" : "@"} {game.oppAbbr}
              {game.conferenceGame ? (
                <span className="text-white/45"> · CONF</span>
              ) : null}
            </span>
            <span className="shrink-0 text-[14px] font-bold text-white/85">
              {game.tipLabel}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
