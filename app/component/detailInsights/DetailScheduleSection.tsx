"use client";

import type { TeamScheduleDifficulty } from "@/lib/nba/detailInsights/detailInsightTypes";
import type { NbaTeamUpcomingGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  upcomingDifficultyLegend,
  upcomingDifficultyRestTag,
  upcomingDifficultyValueText,
} from "@/lib/nba/matchupDifficulty/upcomingDifficultyDisplay";
import {
  matchupDifficultyColor,
  scheduleDifficultySummaryText,
  scheduleDifficultyTierColor,
  scheduleDifficultyTierLabel,
} from "@/lib/nba/detailInsights/buildScheduleDifficulty";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
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
  const legend = upcomingGames.some((g) => g.difficulty)
    ? upcomingDifficultyLegend(lang)
    : null;
  const hasLowSample = upcomingGames.some((g) => g.difficulty?.lowSample);
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const emptyCopy = L(lang, {
    ja: "データがありません",
    en: "No data yet",
    ko: "데이터가 없습니다",
    zh: "暂无数据",
    es: "Aún no hay datos",
    pt: "Ainda sem dados",
    fr: "Pas encore de données",
  });

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
      {legend ? (
        <div className="space-y-1 text-[10px] font-semibold leading-snug text-white/45">
          <p>{legend.scale}</p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {(
              [
                ["tough", legend.tough],
                ["balanced", legend.balanced],
                ["soft", legend.soft],
              ] as const
            ).map(([tier, label]) => (
              <span key={tier} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: matchupDifficultyColor(tier) }}
                />
                {label}
              </span>
            ))}
          </p>
          {hasLowSample ? <p>{legend.lowSample}</p> : null}
        </div>
      ) : null}
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: frame }}
      >
        {upcomingGames.map((game, i) => {
          const difficulty = game.difficulty;
          const restTag = difficulty ? upcomingDifficultyRestTag(difficulty) : null;
          return (
            <div
              key={`${game.dateLabel}-${game.oppTeamId}-${i}`}
              style={
                i < upcomingGames.length - 1
                  ? { borderBottom: `1px solid ${line}` }
                  : undefined
              }
            >
              <div className="flex items-center gap-1.5 px-2.5 py-2.5">
                <span className="w-11 shrink-0 text-[13px] text-white/40">
                  {game.dateLabel}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[14px] font-bold uppercase"
                  style={{ transform: "skewX(-10deg)" }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(4deg)" }}>
                    {game.home ? "vs" : "@"} {upcomingOppLabel(game)}
                    {restTag ? <span className="text-white/45"> · {restTag}</span> : null}
                    {game.conferenceGame ? (
                      <span className="text-white/45"> · CONF</span>
                    ) : null}
                  </span>
                </span>
                {difficulty ? (
                  <span
                    className="w-9 shrink-0 text-right text-[14px] font-extrabold tabular-nums"
                    style={{
                      color: matchupDifficultyColor(difficulty.tier),
                      opacity: difficulty.lowSample ? 0.55 : 1,
                    }}
                  >
                    {upcomingDifficultyValueText(difficulty)}
                  </span>
                ) : null}
                <span
                  className="shrink-0 text-[14px] font-bold text-white/85"
                  style={{ transform: "skewX(-10deg)" }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(4deg)" }}>
                    {game.tipLabel}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
