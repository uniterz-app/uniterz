/** Web `NbaPredictToolsTabs` 相当 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import TutorialTargetNative from "../../tutorial/TutorialTargetNative";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import NbaInjuryReportPanelNative from "./NbaInjuryReportPanelNative";
import NbaTeamStatsPanelNative from "./NbaTeamStatsPanelNative";
import NbaRosterPanelNative from "./NbaRosterPanelNative";
import type { PredictProBrief } from "../../../../../../lib/predict/predictProBrief";
import type { NbaInjuryReport } from "../../../../../../lib/predict/nbaInjuryReport";
import type { NbaTeamStatsBundle } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "../../../../../../lib/predict/nbaRoster";
import { injuryStatusByPlayerId } from "../../../../../../lib/predict/nbaInjuryReport";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import type { MainTabParamList } from "../../../navigation/types";

export type NbaPredictToolsTab = "insight" | "injuries" | "stats" | "roster";

type Props = {
  language: GamesLanguage;
  /** Insight タブの中身は Pro 限定（タブ自体は常時表示） */
  isPro: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  brief?: PredictProBrief | null;
  injuryReport?: NbaInjuryReport | null;
  teamStats?: NbaTeamStatsBundle | null;
  roster?: NbaRosterReport | null;
};

function PendingPanel({ text }: { text: string }) {
  return (
    <View style={styles.pending}>
      <Text style={styles.pendingText}>{text}</Text>
    </View>
  );
}

/**
 * NBA 予想フォームの情報タブ（本番相当）。
 * Insight (Pro) / Injury / Team Stats / Roster — データ未投入時は準備中。
 * モックは `resolvePredictTimingMocksForGame`（preview 専用）経由のみ。
 */
export default function NbaPredictToolsTabsNative({
  language,
  isPro,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  brief = null,
  injuryReport = null,
  teamStats = null,
  roster = null,
}: Props) {
  const t = getGamesTexts(language);
  const [tab, setTab] = useState<NbaPredictToolsTab>("injuries");
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const injuryById = injuryReport
    ? injuryStatusByPlayerId(injuryReport)
    : {};

  const openProSubscribe = () => {
    navigation.navigate("ProfileTab", { screen: "ProSubscribe" });
  };

  return (
    <TutorialTargetNative id="predict-tools">
      <View style={styles.root}>
        <View style={styles.tabShell}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="INSIGHT"
              active={tab === "insight"}
              onPress={() => setTab("insight")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "insight" }}
            />
            <CyberSlantedTabNative
              label="INJURY"
              active={tab === "injuries"}
              onPress={() => setTab("injuries")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "injuries" }}
            />
            <CyberSlantedTabNative
              label="STATS"
              active={tab === "stats"}
              onPress={() => setTab("stats")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "stats" }}
            />
            <CyberSlantedTabNative
              label="ROSTER"
              active={tab === "roster"}
              onPress={() => setTab("roster")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "roster" }}
            />
          </CyberSlantedTabBarNative>
        </View>

        <View style={styles.panel}>
          {tab === "insight" ? (
            isPro && !brief ? (
              <PendingPanel text={t.panelDataPending} />
            ) : (
              <PredictProBriefPanelNative
                brief={brief}
                language={language}
                homeTeamId={homeTeamId ?? ""}
                awayTeamId={awayTeamId ?? ""}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                locked={!isPro}
                onPressUpgrade={openProSubscribe}
              />
            )
          ) : tab === "injuries" ? (
            injuryReport ? (
              <NbaInjuryReportPanelNative
                report={injuryReport}
                language={language}
              />
            ) : (
              <PendingPanel text={t.panelDataPending} />
            )
          ) : tab === "stats" ? (
            teamStats ? (
              <NbaTeamStatsPanelNative
                data={teamStats}
                isPro={isPro}
                language={language}
              />
            ) : (
              <PendingPanel text={t.panelDataPending} />
            )
          ) : roster ? (
            <NbaRosterPanelNative
              report={roster}
              injuryById={injuryById}
            />
          ) : (
            <PendingPanel text={t.panelDataPending} />
          )}
        </View>
      </View>
    </TutorialTargetNative>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 10,
  },
  tabShell: {
    width: "100%",
  },
  panel: {
    minHeight: 120,
    width: "100%",
  },
  pending: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  pendingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
