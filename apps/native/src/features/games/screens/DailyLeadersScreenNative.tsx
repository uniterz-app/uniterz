/** Web `/mobile/today-leaders` 相当 — NBA スタッツリーダー / UNITERZ スコアリーダー */
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { navigateToPublicProfileNative } from "../../../navigation/navigateToPublicProfileNative";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaDailyLeadersPanelNative from "../stats/NbaDailyLeadersPanelNative";
import UniterzDailyScoreLeadersPanelNative from "../stats/UniterzDailyScoreLeadersPanelNative";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import {
  dailyScoreLeadersCopy,
  type TodayLeadersTab,
} from "../../../../../../lib/rankings/dailyScoreLeaders/dailyScoreLeadersCopy";

export default function DailyLeadersScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const [tab, setTab] = useState<TodayLeadersTab>("nba");
  const copy = dailyScoreLeadersCopy(resolveLocalizedLang(language));

  return (
    <GamesNbaSubpageShellNative
      eyebrow="GAMES"
      title="TODAY'S LEADERS"
      onBack={() => navigation.goBack()}
      scroll={false}
      contentStyle={styles.shell}
    >
      <View style={styles.topTabs}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label={copy.tabNba}
            active={tab === "nba"}
            onPress={() => setTab("nba")}
          />
          <CyberSlantedTabNative
            label={copy.tabUniterz}
            active={tab === "uniterz"}
            onPress={() => setTab("uniterz")}
          />
        </CyberSlantedTabBarNative>
      </View>

      {tab === "nba" ? (
        <NbaDailyLeadersPanelNative
          language={language}
          onSelectPlayer={(playerId) =>
            navigation.navigate("PlayerDetailPreview", { playerId })
          }
        />
      ) : (
        <UniterzDailyScoreLeadersPanelNative
          language={language}
          onSelectUser={(row) =>
            navigateToPublicProfileNative(navigation, {
              handle: row.uid,
              fromDailyLeaders: true,
              warm: {
                uid: row.uid,
                handle: row.handle ?? null,
                displayName: row.displayName,
                photoURL: row.photoURL ?? null,
                plan: row.plan ?? null,
              },
            })
          }
        />
      )}
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  topTabs: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 },
});
