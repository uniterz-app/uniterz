"use client";

/**
 * STATS ハブ — 既定 Team Stats、タブで Player Stats 切替
 * Native `LeagueStatsHubScreenNative` 相当
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import NbaLeagueTeamStatsPanel from "@/app/component/teamStats/NbaLeagueTeamStatsPanel";
import NbaLeaguePlayerStatLeadersPanel from "@/app/component/playerStats/NbaLeaguePlayerStatLeadersPanel";
import NbaStatsSearchBar from "@/app/component/stats/NbaStatsSearchBar";
import { nameOxanium } from "@/lib/fonts";
import MobilePageShell from "@/app/component/common/MobilePageShell";

type TabId = "team" | "player";

type Props = {
  language?: "ja" | "en";
  initialTab?: TabId;
  /** MobilePageShell 内では見出しを出さない */
  embedded?: boolean;
  /** Native `LeagueStatsHubScreenNative` 相当のフルシェル */
  shell?: boolean;
  onClose?: () => void;
};

export default function LeagueStatsHubPanel({
  language = "ja",
  initialTab = "team",
  embedded = false,
  shell = false,
  onClose,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab);
  const title = tab === "team" ? "TEAM STATS" : "PLAYER STATS";

  const body = (
    <div className="space-y-3 text-white">
      {!embedded && !shell ? (
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
      ) : null}

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

      <NbaStatsSearchBar
        key={tab}
        kind={tab}
        language={language}
        onSelect={(hit) => {
          if (hit.kind === "team") {
            router.push(
              `/mobile/team-detail-preview?teamId=${encodeURIComponent(hit.id)}`
            );
            return;
          }
          router.push(
            `/mobile/player-detail-preview?playerId=${encodeURIComponent(hit.id)}`
          );
        }}
      />

      {tab === "team" ? (
        <NbaLeagueTeamStatsPanel
          language={language}
          onSelectTeam={(teamId) =>
            router.push(
              `/mobile/team-detail-preview?teamId=${encodeURIComponent(teamId)}`
            )
          }
        />
      ) : (
        <NbaLeaguePlayerStatLeadersPanel
          language={language}
          onSelectPlayer={(playerId) =>
            router.push(
              `/mobile/player-detail-preview?playerId=${encodeURIComponent(playerId)}`
            )
          }
        />
      )}
    </div>
  );

  if (shell) {
    return (
      <MobilePageShell
        title={title}
        eyebrow="STATS"
        onClose={onClose ?? (() => router.back())}
      >
        {body}
      </MobilePageShell>
    );
  }

  return body;
}
