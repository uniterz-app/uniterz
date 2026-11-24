/** Web `NbaPredictToolsTabs` 相当 */
import { useEffect, useRef, useState } from "react";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
  type CyberSlantedTabThemeNative,
} from "../../rankings/CyberSlantedTabNative";
import TutorialTargetNative from "../../tutorial/TutorialTargetNative";
import { registerTutorialPredictToolsListener } from "../../tutorial/tutorialPredictToolsBridgeNative";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import ProPickAdMockModalNative from "./ProPickAdMockModalNative";
import { requestProPickUnlock } from "../../../../../../lib/nba/predict/proPickUnlockApi";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";
import { cyberAlert } from "../../../components/cyberAlert";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import {
  showProPickRewardedAdNative,
  type ProPickRewardedResult,
} from "../../ads/proPickRewardedAdNative";
import { startProPickUnlockPollNative } from "../../ads/rewardedAdUnlockPollNative";
import {
  peekProPickAdEarnedGameId,
  setProPickAdEarnedGameId,
} from "./proPickAdSessionNative";

/**
 * AdMob のリワード広告を使うか（EAS の env で切り替える。既定は使わない）。
 * 使わないときは開発ビルドだけモック広告を出す。
 */
const PRO_PICK_AD_SDK_ENABLED = process.env.EXPO_PUBLIC_PRO_PICK_AD_SDK === "1";
/** Free の「広告で PRO PICK を見る」ボタンの表示。本番は SDK を有効にしたときだけ出す */
const PRO_PICK_AD_UI_ENABLED = __DEV__ || PRO_PICK_AD_SDK_ENABLED;
import PredictProInsightNarrativePanelNative from "./PredictProInsightNarrativePanelNative";
import PredictProInsightKitNative from "./PredictProInsightKitNative";
import NbaInjuryReportPanelNative from "./NbaInjuryReportPanelNative";
import NbaTeamStatsPanelNative from "./NbaTeamStatsPanelNative";
import NbaMatchupTrendPanelNative from "./NbaMatchupTrendPanelNative";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import type { PredictProBrief } from "../../../../../../lib/predict/predictProBrief";
import type { NbaInjuryReport } from "../../../../../../lib/predict/nbaInjuryReport";
import type { NbaTeamStatsBundle } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "../../../../../../lib/predict/nbaRoster";
import { useNbaMatchupRoster } from "../../../../../../lib/nba/teamRosters/useNbaMatchupRoster";
import { useNbaMatchupTrend } from "../../../../../../lib/nba/predict/useNbaMatchupTrend";
import { useNbaMatchupInjuryReport } from "../../../../../../lib/nba/predict/useNbaMatchupInjuryReport";
import { useNbaMatchupTeamStats } from "../../../../../../lib/nba/predict/useNbaMatchupTeamStats";
import { useNbaMatchupProBrief } from "../../../../../../lib/nba/predict/useNbaMatchupProBrief";
import { useNbaMatchupInsightTeaser } from "../../../../../../lib/nba/predict/useNbaMatchupInsightTeaser";
import PredictProInsightTeaserPanelNative from "./PredictProInsightTeaserPanelNative";
import {
  setProSubscribeSourceNative,
  trackProFunnelNative,
} from "../../billing/proFunnelNative";
import type { ProFunnelSource } from "../../../../../../lib/billing/proFunnelEvents";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import type { MainTabParamList } from "../../../navigation/types";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { useNativeUserLanguageFromAuth } from "../../../i18n/useNativeUserLanguageFromAuth";
import { formatProInsightFirstReadyPending } from "../../../../../../lib/predict/proInsightFirstReadyCopy";
import { proInsightPreseasonNotice } from "../../../../../../lib/predict/proInsightGateCopy";
import type { Language } from "../../../../../../lib/i18n/language";
import { TODAY_UNITERZ_DOT_COLOR } from "../../../../../../lib/rankings/dailyScoreLeaders/todayUniterzUnread";
import { useProInsightUnreadNative } from "./useProInsightUnreadNative";
import {
  predictAnalyticsPath,
  trackPageViewNative,
} from "../../../analytics/appAnalyticsNative";

export type NbaPredictToolsTab = "insight" | "info" | "trend";

/** シミュレータ確認用。CDP で `globalThis.__UNITERZ_DEV_FORCE_FREE__ = true` */
function readDevForceFree(): boolean {
  if (!__DEV__) return false;
  try {
    return Boolean(
      (globalThis as { __UNITERZ_DEV_FORCE_FREE__?: boolean }).__UNITERZ_DEV_FORCE_FREE__
    );
  } catch {
    return false;
  }
}

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
  /** tip 時刻（現地換算用） */
  tipAtMs?: number | null;
  brief?: PredictProBrief | null;
  injuryReport?: NbaInjuryReport | null;
  teamStats?: NbaTeamStatsBundle | null;
  roster?: NbaRosterReport | null;
  onOpenTeamDetail?: (teamId: string) => void;
  /** タブを開いたとき、中身の先頭が見えるよう親がスクロールする */
  onRevealPanel?: (panel: View) => void;
  onOpenPlayerDetail?: (
    playerId: string,
    toolsTab?: "injuries" | "roster"
  ) => void;
  /** RN Modal 内では navigate だけだと遷移先が Modal の裏に隠れるため、親で閉じてから遷移する */
  onOpenProSubscribe?: () => void;
  /**
   * 予想シートを一度閉じてから広告を出す（iOS でシートの上に広告が乗ると
   * × がシート側になり、報酬ボタンが押せない）。
   */
  presentRewardedAd?: (opts: {
    gameId: string;
    userId: string;
  }) => Promise<ProPickRewardedResult>;
  /** 広告のあとシートを開き直した */
  resumeAfterRewardedAd?: boolean;
  /** プレシーズン: INSIGHT は Free / Pro とも対象外表示（Pro 勧誘なし） */
  preseason?: boolean;
  /** チュートリアル中は初回無料オファーを親に上げない */
  tutorialMode?: boolean;
  /** この試合で初回無料が使える（予想送信後の案内用） */
  onFirstFreeOffer?: (available: boolean) => void;
  /** UNITERZ のみんなの予想（ホームを選んだ割合 % と人数）。予想の材料に並べる */
  crowd?: { homePct: number; total: number } | null;
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
 * INFORMATION（怪我 + スタッツ）/ Roster は対戦チームの公開 API。
 */
export default function NbaPredictToolsTabsNative({
  language,
  isPro,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  gameId = null,
  tipAtMs = null,
  brief = null,
  injuryReport = null,
  teamStats = null,
  roster = null,
  onOpenTeamDetail,
  onRevealPanel,
  onOpenPlayerDetail,
  onOpenProSubscribe,
  presentRewardedAd,
  resumeAfterRewardedAd = false,
  preseason = false,
  tutorialMode = false,
  onFirstFreeOffer,
  crowd = null,
}: Props) {
  const t = getGamesTexts(language);
  const loadingLabel = t.predictToolLoading;
  const { countryCode, timeZone } = useNativeUserLanguageFromAuth();
  const insightPendingText = formatProInsightFirstReadyPending({
    language: language as Language,
    countryCode,
    timeZone,
    tipAtMs,
  });
  const [tab, setTab] = useState<NbaPredictToolsTab | null>(() =>
    resumeAfterRewardedAd || peekProPickAdEarnedGameId() === gameId ? "insight" : "info"
  );
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  /**
   * INFORMATION / TREND はオーバーレイ表示と同時に取りに行く。
   * タブ切替の一瞬だけ「データ準備中」と出さない（キャッシュがあれば即表示）。
   */
  const [visited, setVisited] = useState<Set<NbaPredictToolsTab>>(
    () => new Set<NbaPredictToolsTab>(["info", "trend"])
  );
  const panelRef = useRef<View>(null);

  const selectTab = (next: NbaPredictToolsTab) => {
    if (next !== tab && onRevealPanel) {
      requestAnimationFrame(() => {
        if (panelRef.current) onRevealPanel(panelRef.current);
      });
    }
    if (next === "insight" && tab !== "insight" && gameId) {
      trackProFunnelNative("insight_open", { gameId, pro: isPro });
    }
    if (next !== tab) {
      trackPageViewNative(
        `Predict: ${next.toUpperCase()}`,
        predictAnalyticsPath(gameId, awayTeamName, homeTeamName, next)
      );
    }
    setTab((cur) => (cur === next ? null : next));
    setVisited((cur) => (cur.has(next) ? cur : new Set(cur).add(next)));
  };
  const apiBaseUrl = getUniterzApiBaseUrl();

  useEffect(() => {
    if (!tab) return;
    setVisited((cur) => (cur.has(tab) ? cur : new Set(cur).add(tab)));
  }, [tab]);

  const { fUser } = useFirebaseUser();
  const forceFree = readDevForceFree();
  const effectivePro = isPro && !forceFree;
  const {
    teaser,
    hasKit: teaserHasKit,
    kitRecord,
    loading: teaserLoading,
    unlocked: teaserUnlocked,
    firstFreeAvailable,
  } = useNbaMatchupInsightTeaser({
    gameId,
    apiBaseUrl,
    enabled: !effectivePro && !preseason,
  });
  /** Free でも、この試合を解除済み（広告 / 初回の無料）なら Pro と同じ中身を出す */
  const [proPickUnlockedGameId, setProPickUnlockedGameId] = useState<string | null>(
    () => peekProPickAdEarnedGameId()
  );
  const [proPickAdOpen, setProPickAdOpen] = useState(false);
  const [proPickUnlockBusy, setProPickUnlockBusy] = useState(false);
  /** 広告は見終わった試合。同じ試合なら広告を重ねない */
  const pendingAdGameIdRef = useRef<string | null>(null);
  const proPickUnlockedHere =
    !!gameId &&
    (forceFree
      ? proPickUnlockedGameId === gameId
      : teaserUnlocked || proPickUnlockedGameId === gameId);
  const proPickAccess = effectivePro || proPickUnlockedHere;

  const insightAvailable = proPickAccess && !preseason;
  const {
    narrative: liveNarrative,
    predictKit,
    loading: briefLoading,
    updatedAt: insightUpdatedAt,
  } = useNbaMatchupProBrief({
    gameId,
    override: brief,
    apiBaseUrl,
    enabled: insightAvailable,
  });
  const markProPickAdSession = (id: string) => {
    setProPickAdEarnedGameId(id);
    pendingAdGameIdRef.current = id;
    setProPickUnlockedGameId(id);
    void startProPickUnlockPollNative(id);
  };

  /** 広告が出たらすぐ中身を出す。サーバー確認は裏で続ける */
  const showSdkProPickAd = async () => {
    const copy = proPickAdCopy(language);
    const uid = fUser?.uid;
    if (!gameId || !uid) return;
    const result = presentRewardedAd
      ? await presentRewardedAd({ gameId, userId: uid })
      : await showProPickRewardedAdNative({
          userId: uid,
          gameId,
          onPresented: () => markProPickAdSession(gameId),
        });
    if (result === "error" && peekProPickAdEarnedGameId() !== gameId) {
      cyberAlert(copy.adModalTitle, copy.adUnavailable);
      return;
    }
    markProPickAdSession(gameId);
  };

  const resumedAdRef = useRef(false);
  useEffect(() => {
    if (!gameId || resumedAdRef.current) return;
    const earnedId = peekProPickAdEarnedGameId();
    if (earnedId !== gameId && !resumeAfterRewardedAd) return;
    resumedAdRef.current = true;
    setTab("insight");
    setVisited((cur) => (cur.has("insight") ? cur : new Set(cur).add("insight")));
    if (earnedId !== gameId) return;
    markProPickAdSession(gameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- シートを開き直した 1 回だけ
  }, [gameId, resumeAfterRewardedAd]);

  const runProPickUnlock = async (adWatched: boolean) => {
    if (!gameId) return;
    setProPickUnlockBusy(true);
    try {
      if (
        !adWatched &&
        (pendingAdGameIdRef.current === gameId || peekProPickAdEarnedGameId() === gameId)
      ) {
        markProPickAdSession(gameId);
        return;
      }
      const r = await requestProPickUnlock({ apiBase: apiBaseUrl, gameId, adWatched });
      if (r?.unlocked) {
        setProPickUnlockedGameId(gameId);
        return;
      }
      if (r?.needsAd) {
        if (PRO_PICK_AD_SDK_ENABLED && !adWatched) {
          await showSdkProPickAd();
        } else {
          setProPickAdOpen(true);
        }
        return;
      }
      cyberAlert(proPickAdCopy(language).adModalTitle, proPickAdCopy(language).adUnavailable);
    } finally {
      setProPickUnlockBusy(false);
    }
  };

  useEffect(() => {
    const available =
      !tutorialMode &&
      !effectivePro &&
      !preseason &&
      firstFreeAvailable &&
      !teaserUnlocked &&
      !teaserLoading;
    onFirstFreeOffer?.(available);
    return () => onFirstFreeOffer?.(false);
  }, [
    tutorialMode,
    effectivePro,
    preseason,
    firstFreeAvailable,
    teaserUnlocked,
    teaserLoading,
    onFirstFreeOffer,
  ]);

  const insightUnread = useProInsightUnreadNative({
    gameId,
    version: insightAvailable && !briefLoading ? insightUpdatedAt : null,
    viewing: tab === "insight",
  });

  const { report: liveInjury, loading: injuryLoading } =
    useNbaMatchupInjuryReport({
      homeTeamId,
      awayTeamId,
      override: injuryReport,
      apiBaseUrl,
      enabled: visited.has("info"),
      language: language === "ja" ? "ja" : "en",
      tipAtMs,
    });
  const { stats: liveStats, loading: statsLoading } = useNbaMatchupTeamStats({
    homeTeamId,
    awayTeamId,
    override: teamStats,
    apiBaseUrl,
    enabled: visited.has("info") || visited.has("trend"),
  });
  const { roster: liveRoster } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    override: roster,
    apiBaseUrl,
    enabled: visited.has("info"),
  });
  const { trend, loading: trendLoading } = useNbaMatchupTrend({
    homeTeamId,
    awayTeamId,
    apiBaseUrl,
    tipAtMs,
    enabled: visited.has("trend"),
  });

  const resolvedInjury = liveInjury;
  const resolvedStats = liveStats;
  const resolvedRoster = liveRoster;

  /** チュートリアル・オーバーレイからタブ切替（CyberSlantedTab は触らない） */
  useEffect(
    () =>
      registerTutorialPredictToolsListener((next) => {
        setTab(next);
        setVisited((cur) => (cur.has(next) ? cur : new Set(cur).add(next)));
      }),
    []
  );

  const openProSubscribe = (source: ProFunnelSource = "insight") => {
    setProSubscribeSourceNative(source);
    if (onOpenProSubscribe) {
      onOpenProSubscribe();
      return;
    }
    openProSubscribeNative();
  };

  const openProSubscribeFromTeaser = () => {
    trackProFunnelNative("insight_teaser_tap");
    openProSubscribe("insight_teaser");
  };

  return (
    <TutorialTargetNative id="predict-tools">
      <View style={styles.root}>
        <View ref={panelRef} collapsable={false}>
        {tab ? (
          <View style={styles.panel}>
            {tab === "insight" ? (
              preseason ? (
                <PendingPanel text={proInsightPreseasonNotice(language)} />
              ) : !proPickAccess && teaserLoading ? (
                <LoadingPanel label={loadingLabel} />
              ) : !proPickAccess && teaser && !teaserHasKit ? (
                <PredictProInsightTeaserPanelNative
                  teaser={teaser}
                  language={language}
                  homeTeamName={homeTeamName}
                  awayTeamName={awayTeamName}
                  onPressUpgrade={openProSubscribeFromTeaser}
                />
              ) : !proPickAccess && !teaserHasKit && !forceFree ? (
                <PendingPanel text={insightPendingText} />
              ) : !proPickAccess ? (
                <PredictProBriefPanelNative
                  brief={null}
                  language={language}
                  homeTeamId={homeTeamId ?? ""}
                  awayTeamId={awayTeamId ?? ""}
                  homeTeamName={homeTeamName}
                  awayTeamName={awayTeamName}
                  locked
                  onPressUpgrade={() => openProSubscribe()}
                  onPressProPickUnlock={
                    gameId && (firstFreeAvailable || PRO_PICK_AD_UI_ENABLED)
                      ? () => void runProPickUnlock(false)
                      : undefined
                  }
                  firstFreeAvailable={firstFreeAvailable}
                  unlockBusy={proPickUnlockBusy}
                  unlockConfirming={false}
                  kitRecord={kitRecord}
                  crowd={crowd}
                />
              ) : predictKit && homeTeamId && awayTeamId ? (
                <PredictProInsightKitNative
                  kit={predictKit}
                  homeTeamId={homeTeamId}
                  awayTeamId={awayTeamId}
                  language={language}
                  crowd={crowd}
                  showHeader={false}
                />
              ) : liveNarrative ? (
                <PredictProInsightNarrativePanelNative
                  brief={liveNarrative}
                  language={language}
                  homeTeamName={homeTeamName}
                  awayTeamName={awayTeamName}
                />
              ) : briefLoading ? (
                <LoadingPanel label={loadingLabel} />
              ) : (
                <PendingPanel text={insightPendingText} />
              )
            ) : tab === "info" ? (
              <View style={styles.infoFrame}>
                {resolvedInjury ? null : (
                  <Text style={styles.infoHeading}>INJURY</Text>
                )}
                {resolvedInjury ? (
                  <NbaInjuryReportPanelNative
                    report={resolvedInjury}
                    roster={resolvedRoster}
                    language={language}
                    heading="INJURY"
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
                )}
                {resolvedStats ? (
                  <NbaTeamStatsPanelNative
                    data={resolvedStats}
                    isPro={isPro}
                    language={language}
                    onOpenTeamDetail={onOpenTeamDetail}
                    bare
                    records={
                      trend
                        ? {
                            home: trend.home.season
                              ? { ...trend.home.season, last10: trend.home.last10 }
                              : null,
                            away: trend.away.season
                              ? { ...trend.away.season, last10: trend.away.last10 }
                              : null,
                          }
                        : null
                    }
                  />
                ) : statsLoading ? (
                  <LoadingPanel label={loadingLabel} />
                ) : (
                  <PendingPanel text={t.panelDataPending} />
                )}
              </View>
            ) : trend && homeTeamId && awayTeamId ? (
              <View style={styles.infoFrame}>
                <NbaMatchupTrendPanelNative
                  trend={trend}
                  homeTeamId={homeTeamId}
                  awayTeamId={awayTeamId}
                  language={language}
                  homeForm={
                    resolvedStats?.season.home.recentFormGames ??
                    resolvedStats?.last10.home.recentFormGames ??
                    []
                  }
                  awayForm={
                    resolvedStats?.season.away.recentFormGames ??
                    resolvedStats?.last10.away.recentFormGames ??
                    []
                  }
                />
              </View>
            ) : trendLoading ? (
              <LoadingPanel label={loadingLabel} />
            ) : (
              <PendingPanel text={t.panelDataPending} />
            )}
          </View>
        ) : null}
        </View>
        <TutorialTargetNative id="predict-tools-tabs">
          <View style={styles.tabShell}>
            <CyberSlantedTabBarNative fill>
              <CyberSlantedTabNative
                label="PRO PICK"
                active={tab === "insight"}
                onPress={() => selectTab("insight")}
                theme={PRO_PICK_TAB_THEME}
                compact
                fontWeight="700"
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === "insight" }}
              />
              <CyberSlantedTabNative
                label="INFORMATION"
                active={tab === "info"}
                onPress={() => selectTab("info")}
                compact
                fontWeight="700"
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === "info" }}
              />
              <CyberSlantedTabNative
                label="TREND"
                active={tab === "trend"}
                onPress={() => selectTab("trend")}
                compact
                fontWeight="700"
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === "trend" }}
              />
            </CyberSlantedTabBarNative>
            {insightUnread ? (
              <View pointerEvents="none" style={styles.dotRow}>
                <View style={styles.dotCell}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: TODAY_UNITERZ_DOT_COLOR,
                        shadowColor: TODAY_UNITERZ_DOT_COLOR,
                      },
                    ]}
                  />
                </View>
                <View style={styles.dotCell} />
                <View style={styles.dotCell} />
              </View>
            ) : null}
          </View>
        </TutorialTargetNative>
      </View>
      <ProPickAdMockModalNative
        visible={proPickAdOpen}
        language={language}
        onCancel={() => setProPickAdOpen(false)}
        onWatched={() => {
          setProPickAdOpen(false);
          if (gameId) markProPickAdSession(gameId);
          void runProPickUnlock(true);
        }}
      />
    </TutorialTargetNative>
  );
}

/** 選択時は金の焼き込み素材、非選択は金の枠と文字 */
const PRO_PICK_TAB_THEME: CyberSlantedTabThemeNative = { accent: "#F6C344" };

const styles = StyleSheet.create({
  root: {
    width: "100%",
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
  /** INJURY から STATS までを一つの枠にする */
  infoFrame: {
    gap: 14,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "rgba(0,14,20,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.32)",
  },
  infoHeading: {
    color: "rgba(0,245,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textAlign: "center",
  },
  /** INSIGHT 未読の点。タブバーと同じ 3 等分（左右 12 · gap 8）で INSIGHT の右上に重ねる */
  dotRow: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 0,
    flexDirection: "row",
    gap: 8,
  },
  dotCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  dot: {
    position: "absolute",
    top: 2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 999,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  panel: {
    minHeight: 120,
    width: "100%",
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  pending: {
    borderRadius: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "transparent",
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
