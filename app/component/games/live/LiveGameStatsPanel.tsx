"use client";

import { useState } from "react";
import LiveGameTeamStatsPanel from "@/app/component/games/live/LiveGameTeamStatsPanel";
import LiveGameBoxScorePanel from "@/app/component/games/live/LiveGameBoxScorePanel";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { LiveGameStatsReport } from "@/lib/games/liveGameStats";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";

export type LiveGameStatsTab = "team" | "box";

type Props = {
  report: LiveGameStatsReport;
  language?: Language;
  initialTab?: LiveGameStatsTab;
  className?: string;
};

export default function LiveGameStatsPanel({
  report,
  language = "ja",
  initialTab = "team",
  className = "",
}: Props) {
  const [tab, setTab] = useState<LiveGameStatsTab>(initialTab);
  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#5cf0b5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#b388ff";
  const isLive = report.phase === "live";
  const m = t(language);
  // 実カード同様、FINAL はスコア下ラベルとして出すため periodLabel の "FINAL" は使わない
  // （OT 表記など追加情報がある場合のみ残す）
  const periodText =
    !isLive && /^final$/i.test(report.periodLabel.trim())
      ? ""
      : report.periodLabel;
  // 実カードは "Q3 4:12" のように半角スペース区切り
  const liveStatusText = [periodText, report.clock ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      <header className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
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

          {/* 実カード（MatchCard）と同じ縦積み：LIVE→スコア→ピリオド / スコア→FINALラベル */}
          <div className="flex flex-col items-center gap-1">
            {isLive ? (
              <LiveMatchMark density="matchDense" language={language} />
            ) : null}
            <MatchScoreLine
              home={report.home.score}
              away={report.away.score}
              className="text-[28px] leading-none text-white sm:text-[32px]"
            />
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
      </header>

      <CyberSlantedTabBar fill aria-label="Live game stats tabs">
        <CyberSlantedTab
          role="tab"
          label="Team"
          active={tab === "team"}
          onClick={() => setTab("team")}
          compact
        />
        <CyberSlantedTab
          role="tab"
          label="Box Score"
          active={tab === "box"}
          onClick={() => setTab("box")}
          compact
        />
      </CyberSlantedTabBar>

      {tab === "team" ? (
        <LiveGameTeamStatsPanel report={report} />
      ) : (
        <LiveGameBoxScorePanel report={report} />
      )}
    </div>
  );
}
