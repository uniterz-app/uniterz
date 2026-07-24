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
import {
  type MobileMetric,
} from "../../../../../lib/rankings/rankingMetrics";
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import {
  buildMyRankMiniMetrics,
  isMyRankMiniMetricsReady,
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
import type { Language } from "../../../../../lib/i18n/language";
import { getRankingsScheduleNoticeText } from "../../../../../lib/rankings/getRankingsScheduleNoticeText";
import BracketLeaderboardSectionNative from "./BracketLeaderboardSectionNative";
import WcBracketLeaderboardSectionNative from "./WcBracketLeaderboardSectionNative";
import SideMenuDrawerNative from "../../ui/SideMenuDrawerNative";
import WcRankingStageTabsNative from "./WcRankingStageTabsNative";
import RankingsDrawerMenuNative from "./RankingsDrawerMenuNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";
import { CandleChartLoaderNative } from "../../components/CandleChartLoaderNative";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useNativeCumulativeRankingsBulk } from "./useNativeCumulativeRankingsBulk";
import { useNativeMyRankingUser } from "./useNativeMyRankingUser";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsPageTitleCyberNative } from "./RankingsPageTitleCyberNative";
import {
  MyRankCardNative,
  PlayoffRoundTabsNative,
  RankingListCardNative,
  RankingsCategoryTabsNative,
  RankingsMetricRowNative,
  RankingsTopPodiumNative,
} from "./RankingsUiParts";
import type { MyRankCardShareState } from "./RankingsMyRankCardNative";
import RankingsListEntranceRowNative from "./RankingsListEntranceRowNative";
import RankGapModalNative from "./RankGapModalNative";
import { useNativeMyRankProgress } from "./useNativeMyRankProgress";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";

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
  const [gapOpen, setGapOpen] = useState(false);
  const [rankShare, setRankShare] = useState<MyRankCardShareState | null>(null);
  const [rankingsLeague, setRankingsLeague] = useState<"nba" | "wc">("wc");
  const [wcStage, setWcStage] = useState<WcRankingStage>("main");

  const wcStageForHook: WcRankingStage | null =
    category === "playoffs" && rankingsLeague === "wc" ? wcStage : null;

  const { listReady, personalPending, myUid, byMetric, ensureMetric } =
    useNativeCumulativeRankingsBulk(
      "playoffs",
      rankingsLeague === "wc" ? "overall" : round,
      wcStageForHook
    );
  const { user } = useNativeMyRankingUser(myUid);
  const language = user.language;
  const t = rankingsTexts(language);

  const rankingLeagueSource = rankingsLeague === "wc" ? "worldcup" : "nba";

  /**
   * Ranking Progress（日次順位推移）。
   * Web と同様: NBA は playoffs で表示、WC は Pro のみ。
   */
  const rankProgressEnabled =
    category === "playoffs" &&
    (rankingsLeague === "nba" || user.plan === "pro");
  const { points: myRankProgressPoints, loading: myRankProgressLoading } =
    useNativeMyRankProgress({
      uid: myUid,
      enabled: rankProgressEnabled,
      rankingLeague: rankingLeagueSource,
      wcStage: rankingsLeague === "wc" ? wcStage : null,
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

  const precApiKey = rankingsLeague === "wc" ? "totalExactHits" : "totalPrecision";

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
  const { myRank, myRankDeltaPlaces } = useMemo(
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
  const myStatsRow =
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ?? myRawRow;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count) ? bundle.count : 0;

  const myValue = useMemo(
    () => getMyMetricValue(metric, myRawRow),
    [metric, myRawRow]
  );

  const winRateMinPosts = computeWinRateMinPosts(
    rankingsLeague === "wc" ? "worldcup" : "nba",
    wcStageForHook
  );
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

  const cardBarsReady = isMyRankMiniMetricsReady(byMetric, rankingLeagueSource);
  const pageTitle = rankingsLeague === "wc" ? t.titleWorldCup : t.title;

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
  const listEntranceKey = `${rankingsLeague}-${category}-${metric}-${wcStage}-${round}`;

  const openProfile = (row: RankingRowWithCountry) => {
    const key = profilePathKeyFromRow(row);
    if (!key) return;
    navigation.navigate("ProfileTab", {
      screen: "PublicProfile",
      params: { handle: key, fromRankings: true },
    });
  };

  return (
    <View style={styles.root}>
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
            <RankingsPageTitleCyberNative title={pageTitle} />
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
          {rankingsLeague === "nba" || rankingsLeague === "wc" ? (
            <RankingsCategoryTabsNative
              category={category}
              onChange={setCategory}
              language={language}
              league={rankingsLeague}
            />
          ) : null}

          {category === "playoffs" ? (
            <>
              {rankingsLeague === "nba" ? (
                <PlayoffRoundTabsNative round={round} onChange={setRound} language={language} />
              ) : null}
              {rankingsLeague === "wc" && category === "playoffs" ? (
                <WcRankingStageTabsNative
                  stage={wcStage}
                  onChange={setWcStage}
                  language={language}
                />
              ) : null}

              <MyRankCardNative
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={user.displayName?.trim() ?? ""}
                photoURL={user.photoURL || null}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number" ? myRawRow.totalPosts : undefined
                }
                loading={!listReady}
                statsScramble={listReady && personalPending}
                isPro={user.plan === "pro"}
                displayTier={user.plan === "pro" ? "pro" : "free"}
                rankDeltaPlaces={rankingHasNoEntries ? null : myRankDeltaPlaces}
                totalEntries={rankingHasNoEntries ? null : rankingListCount}
                miniMetrics={myMiniMetrics}
                statsSource={{
                  totalPosts: myStatsRow?.totalPosts,
                  totalPoints: myStatsRow?.totalPoints,
                  totalPrecision: myStatsRow?.totalPrecision,
                  totalUpset: myStatsRow?.totalUpset,
                }}
                barsReady={cardBarsReady}
                language={language}
                mobileWide
                leagueLabel={rankingsLeague === "wc" ? "WORLD CUP" : "NBA"}
                onShareStateChange={setRankShare}
                rankTierGap={user.plan === "pro" ? rankTierGap : null}
                gapHref={user.plan === "pro" ? "gap" : null}
                onOpenGap={() => setGapOpen(true)}
                rankProgress={
                  rankProgressEnabled ? (myRankProgressPoints ?? []) : undefined
                }
                rankProgressLoading={
                  rankProgressEnabled && myRankProgressLoading
                }
              />
            </>
          ) : null}
        </View>

        {category === "bracket" ? (
          rankingsLeague === "wc" ? (
            <WcBracketLeaderboardSectionNative language={language} />
          ) : (
            <BracketLeaderboardSectionNative language={language} />
          )
        ) : null}

        {category === "playoffs" ? (
          <>
            <View style={styles.metricRowWrap}>
              <RankingsMetricRowNative
                metrics={metricItems}
                metric={metric}
                onChange={setMetric}
                language={language}
                gridColumns={rankingsLeague === "wc" ? 3 : undefined}
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
                <Text style={styles.noData}>{t.noData}</Text>
              </View>
            ) : (
              <View style={styles.listSection}>
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
          onChange={(l) => {
            setRankingsLeague(l);
            if (l === "wc") setCategory("playoffs");
            setMenuOpen(false);
          }}
          language={language}
          onOpenSquadBattlePreview={() => {
            setMenuOpen(false);
            stackNavigation.navigate("SquadBattlePreview");
          }}
        />
      </SideMenuDrawerNative>

      <RankGapModalNative
        visible={gapOpen}
        onClose={() => setGapOpen(false)}
        language={language}
        currentRank={rankingHasNoEntries ? null : myRank}
        myTotalPoints={myTotalPoints}
        totalEntries={rankingHasNoEntries ? null : rankingListCount}
        rankTierGap={rankTierGap}
      />
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
  listSection: {
    marginTop: 4,
    gap: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  restList: {
    gap: 0,
    paddingTop: 0,
  },
});
