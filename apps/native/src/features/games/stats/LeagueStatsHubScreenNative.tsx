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
        ? "共有 API から取得（未 seed 時はモック）。"
        : "Loaded via shared API (mock until seeded)."
      : isJa
        ? "指標トップリーダー（モック）"
        : "Stat leaderboards (mock).";

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
  body: {
    flex: 1,
  },
});
