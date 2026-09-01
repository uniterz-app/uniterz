/** DEV — 本番と同じ左レール（プレビュー入口）。 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import NbaLeagueTeamStatsRailPanelNative from "../teamStats/NbaLeagueTeamStatsRailPanelNative";
import NbaLeaguePlayerStatLeadersRailPanelNative from "../playerStats/NbaLeaguePlayerStatLeadersRailPanelNative";
import NbaStatsSearchBarNative from "./NbaStatsSearchBarNative";

type TabId = "team" | "player";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
};

export default function LeagueStatsRailPreviewScreenNative({
  language,
  onClose,
  onSelectTeam,
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  const [tab, setTab] = useState<TabId>("team");

  return (
    <GamesNbaSubpageShellNative
      title={tab === "team" ? "TEAM STATS" : "PLAYER STATS"}
      eyebrow="DEV"
      subtitle={
        isJa
          ? "左に指標レール。BASIC / 4FCT など親カテゴリつき。"
          : "Left metric rail with BASIC / 4FCT parents."
      }
      onBack={onClose}
      scroll={false}
      contentStyle={styles.shell}
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
          <NbaLeagueTeamStatsRailPanelNative
            language={language}
            onSelectTeam={onSelectTeam}
          />
        ) : (
          <NbaLeaguePlayerStatLeadersRailPanelNative
            language={language}
            onSelectPlayer={onSelectPlayer}
          />
        )}
      </View>
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
  search: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 20,
  },
  body: { flex: 1 },
});
