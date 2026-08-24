/** Web `NbaPredictToolsTabs` 相当 */
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import TutorialTargetNative from "../../tutorial/TutorialTargetNative";
import { registerTutorialPredictToolsListener } from "../../tutorial/tutorialPredictToolsBridgeNative";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import NbaInjuryReportPanelNative from "./NbaInjuryReportPanelNative";
import NbaTeamStatsPanelNative from "./NbaTeamStatsPanelNative";
import NbaRosterPanelNative from "./NbaRosterPanelNative";
import type { PredictProBrief } from "../../../../../../lib/predict/predictProBrief";
import { proBriefForMatchup } from "../../../../../../lib/predict/nbaProBriefPreviewMocks";
import type { NbaInjuryReport } from "../../../../../../lib/predict/nbaInjuryReport";
import type { NbaTeamStatsBundle } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { teamStatsForMatchup } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "../../../../../../lib/predict/nbaRoster";
import { useNbaMatchupRoster } from "../../../../../../lib/nba/teamRosters/useNbaMatchupRoster";
import { injuryStatusByPlayerId } from "../../../../../../lib/predict/nbaInjuryReport";
import { injuryReportForMatchup } from "../../../../../../lib/predict/nbaInjuryReportPreviewMocks";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import type { MainTabParamList } from "../../../navigation/types";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";

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
  onOpenTeamDetail?: (teamId: string) => void;
  onOpenPlayerDetail?: (
    playerId: string,
    toolsTab?: "injuries" | "roster"
  ) => void;
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
  onOpenTeamDetail,
  onOpenPlayerDetail,
}: Props) {
  const t = getGamesTexts(language);
  const [tab, setTab] = useState<NbaPredictToolsTab | null>("injuries");
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const selectTab = (next: NbaPredictToolsTab) => {
    setTab((cur) => (cur === next ? null : next));
  };
  const resolvedInjury =
    injuryReport ?? injuryReportForMatchup(homeTeamId, awayTeamId);
  const resolvedStats = teamStats ?? teamStatsForMatchup(homeTeamId, awayTeamId);
  const resolvedBrief = brief ?? proBriefForMatchup(homeTeamId, awayTeamId);
  const { roster: liveRoster, loading: rosterLoading } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    override: roster,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const resolvedRoster = liveRoster;
  const injuryById = resolvedInjury
    ? injuryStatusByPlayerId(resolvedInjury)
    : {};

  /** チュートリアル・オーバーレイからタブ切替（CyberSlantedTab は触らない） */
  useEffect(() => registerTutorialPredictToolsListener(setTab), []);

  const openProSubscribe = () => {
    navigation.navigate("ProfileTab", { screen: "ProSubscribe" });
  };

  return (
    <TutorialTargetNative id="predict-tools">
      <View style={styles.root}>
        {/* skew / 選択グローが見切れないようタブ行だけ余白を確保（CyberSlantedTab 本体は変更しない） */}
        <TutorialTargetNative id="predict-tools-tabs">
        <View style={styles.tabShell}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="INSIGHT"
              active={tab === "insight"}
              onPress={() => selectTab("insight")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "insight" }}
            />
            <CyberSlantedTabNative
              label="INJURY"
              active={tab === "injuries"}
              onPress={() => selectTab("injuries")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "injuries" }}
            />
            <CyberSlantedTabNative
              label="STATS"
              active={tab === "stats"}
              onPress={() => selectTab("stats")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "stats" }}
            />
            <CyberSlantedTabNative
              label="ROSTER"
              active={tab === "roster"}
              onPress={() => selectTab("roster")}
              compact
              fontWeight="700"
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "roster" }}
            />
          </CyberSlantedTabBarNative>
        </View>
        </TutorialTargetNative>

        {tab ? (
        <View style={styles.panel}>
          {tab === "insight" ? (
            isPro && !resolvedBrief ? (
              <PendingPanel text={t.panelDataPending} />
            ) : (
              <PredictProBriefPanelNative
                brief={resolvedBrief}
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
            resolvedInjury ? (
              <NbaInjuryReportPanelNative
                report={resolvedInjury}
                language={language}
                onPlayerPress={
                  onOpenPlayerDetail
                    ? (playerId) => onOpenPlayerDetail(playerId, "injuries")
                    : undefined
                }
              />
            ) : (
              <PendingPanel text={t.panelDataPending} />
            )
          ) : tab === "stats" ? (
            resolvedStats ? (
              <NbaTeamStatsPanelNative
                data={resolvedStats}
                isPro={isPro}
                language={language}
                onOpenTeamDetail={onOpenTeamDetail}
              />
            ) : (
              <PendingPanel text={t.panelDataPending} />
            )
          ) : rosterLoading ? (
            <PendingPanel text={t.panelDataPending} />
          ) : resolvedRoster ? (
            <NbaRosterPanelNative
              report={resolvedRoster}
              injuryById={injuryById}
              onPlayerPress={
                onOpenPlayerDetail
                  ? (player) => onOpenPlayerDetail(String(player.id), "roster")
                  : undefined
              }
            />
          ) : (
            <PendingPanel text={t.panelDataPending} />
          )}
        </View>
        ) : null}
      </View>
    </TutorialTargetNative>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 6,
  },
  tabShell: {
    alignSelf: "stretch",
    width: "100%",
    overflow: "visible",
    /**
     * 試合カードと見た目幅を揃える。
     * skew は transform-origin center のため片側 ≈ h/2·tan(14°) だけ。
     * 余白を大きくするとカードより狭く見える。
     */
    paddingHorizontal: 3,
    paddingTop: 0,
    paddingBottom: 6,
  },
  panel: {
    minHeight: 120,
    width: "100%",
    /** タブはカード全幅、パネル本体だけ内側余白 */
    paddingHorizontal: 2,
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
