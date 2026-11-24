/** STATS ハブ — Team / Player 表 + LEAGUE（図で見る） */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import NbaLeagueTeamStatsPanelNative from "../teamStats/NbaLeagueTeamStatsPanelNative";
import NbaLeaguePlayerStatLeadersPanelNative from "../playerStats/NbaLeaguePlayerStatLeadersPanelNative";
import LeagueHubPanelNative from "../leagueHub/LeagueHubPanelNative";
import NbaStatsSearchBarNative from "./NbaStatsSearchBarNative";
import {
  LeagueStatsCollapseProvider,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapseState,
} from "./LeagueStatsCollapseNative";
import { useTrackViewNative } from "../../../analytics/useTrackViewNative";

type TabId = "team" | "player" | "league";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
  /** 初期タブ（既定 team） */
  initialTab?: TabId;
};

export default function LeagueStatsHubScreenNative({
  language,
  onClose,
  onSelectTeam,
  onSelectPlayer,
  initialTab = "team",
}: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const title =
    tab === "team" ? "TEAM STATS" : tab === "player" ? "PLAYER STATS" : "LEAGUE";
  const collapse = useLeagueStatsCollapseState(tab);
  useTrackViewNative(
    tab === "team" ? "Stats: Team" : "Stats: Player",
    tab === "team" ? "games/stats/team" : "games/stats/player"
  );

  return (
    <GamesNbaSubpageShellNative
      title={title}
      eyebrow="STATS"
      onBack={onClose}
      scroll={false}
      contentStyle={styles.shell}
    >
      <LeagueStatsCollapseProvider value={collapse}>
      <LeagueStatsCollapsibleNative zIndex={20}>
      <View style={[styles.tabs, tab === "league" ? styles.tabsLeague : null]}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="TEAM"
            active={tab === "team"}
            onPress={() => setTab("team")}
            compact
          />
          <CyberSlantedTabNative
            label="PLAYER"
            active={tab === "player"}
            onPress={() => setTab("player")}
            compact
          />
          <CyberSlantedTabNative
            label="LEAGUE"
            active={tab === "league"}
            onPress={() => setTab("league")}
            compact
          />
        </CyberSlantedTabBarNative>
      </View>
      {tab !== "league" ? (
        <View style={styles.search}>
          <NbaStatsSearchBarNative
            key={tab}
            kind={tab}
            language={language}
            onSelect={(hit) => {
              if (hit.kind === "team") {
                onSelectTeam(hit.id);
                return;
              }
              onSelectPlayer?.(hit.id);
            }}
          />
        </View>
      ) : null}
      </LeagueStatsCollapsibleNative>
      <View style={styles.body}>
        {tab === "team" ? (
          <NbaLeagueTeamStatsPanelNative
            language={language}
            onSelectTeam={onSelectTeam}
          />
        ) : tab === "player" ? (
          <NbaLeaguePlayerStatLeadersPanelNative
            language={language}
            onSelectPlayer={onSelectPlayer}
          />
        ) : (
          <LeagueHubPanelNative
            lang={language}
            onSelectTeam={onSelectTeam}
            onSelectPlayer={(playerId) => onSelectPlayer?.(playerId)}
          />
        )}
      </View>
      </LeagueStatsCollapseProvider>
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  tabs: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  /** LEAGUE 下段タブへ線が届くよう、間の余白だけ詰める */
  tabsLeague: {
    paddingBottom: 0,
  },
  search: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
  },
});
