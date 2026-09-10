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
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import type { PredictProBrief } from "../../../../../../lib/predict/predictProBrief";
import type { NbaInjuryReport } from "../../../../../../lib/predict/nbaInjuryReport";
import type { NbaTeamStatsBundle } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "../../../../../../lib/predict/nbaRoster";
import { useNbaMatchupRoster } from "../../../../../../lib/nba/teamRosters/useNbaMatchupRoster";
import { useNbaMatchupInjuryReport } from "../../../../../../lib/nba/predict/useNbaMatchupInjuryReport";
import { useNbaMatchupTeamStats } from "../../../../../../lib/nba/predict/useNbaMatchupTeamStats";
import { useNbaMatchupProBrief } from "../../../../../../lib/nba/predict/useNbaMatchupProBrief";
import { injuryStatusByPlayerId } from "../../../../../../lib/predict/nbaInjuryReport";
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
  /** games/{id}.proBrief 取得用 */
  gameId?: string | null;
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

function LoadingPanel({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <CandleChartLoaderNative scale={0.72} label={label} />
    </View>
  );
}

/**
 * NBA 予想フォームの情報タブ（本番相当）。
 * Injury / Stats / Roster は対戦チームの公開 API（モックフォールバックなし）。
 */
export default function NbaPredictToolsTabsNative({
  language,
  isPro,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  gameId = null,
  brief = null,
  injuryReport = null,
  teamStats = null,
  roster = null,
  onOpenTeamDetail,
  onOpenPlayerDetail,
}: Props) {
  const t = getGamesTexts(language);
  const loadingLabel = t.predictToolLoading;
  const [tab, setTab] = useState<NbaPredictToolsTab | null>("injuries");
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  /**
   * Injury / Stats / Roster はオーバーレイ表示と同時に取りに行く。
   * タブ切替の一瞬だけ「データ準備中」と出さない（キャッシュがあれば即表示）。
   */
  const [visited, setVisited] = useState<Set<NbaPredictToolsTab>>(
    () => new Set<NbaPredictToolsTab>(["injuries", "stats", "roster"])
  );
  const selectTab = (next: NbaPredictToolsTab) => {
    setTab((cur) => (cur === next ? null : next));
    setVisited((cur) => (cur.has(next) ? cur : new Set(cur).add(next)));
  };
  const apiBaseUrl = getUniterzApiBaseUrl();

  useEffect(() => {
    if (!tab) return;
    setVisited((cur) => (cur.has(tab) ? cur : new Set(cur).add(tab)));
  }, [tab]);

  const { brief: liveBrief, loading: briefLoading } = useNbaMatchupProBrief({
    gameId,
    override: brief,
    apiBaseUrl,
    enabled: visited.has("insight") && isPro,
  });
  const resolvedBrief = liveBrief;

  const { report: liveInjury, loading: injuryLoading } =
    useNbaMatchupInjuryReport({
      homeTeamId,
      awayTeamId,
      override: injuryReport,
      apiBaseUrl,
      enabled: visited.has("injuries"),
      language: language === "ja" ? "ja" : "en",
    });
  const { stats: liveStats, loading: statsLoading } = useNbaMatchupTeamStats({
    homeTeamId,
    awayTeamId,
    override: teamStats,
    apiBaseUrl,
    enabled: visited.has("stats"),
  });
  const { roster: liveRoster, loading: rosterLoading } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    override: roster,
    apiBaseUrl,
    enabled: visited.has("roster"),
  });

  const resolvedInjury = liveInjury;
  const resolvedStats = liveStats;
  const resolvedRoster = liveRoster;
  const injuryById = resolvedInjury
    ? injuryStatusByPlayerId(resolvedInjury)
    : {};

  /** チュートリアル・オーバーレイからタブ切替（CyberSlantedTab は触らない） */
  useEffect(
    () =>
      registerTutorialPredictToolsListener((next) => {
        setTab(next);
        setVisited((cur) => (cur.has(next) ? cur : new Set(cur).add(next)));
      }),
    []
  );

  const openProSubscribe = () => {
    navigation.navigate("ProfileTab", { screen: "ProSubscribe" });
  };

  return (
    <TutorialTargetNative id="predict-tools">
      <View style={styles.root}>
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
              resolvedBrief || !isPro ? (
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
              ) : briefLoading ? (
                <LoadingPanel label={loadingLabel} />
              ) : (
                <PendingPanel text={t.panelDataPending} />
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
              ) : injuryLoading ? (
                <LoadingPanel label={loadingLabel} />
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
              ) : statsLoading ? (
                <LoadingPanel label={loadingLabel} />
              ) : (
                <PendingPanel text={t.panelDataPending} />
              )
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
            ) : rosterLoading ? (
              <LoadingPanel label={loadingLabel} />
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
  /** Web / ランキング period タブと同様。skew 先端が ScrollView 端で四角く切れないよう余白 */
  tabShell: {
    alignSelf: "stretch",
    width: "100%",
    overflow: "visible",
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 6,
  },
  panel: {
    minHeight: 120,
    width: "100%",
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
  loading: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
});
