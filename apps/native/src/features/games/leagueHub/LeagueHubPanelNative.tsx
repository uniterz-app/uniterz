/** 順位ページ LEAGUE タブ — 今季の NBA を図で見る（TEAM / PLAYER） */
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
  CYBER_TAB_CYAN,
} from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import {
  LeagueStatsCollapsedSummaryNative,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapse,
} from "../stats/LeagueStatsCollapseNative";
import LeagueHubPlayerPanelNative from "./LeagueHubPlayerPanelNative";
import LeagueHubTeamPanelNative from "./LeagueHubTeamPanelNative";
import { HubEmpty, type HubLang } from "./leagueHubUiNative";
import { useNbaLeagueHubNative } from "./useNbaLeagueHubNative";

type Props = {
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
};

export default function LeagueHubPanelNative({ lang, onSelectTeam, onSelectPlayer }: Props) {
  const [tab, setTab] = useState<"team" | "player">("team");
  const { hub, loading } = useNbaLeagueHubNative();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { onTableScroll } = useLeagueStatsCollapse();

  return (
    <View style={styles.root}>
      <LeagueStatsCollapsibleNative>
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
      </LeagueStatsCollapsibleNative>
      <LeagueStatsCollapsedSummaryNative text={`LEAGUE · ${tab.toUpperCase()}`} />
      <ScrollView
        onScroll={onTableScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomContentReserveY + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {hub ? (
          <Text style={styles.season}>
            {hub.seasonKey} SEASON
          </Text>
        ) : null}
        {tab === "team" ? (
          <LeagueHubTeamPanelNative hub={hub} lang={lang} onSelectTeam={onSelectTeam} />
        ) : loading && !hub ? (
          <View style={styles.loading}>
            <ActivityIndicator color={CYBER_TAB_CYAN} />
          </View>
        ) : hub ? (
          <LeagueHubPlayerPanelNative hub={hub} lang={lang} onSelectPlayer={onSelectPlayer} />
        ) : (
          <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  season: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textAlign: "right",
    marginBottom: 6,
  },
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
