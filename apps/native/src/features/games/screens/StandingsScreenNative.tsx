/** カンファレンス順位 + NBA Cup */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaLeagueStandingsPanelNative from "../standings/NbaLeagueStandingsPanelNative";
import NbaCupStandingsPanelNative from "../standings/NbaCupStandingsPanelNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import {
  LeagueStatsCollapseProvider,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapseState,
} from "../stats/LeagueStatsCollapseNative";

type StandingsTab = "standings" | "cup";

export default function StandingsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";
  const [tab, setTab] = useState<StandingsTab>("standings");
  const collapse = useLeagueStatsCollapseState(tab);
  const onSelectTeam = (teamId: string) =>
    navigation.navigate("TeamDetailPreview", { teamId });

  return (
    <GamesNbaSubpageShellNative
      eyebrow="GAMES"
      title="STANDINGS"
      onBack={() => navigation.goBack()}
      scroll={false}
      contentStyle={styles.shell}
    >
      <LeagueStatsCollapseProvider value={collapse}>
      <LeagueStatsCollapsibleNative>
      <View style={styles.tabs}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="STANDINGS"
            active={tab === "standings"}
            onPress={() => setTab("standings")}
            compact
          />
          <CyberSlantedTabNative
            label="CUP"
            active={tab === "cup"}
            onPress={() => setTab("cup")}
            compact
          />
        </CyberSlantedTabBarNative>
      </View>
      </LeagueStatsCollapsibleNative>
      <View style={styles.body}>
        {tab === "standings" ? (
          <View style={styles.standings}>
            <NbaLeagueStandingsPanelNative language={lang} onSelectTeam={onSelectTeam} />
          </View>
        ) : (
          <View style={styles.standings}>
            <NbaCupStandingsPanelNative language={lang} onSelectTeam={onSelectTeam} />
          </View>
        )}
      </View>
      </LeagueStatsCollapseProvider>
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  tabs: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  body: { flex: 1 },
  standings: { flex: 1, paddingHorizontal: 12 },
});
