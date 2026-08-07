"use client";

import LiveGameTeamStatsPanel from "@/app/component/games/live/LiveGameTeamStatsPanel";
import LiveGameBoxScorePanel from "@/app/component/games/live/LiveGameBoxScorePanel";
import LiveGameLineScorePanel from "@/app/component/games/live/LiveGameLineScorePanel";
import LiveGameLeadersPanel from "@/app/component/games/live/LiveGameLeadersPanel";
import LiveGameSectionTitle from "@/app/component/games/live/LiveGameSectionTitle";
import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import type { LiveGameStatsReport } from "@/lib/games/liveGameStats";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";

type Props = {
  report: LiveGameStatsReport;
  language?: Language;
  className?: string;
  /**
   * オーバーレイで MatchCard がスコアを出すとき、重複するスコアヘッダーを省略。
   * ラインスコアは残す。
   */
  omitScoreHeader?: boolean;
};

export default function LiveGameStatsPanel({
  report,
  language = "ja",
  className = "",
  omitScoreHeader = false,
}: Props) {
  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#5cf0b5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#b388ff";
  const isLive = report.phase === "live";
  const m = t(language);
  const periodText =
    !isLive && /^final$/i.test(report.periodLabel.trim())
      ? ""
      : report.periodLabel;
  const liveStatusText = [periodText, report.clock ?? ""]
    .filter(Boolean)
    .join(" ");
  const hasLineScore = Boolean(report.lineScore?.periods.length);

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      {omitScoreHeader ? (
        hasLineScore ? (
          <section className="space-y-2.5">
            <LiveGameSectionTitle title="Score by Quarter" />
            <LiveGameLineScorePanel report={report} />
          </section>
        ) : null
      ) : (
        <header
          className="border px-3 py-3"
          style={{
            borderColor: "rgba(255,255,255,0.22)",
            backgroundColor: "transparent",
          }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0 text-right">
              <p
                className={[
                  nameOxanium.className,
                  "truncate text-[11px] font-extrabold uppercase tracking-[0.08em]",
                ].join(" ")}
                style={{ color: homeColor }}
              >
                {report.home.abbr}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              {isLive ? (
                <LiveMatchMark density="matchDense" language={language} />
              ) : null}
              <div
                className={[
                  nameOxanium.className,
                  "flex max-w-full flex-nowrap items-baseline justify-center gap-1.5 whitespace-nowrap text-[28px] font-extrabold tabular-nums leading-none text-white sm:gap-2 sm:text-[32px]",
                ].join(" ")}
                style={{ transform: "skewX(-6deg)" }}
              >
                <span className="shrink-0">{report.home.score}</span>
                <span className="shrink-0 opacity-70">–</span>
                <span className="shrink-0">{report.away.score}</span>
              </div>
              {isLive ? (
                liveStatusText ? (
                  <div className="text-xs opacity-80">{liveStatusText}</div>
                ) : null
              ) : (
                <div className="text-xs opacity-80">
                  {m.games.finalLabel}
                  {periodText ? ` (${periodText})` : ""}
                </div>
              )}
            </div>

            <div className="min-w-0 text-left">
              <p
                className={[
                  nameOxanium.className,
                  "truncate text-[11px] font-extrabold uppercase tracking-[0.08em]",
                ].join(" ")}
                style={{ color: awayColor }}
              >
                {report.away.abbr}
              </p>
            </div>
          </div>

          {hasLineScore ? (
            <div className="mt-3 border-t border-white/[0.08] pt-2.5">
              <LiveGameLineScorePanel report={report} embedded />
            </div>
          ) : null}
        </header>
      )}

      <section className="space-y-2.5">
        <LiveGameSectionTitle title="Team Stats" />
        <LiveGameTeamStatsPanel report={report} />
      </section>

      <section className="space-y-2.5">
        <LiveGameSectionTitle title="Game Leaders" />
        <LiveGameLeadersPanel report={report} />
      </section>

      <section className="space-y-2.5">
        <LiveGameSectionTitle title="Box Score" />
        <LiveGameBoxScorePanel report={report} />
      </section>
    </div>
  );
}
