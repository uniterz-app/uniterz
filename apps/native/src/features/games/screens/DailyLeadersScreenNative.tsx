/** Web `/mobile/today-leaders` 相当 — NBA スタッツリーダー / UNITERZ スコアリーダー */
import { useEffect, useState } from "react";
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
import { useTodayUniterzUnreadNative } from "../stats/useTodayUniterzUnreadNative";
import {
  LeagueStatsCollapseProvider,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapseState,
} from "../stats/LeagueStatsCollapseNative";
import { TODAY_UNITERZ_DOT_COLOR } from "../../../../../../lib/rankings/dailyScoreLeaders/todayUniterzUnread";
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
  const collapse = useLeagueStatsCollapseState(tab);
  const copy = dailyScoreLeadersCopy(resolveLocalizedLang(language));
  const {
    unread: uniterzUnread,
    latest: uniterzVersion,
    markSeen: markUniterzSeen,
  } = useTodayUniterzUnreadNative();

  useEffect(() => {
    if (tab === "uniterz" && uniterzVersion) markUniterzSeen();
  }, [tab, uniterzVersion, markUniterzSeen]);

  return (
    <GamesNbaSubpageShellNative
      eyebrow="GAMES"
      title="TODAY'S LEADERS"
      onBack={() => navigation.goBack()}
      scroll={false}
      contentStyle={styles.shell}
    >
      <LeagueStatsCollapseProvider value={collapse}>
      <LeagueStatsCollapsibleNative>
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
          {uniterzUnread && tab !== "uniterz" ? (
            <View pointerEvents="none" style={styles.uniterzDot} />
          ) : null}
        </View>
      </LeagueStatsCollapsibleNative>

      {tab === "nba" ? (
        <NbaDailyLeadersPanelNative
          summaryPrefix={copy.tabNba}
          language={language}
          onSelectPlayer={(playerId) =>
            navigation.navigate("PlayerDetailPreview", { playerId })
          }
        />
      ) : (
        <UniterzDailyScoreLeadersPanelNative
          summaryPrefix={copy.tabUniterz}
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
      </LeagueStatsCollapseProvider>
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  topTabs: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 },
  uniterzDot: {
    position: "absolute",
    top: 4,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TODAY_UNITERZ_DOT_COLOR,
    shadowColor: TODAY_UNITERZ_DOT_COLOR,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
