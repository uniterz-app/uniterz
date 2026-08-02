import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  PRO_LEAGUE_ATMOSPHERE,
  PRO_LEAGUE_TAB_THEME,
} from "../../../../../lib/rankings/proLeagueAtmosphere";
import {
  type MobileMetric,
} from "../../../../../lib/rankings/rankingMetrics";
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import {
  buildMyRankMiniMetrics,
} from "../../../../../lib/rankings/buildMyRankMiniMetrics";
import { resolveMyRankForCard, getMyMetricValue, computeWinRateMinPosts } from "../../../../../lib/rankings/rankingsPageShared";
import { buildRankTierGapHint } from "../../../../../lib/rankings/rankTierMilestone";
import { sortRankingRowsByMetric } from "../../../../../lib/rankings/sortRankingRows";
import {
  visibleMetricsForLeague,
} from "../../../../../lib/rankings/wcVisibleMetrics";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "../../../../../lib/rankings/rankingTransform";
import type { RankingRow } from "../../../../../lib/rankings/cumulativeRankingRow";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import type { MainTabParamList, RankingsStackParamList } from "../../navigation/types";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import type { Language } from "../../../../../lib/i18n/language";
import { getRankingsScheduleNoticeText } from "../../../../../lib/rankings/getRankingsScheduleNoticeText";
import BracketLeaderboardSectionNative from "./BracketLeaderboardSectionNative";
import SideMenuDrawerNative from "../../ui/SideMenuDrawerNative";
import RankingsDrawerMenuNative from "./RankingsDrawerMenuNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";
import { CandleChartLoaderNative } from "../../components/CandleChartLoaderNative";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useNativeCumulativeRankingsBulk } from "./useNativeCumulativeRankingsBulk";
import { useNativeOpenSeasonRankingsBulk } from "./useNativeOpenSeasonRankingsBulk";
import { useNativePeriodRankingsBulk } from "./useNativePeriodRankingsBulk";
import { useNativeMyRankingUser } from "./useNativeMyRankingUser";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsPageTitleCyberNative } from "./RankingsPageTitleCyberNative";
import {
  MyRankCardNative,
  PlayoffRoundTabsNative,
  RankingListCardNative,
  RankingsMetricRowNative,
  RankingsTopPodiumNative,
} from "./RankingsUiParts";
import { RankingsPeriodTabsNative } from "./RankingsPeriodTabsNative";
import { RankingsPeriodLabelNavNative } from "./RankingsPeriodLabelNavNative";
import type { MyRankCardShareState } from "./RankingsMyRankCardNative";
import RankingsListEntranceRowNative from "./RankingsListEntranceRowNative";
import { useNativeMyRankProgress } from "./useNativeMyRankProgress";
import { useNativeMyRankCardFast } from "./useNativeMyRankCardFast";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";
import { RankingsDivisionTabsNative } from "./RankingsDivisionTabsNative";
import { RankingsProLeagueTeaserNative } from "./RankingsProLeagueTeaserNative";
import {
  divisionFromNbaBoard,
  type NbaRankingBoard,
} from "../../../../../lib/rankings/rankingDivision";
import type { RankingPeriod } from "../../../../../lib/rankings/rankingPeriod";
import { periodWinRateMinPosts } from "../../../../../lib/rankings/rankingPeriod";

type Props = {
  bottomReserveY: number;
};

function scheduleNoticeForUser(language: RankingsLanguage): string {
  const lang = (language === "en" ? "en" : "ja") as Language;
  return getRankingsScheduleNoticeText(lang);
}

export default function RankingsHomeScreen({ bottomReserveY }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<RankingsStackParamList>>();
  const { topContentPadY } = useBottomTabBarInsets();
  const [category, setCategory] = useState<"playoffs" | "bracket">("playoffs");
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankShare, setRankShare] = useState<MyRankCardShareState | null>(null);
  const rankingsLeague = "nba" as const;
  const [nbaBoard, setNbaBoard] = useState<NbaRankingBoard>("regular");
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("season");
  const [periodLabel, setPeriodLabel] = useState<string | null>(null);
  const wcStageForHook: WcRankingStage | null = null;

  /** Regular / PRO LEAGUE は Season・Weekly・Monthly。Playoffs はラウンド別。 */
  const showNbaPeriodTabs =
    rankingsLeague === "nba" &&
    (nbaBoard === "regular" || nbaBoard === "open");
  const usePeriodBoard =
    showNbaPeriodTabs && rankingPeriod !== "season";
  const useOpenSeasonBoard =
    rankingsLeague === "nba" &&
    nbaBoard === "open" &&
    rankingPeriod === "season" &&
    category === "playoffs";
  const rankingDivision = divisionFromNbaBoard(nbaBoard);

  const standardBulk = useNativeCumulativeRankingsBulk(
    "playoffs",
    nbaBoard === "playoffs" ? round : "overall",
    wcStageForHook
  );
  const openSeasonBulk = useNativeOpenSeasonRankingsBulk(useOpenSeasonBoard);
  const periodBulk = useNativePeriodRankingsBulk(
    usePeriodBoard
      ? (rankingPeriod as Exclude<RankingPeriod, "season">)
      : null,
    periodLabel,
    rankingDivision
  );

  const { listReady, personalPending, myUid, byMetric, ensureMetric } =
    useOpenSeasonBoard
      ? openSeasonBulk
      : usePeriodBoard
        ? periodBulk
        : standardBulk;
  const { user } = useNativeMyRankingUser(myUid);
  const language = user.language;
  const t = rankingsTexts(language);

  const rankingLeagueSource = "nba" as const;

  useEffect(() => {
    if (rankingsLeague !== "nba" && nbaBoard !== "regular") {
      setNbaBoard("regular");
    }
  }, [rankingsLeague, nbaBoard]);

  useEffect(() => {
    setPeriodLabel(null);
  }, [rankingPeriod, rankingsLeague, nbaBoard]);

  useEffect(() => {
    if (!showNbaPeriodTabs && rankingPeriod !== "season") {
      setRankingPeriod("season");
    }
  }, [showNbaPeriodTabs, rankingPeriod]);

  const openProLocked =
    rankingsLeague === "nba" &&
    nbaBoard === "open" &&
    (user.plan !== "pro" ||
      openSeasonBulk.proRequired ||
      periodBulk.proRequired);

  /**
   * Ranking Progress（日次順位推移）。
   * Free / Pro カードは常に displayTier を渡す（プレビューと同系）。
   * Season 累計ボードのみ cumulative_stats 1-read でカード先行。
   */
  const myRankCardFastEnabled =
    !usePeriodBoard &&
    !useOpenSeasonBoard &&
    rankingsLeague === "nba" &&
    category === "playoffs";
  const cardFast = useNativeMyRankCardFast(myUid, {
    enabled: myRankCardFastEnabled,
  });

  const myRankCardTier: "free" | "pro" =
    (cardFast.plan === "pro" || user.plan === "pro") ? "pro" : "free";
  const rankProgressHidden =
    rankingsLeague === "nba" && rankingPeriod !== "season";
  const rankProgressEnabled =
    category === "playoffs" &&
    !rankProgressHidden &&
    myRankCardTier === "pro" &&
    metric === "totalScore" &&
    (rankingsLeague === "nba" || user.plan === "pro");
  const { points: myRankProgressPoints, loading: myRankProgressLoading } =
    useNativeMyRankProgress({
      uid: myUid,
      enabled: rankProgressEnabled,
      rankingLeague: rankingLeagueSource,
      wcStage: null,
      seedPoints: myRankCardFastEnabled ? cardFast.rankProgressPoints : null,
      seedComplete:
        myRankCardFastEnabled && cardFast.rankProgressSeedComplete,
    });

  useEffect(() => {
    if (category !== "playoffs") {
      setRankShare(null);
    }
  }, [category]);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];

  useEffect(() => {
    void ensureMetric(apiKey);
  }, [apiKey, ensureMetric]);

  const precApiKey =
    "totalGoalScorerHits";

  useEffect(() => {
    if (!listReady) return;
    void ensureMetric(precApiKey);
    void ensureMetric("totalUpset");
  }, [listReady, ensureMetric, precApiKey]);

  const visibleMetrics = useMemo(
    () => visibleMetricsForLeague(rankingLeagueSource),
    [rankingLeagueSource]
  );

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  const rawRows = useMemo(
    () => (Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : []),
    [bundle?.rows]
  );

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return sortRankingRowsByMetric(metric, toMobileRows(metric, rawRows));
  }, [metric, rawRows]);

  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const { myRank: listMyRank, myRankDeltaPlaces: listMyRankDelta } = useMemo(
    () =>
      resolveMyRankForCard({
        myUid,
        myRank: bundle?.myRank,
        myRankDeltaPlaces: bundle?.myRankDeltaPlaces,
        myRow: myRawRow,
        listRows: rawRows,
      }),
    [
      myUid,
      bundle?.myRank,
      bundle?.myRankDeltaPlaces,
      myRawRow,
      rawRows,
    ]
  );
  const myRank =
    (myRankCardFastEnabled && !cardFast.loading
      ? cardFast.myRank
      : null) ?? listMyRank;
  const myRankDeltaPlaces =
    (myRankCardFastEnabled ? cardFast.myRankDeltaPlaces : null) ??
    listMyRankDelta;
  const myStatsRow =
    (myRankCardFastEnabled
      ? (cardFast.myRow as RankingRow | null)
      : null) ??
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ??
    myRawRow;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count) ? bundle.count : 0;

  const myValue = useMemo(
    () => getMyMetricValue(metric, myRawRow ?? myStatsRow),
    [metric, myRawRow, myStatsRow]
  );

  const winRateMinPosts = usePeriodBoard
    ? periodWinRateMinPosts(rankingPeriod as Exclude<RankingPeriod, "season">)
    : computeWinRateMinPosts("nba");
  const rankingHasNoEntries =
    listReady && (rows.length === 0 || rankingListCount === 0);

  const metricItems = visibleMetrics;

  const myMiniMetrics = useMemo(
    () =>
      buildMyRankMiniMetrics(
        myStatsRow,
        {
          ptsRows: byMetric?.totalPoints?.rows as RankingRow[] | undefined,
          precRows: byMetric?.[precApiKey]?.rows as RankingRow[] | undefined,
          upsetRows: byMetric?.totalUpset?.rows as RankingRow[] | undefined,
        },
        null,
        rankingLeagueSource
      ),
    [
      myStatsRow,
      byMetric?.totalPoints?.rows,
      byMetric?.[precApiKey]?.rows,
      byMetric?.totalUpset?.rows,
      rankingLeagueSource,
      precApiKey,
    ]
  );

  const cardLoading =
    !listReady &&
    !(myRankCardFastEnabled && !cardFast.loading && cardFast.myRow != null);

  const pageTitle =
    nbaBoard === "open"
      ? t.divisionOpen
      : nbaBoard === "playoffs"
        ? t.nbaBoardPlayoffs
        : t.nbaBoardRegular;

  const myTotalPoints =
    typeof myStatsRow?.totalPoints === "number" ? myStatsRow.totalPoints : 0;
  const totalPointsRows = useMemo(() => {
    const src = byMetric?.totalPoints?.rows as RankingRow[] | undefined;
    return Array.isArray(src)
      ? src.map((row, index) => ({
          rank:
            typeof row.rank === "number" && Number.isFinite(row.rank)
              ? Math.floor(row.rank)
              : index + 1,
          totalPoints: row.totalPoints,
        }))
      : [];
  }, [byMetric?.totalPoints?.rows]);

  const rankTierGap = useMemo(() => {
    if (myRank == null || myRank < 1 || rankingHasNoEntries) return null;
    return buildRankTierGapHint({
      currentRank: myRank,
      myTotalPoints,
      cutoffRows: totalPointsRows,
    });
  }, [myRank, myTotalPoints, rankingHasNoEntries, totalPointsRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);
  const listEntranceKey = `${rankingsLeague}-${category}-${metric}-${round}`;

  const openProfile = (row: RankingRowWithCountry) => {
    const key = profilePathKeyFromRow(row);
    if (!key) return;
    navigateToPublicProfileNative(navigation, {
      handle: key,
      fromRankings: true,
    });
  };

  return (
    <View style={styles.root}>
      {nbaBoard === "open" ? (
        <LinearGradient
          pointerEvents="none"
          colors={["#0c0716", PRO_LEAGUE_ATMOSPHERE.bgDeep, "#050308"]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <ScrollView
        style={styles.scrollLayer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topContentPadY, paddingBottom: bottomReserveY + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <CyberMenuButton
            size="sm"
            accessibilityLabel={language === "ja" ? "メニュー" : "Menu"}
            onPress={() => setMenuOpen(true)}
          />
          <View style={styles.titleCenterCol}>
            <RankingsPageTitleCyberNative
              title={pageTitle}
              tone={nbaBoard === "open" ? "pro-league" : "default"}
            />
            <Text style={styles.scheduleNoticeInline} maxFontSizeMultiplier={1.1}>
              {scheduleNoticeForUser(language)}
            </Text>
          </View>
          <CyberChamferButtonNative
            size="sm"
            embedded
            variant="share"
            onPress={() => rankShare?.share()}
            disabled={!rankShare?.canShare || rankShare?.sharing}
            accessibilityLabel={t.shareMyRank}
            style={styles.titleSideBtn}
          />
        </View>

        <View style={styles.section}>
          {showNbaPeriodTabs ? (
            <RankingsDivisionTabsNative
              division={rankingDivision}
              onChange={(next) =>
                setNbaBoard(next === "open" ? "open" : "regular")
              }
              language={language}
            />
          ) : null}

          {showNbaPeriodTabs ? (
            <RankingsPeriodTabsNative
              period={rankingPeriod}
              onChange={setRankingPeriod}
              language={language}
              tabTheme={
                nbaBoard === "open" ? PRO_LEAGUE_TAB_THEME : undefined
              }
            />
          ) : null}

          {usePeriodBoard ? (
            <RankingsPeriodLabelNavNative
              period={rankingPeriod as Exclude<RankingPeriod, "season">}
              activeLabel={periodBulk.activeLabel}
              availableLabels={periodBulk.availableLabels}
              onChange={setPeriodLabel}
              language={language}
            />
          ) : null}

          {category === "playoffs" ? (
            <>
              {rankingsLeague === "nba" && nbaBoard === "playoffs" ? (
                <PlayoffRoundTabsNative round={round} onChange={setRound} language={language} />
              ) : null}

              {openProLocked ? null : (
              <MyRankCardNative
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={user.displayName?.trim() ?? ""}
                photoURL={user.photoURL || null}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number" ? myRawRow.totalPosts : undefined
                }
                loading={cardLoading}
                statsScramble={listReady && personalPending && !cardFast.myRow}
                isPro={myRankCardTier === "pro"}
                displayTier={myRankCardTier}
                rankDeltaPlaces={rankingHasNoEntries ? null : myRankDeltaPlaces}
                totalEntries={rankingHasNoEntries ? null : rankingListCount}
                miniMetrics={myMiniMetrics}
                statsSource={{
                  totalPosts: myStatsRow?.totalPosts,
                  totalPoints: myStatsRow?.totalPoints,
                  totalUpset: myStatsRow?.totalUpset,
                }}
                language={language}
                mobileWide
                leagueLabel={
                  nbaBoard === "open"
                    ? "PRO LEAGUE"
                    : nbaBoard === "playoffs"
                      ? "PLAYOFFS"
                      : "NBA"
                }
                onShareStateChange={setRankShare}
                rankTierGap={myRankCardTier === "pro" ? rankTierGap : null}
                rankProgress={
                  rankProgressEnabled ? (myRankProgressPoints ?? []) : undefined
                }
                rankProgressLoading={
                  rankProgressEnabled && myRankProgressLoading
                }
                hideRankProgress={rankProgressHidden}
              />
              )}
            </>
          ) : null}
        </View>

        {category === "bracket" ? (
            <BracketLeaderboardSectionNative language={language} />
        ) : null}

        {category === "playoffs" && openProLocked ? (
          <RankingsProLeagueTeaserNative
            language={language}
            onPressSubscribe={() =>
              navigation.navigate("ProfileTab", {
                screen: "ProSubscribe",
              })
            }
            onBackToPickUp={() => setNbaBoard("regular")}
          />
        ) : category === "playoffs" ? (
          <>
            <View style={styles.metricRowWrap}>
              <RankingsMetricRowNative
                metrics={metricItems}
                metric={metric}
                onChange={setMetric}
                language={language}
                gridColumns={undefined}
                tabTheme={
                  nbaBoard === "open" ? PRO_LEAGUE_TAB_THEME : undefined
                }
              />
            </View>

            {metric === "winRate" ? (
              <Text style={styles.winRateHint}>
                {winRateMinPosts > 1 ? t.winRateMin(winRateMinPosts) : t.winRateNoMin}
              </Text>
            ) : null}

            {!listReady ? (
              <View style={styles.loadingWrap}>
                <CandleChartLoaderNative scale={0.85} label={t.loading} />
              </View>
            ) : rankingHasNoEntries ? (
              <View style={styles.noDataWrap}>
                <Text
                  style={[
                    styles.noData,
                    nbaBoard === "open" ? styles.noDataPro : null,
                  ]}
                >
                  {t.noData}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.listSection,
                  nbaBoard === "open" ? styles.listSectionPro : null,
                ]}
              >
                <RankingsTopPodiumNative
                  rows={top3}
                  metric={metric}
                  language={language}
                  onPressProfile={openProfile}
                  entranceKey={listEntranceKey}
                />
                <View style={styles.restList}>
                  {restRows.map((row, index) => (
                    <RankingsListEntranceRowNative
                      key={`${metric}-${row.uid}`}
                      index={index + 3}
                      entranceKey={listEntranceKey}
                      staggerMs={58}
                    >
                      <RankingListCardNative
                        row={row}
                        rank={index + 4}
                        metric={metric}
                        language={language}
                        onPress={() => openProfile(row)}
                      />
                    </RankingsListEntranceRowNative>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
      <SideMenuDrawerNative open={menuOpen} onClose={() => setMenuOpen(false)}>
        <RankingsDrawerMenuNative
          league={rankingsLeague}
          nbaBoard={nbaBoard}
          onChange={() => {
            setNbaBoard("regular");
            setMenuOpen(false);
          }}
          onSelectNbaRegular={() => {
            setNbaBoard("regular");
            setCategory("playoffs");
            setMenuOpen(false);
          }}
          onSelectNbaPlayoffs={() => {
            setNbaBoard("playoffs");
            setCategory("playoffs");
            setMenuOpen(false);
          }}
          language={language}
          onOpenSquadBattlePreview={() => {
            setMenuOpen(false);
            stackNavigation.navigate("SquadBattlePreview");
          }}
        />
      </SideMenuDrawerNative>

      <TutorialLiveHostNative
        page="rankings"
        language={(language === "en" ? "en" : "ja") as Language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },
  scrollLayer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  titleCenterCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
  },
  titleSideBtn: {
    flexShrink: 0,
  },
  scheduleNoticeInline: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  section: {
    gap: 2,
    marginBottom: 0,
  },
  metricRowWrap: {
    marginTop: 12,
    marginBottom: 2,
    /** 発光のはみ出し用。行間は RankingsMetricRowNative 側で調整 */
    paddingVertical: 4,
    overflow: "visible",
  },
  bracketPlaceholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bracketPlaceholderText: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  winRateHint: {
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 4,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    lineHeight: 16,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  noDataWrap: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  noData: {
    color: "rgba(248,250,252,0.35)",
    fontSize: 28,
    letterSpacing: 4,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "BebasNeue_400Regular",
    }),
  },
  noDataPro: {
    color: PRO_LEAGUE_ATMOSPHERE.noData,
  },
  listSection: {
    marginTop: 4,
    gap: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  listSectionPro: {
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.panelBg,
  },
  restList: {
    gap: 0,
    paddingTop: 0,
  },
});
