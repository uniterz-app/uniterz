/** Web `/mobile/standings` 相当 — カンファレンス順位表 + LEAGUE（今季を図で見る） */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaLeagueStandingsPanelNative from "../standings/NbaLeagueStandingsPanelNative";
import LeagueHubPanelNative from "../leagueHub/LeagueHubPanelNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";

export default function StandingsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";
  const [tab, setTab] = useState<"standings" | "league">("standings");
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
      <View style={styles.tabs}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="STANDINGS"
            active={tab === "standings"}
            onPress={() => setTab("standings")}
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
      <View style={styles.body}>
        {tab === "standings" ? (
          <View style={styles.standings}>
            <NbaLeagueStandingsPanelNative language={lang} onSelectTeam={onSelectTeam} />
          </View>
        ) : (
          <LeagueHubPanelNative
            lang={lang}
            onSelectTeam={onSelectTeam}
            onSelectPlayer={(playerId) =>
              navigation.navigate("PlayerDetailPreview", { playerId })
            }
          />
        )}
      </View>
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
