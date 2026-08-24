/** STATS ハブ — 既定 Team Stats、タブで Player Stats 切替 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import NbaLeagueTeamStatsPanelNative from "../teamStats/NbaLeagueTeamStatsPanelNative";
import NbaLeaguePlayerStatLeadersPanelNative from "../playerStats/NbaLeaguePlayerStatLeadersPanelNative";
import NbaStatsSearchBarNative from "./NbaStatsSearchBarNative";

type TabId = "team" | "player";

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
  const isJa = language === "ja";
  const [tab, setTab] = useState<TabId>(initialTab);

  const title = tab === "team" ? "TEAM STATS" : "PLAYER STATS";
  const subtitle =
    tab === "team"
      ? isJa
        ? "共有 API から取得。"
        : "Loaded via shared API."
      : isJa
        ? "指標トップリーダー"
        : "Stat leaderboards.";

  return (
    <MobilePageShell
      title={title}
      eyebrow="STATS"
      subtitle={subtitle}
      appBackground
      onClose={onClose}
    >
      <View style={styles.tabs}>
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
        </CyberSlantedTabBarNative>
      </View>
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
      <View style={styles.body}>
        {tab === "team" ? (
          <NbaLeagueTeamStatsPanelNative
            language={language}
            onSelectTeam={onSelectTeam}
          />
        ) : (
          <NbaLeaguePlayerStatLeadersPanelNative
            language={language}
            onSelectPlayer={onSelectPlayer}
          />
        )}
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  tabs: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  search: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 20,
  },
  body: {
    flex: 1,
  },
});
