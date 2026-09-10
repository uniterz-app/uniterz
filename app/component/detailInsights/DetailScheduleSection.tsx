"use client";

import type { TeamScheduleDifficulty } from "@/lib/nba/detailInsights/detailInsightTypes";
import type { NbaTeamUpcomingGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  scheduleDifficultySummaryText,
  scheduleDifficultyTierColor,
  scheduleDifficultyTierLabel,
} from "@/lib/nba/detailInsights/buildScheduleDifficulty";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  compactNbaCardNickname,
  getNbaTeamNicknameById,
} from "@/lib/nba-team-names";

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

function upcomingOppLabel(game: NbaTeamUpcomingGame): string {
  const nick = getNbaTeamNicknameById(game.oppTeamId);
  return compactNbaCardNickname(nick || game.oppAbbr, game.oppTeamId);
}

type Props = {
  upcomingGames: NbaTeamUpcomingGame[];
  scheduleDifficulty: TeamScheduleDifficulty | null;
  accent: string;
  isJa: boolean;
  /** 7言語コピー用。未指定なら isJa にフォールバック */
  language?: string;
  sectionTitle?: string;
};

export function DetailScheduleSection({
  upcomingGames,
  scheduleDifficulty,
  accent,
  isJa,
  language,
  sectionTitle = "UPCOMING",
}: Props) {
  const lang = resolveLocalizedLang(language ?? (isJa ? "ja" : "en"));
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
            {scheduleDifficultySummaryText(scheduleDifficulty, lang)}
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
            key={`${game.dateLabel}-${game.oppTeamId}-${i}`}
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
            <span
              className="min-w-0 flex-1 truncate text-[14px] font-bold uppercase"
              style={{ transform: "skewX(-10deg)" }}
            >
              <span style={{ display: "inline-block", transform: "skewX(4deg)" }}>
                {game.home ? "vs" : "@"} {upcomingOppLabel(game)}
                {game.conferenceGame ? (
                  <span className="text-white/45"> · CONF</span>
                ) : null}
              </span>
            </span>
            <span
              className="shrink-0 text-[14px] font-bold text-white/85"
              style={{ transform: "skewX(-10deg)" }}
            >
              <span style={{ display: "inline-block", transform: "skewX(4deg)" }}>
                {game.tipLabel}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
