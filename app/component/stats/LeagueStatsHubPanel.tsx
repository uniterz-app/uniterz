"use client";

/**
 * STATS ハブ — 既定 Team Stats、タブで Player Stats 切替
 * Native `LeagueStatsHubScreenNative` 相当
 */
import { useState } from "react";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import NbaLeagueTeamStatsPanel from "@/app/component/teamStats/NbaLeagueTeamStatsPanel";
import NbaLeaguePlayerStatLeadersPanel from "@/app/component/playerStats/NbaLeaguePlayerStatLeadersPanel";
import { nameOxanium } from "@/lib/fonts";

type TabId = "team" | "player";

type Props = {
  language?: "ja" | "en";
  initialTab?: TabId;
};

export default function LeagueStatsHubPanel({
  language = "ja",
  initialTab = "team",
}: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const title = tab === "team" ? "TEAM STATS" : "PLAYER STATS";

  return (
    <div className="space-y-3 text-white">
      <div className="space-y-1 text-center">
        <p
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.2em] text-white/55`}
        >
          STATS
        </p>
        <h1
          className={`${nameOxanium.className} text-[22px] font-extrabold uppercase tracking-[0.06em]`}
          style={{ transform: "skewX(-6deg)" }}
        >
          {title}
        </h1>
      </div>

      <CyberSlantedTabBar fill aria-label="Stats tabs">
        <CyberSlantedTab
          label="TEAM"
          active={tab === "team"}
          onClick={() => setTab("team")}
          compact
        />
        <CyberSlantedTab
          label="PLAYER"
          active={tab === "player"}
          onClick={() => setTab("player")}
          compact
        />
      </CyberSlantedTabBar>

      {tab === "team" ? (
        <NbaLeagueTeamStatsPanel language={language} />
      ) : (
        <NbaLeaguePlayerStatLeadersPanel language={language} />
      )}
    </div>
  );
}
