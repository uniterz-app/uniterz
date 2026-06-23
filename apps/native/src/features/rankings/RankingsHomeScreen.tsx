import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import {
  type MobileMetric,
} from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import {
  buildMyRankMiniMetrics,
  isMyRankMiniMetricsReady,
} from "../../../../../lib/rankings/buildMyRankMiniMetrics";
import {
  visibleMetricsForLeague,
} from "../../../../../lib/rankings/wcVisibleMetrics";
import {
  buildRankingsPageKey,
  computeRankingHasNoEntries,
  computeRankingListContentReady,
} from "../../../../../lib/rankings/rankingsPageShared";
import { useRankingsTopDone } from "../../../../../lib/hooks/useRankingsTopDone";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "../../../../../lib/rankings/rankingTransform";
import type { RankingRow } from "../../../../../lib/rankings/useRanking";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import type { MainTabParamList } from "../../navigation/types";
import type { Language } from "../../../../../lib/i18n/language";
import { getRankingsScheduleNoticeText } from "../../../../../lib/rankings/getRankingsScheduleNoticeText";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import BracketLeaderboardSectionNative from "./BracketLeaderboardSectionNative";
import SideMenuDrawerNative from "../../ui/SideMenuDrawerNative";
import WcRankingStageTabsNative from "./WcRankingStageTabsNative";
import RankingsDrawerMenuNative from "./RankingsDrawerMenuNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import CyberIconButtonNative from "../../ui/CyberIconButtonNative";
import { CandleChartLoaderNative } from "../../components/CandleChartLoaderNative";
import { spacing } from "../../theme/tokens";
import { useNativeCumulativeRankingsBulk } from "./useNativeCumulativeRankingsBulk";
import { useNativeMyRankingUser } from "./useNativeMyRankingUser";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsPageTitleCyberNative } from "./RankingsPageTitleCyberNative";
import type { MyRankCardShareState } from "./RankingsMyRankCardNative";
import {
  MyRankCardNative,
  PlayoffRoundTabsNative,
  RankingsCategoryTabsNative,
  RankingsMetricRowNative,
  RankingsRestListNative,
  RankingsTopPodiumNative,
} from "./RankingsUiParts";

type Props = {
  bottomReserveY: number;
};

function scheduleNoticeForUser(language: RankingsLanguage): string {
  const lang = (language === "en" ? "en" : "ja") as Language;
  return getRankingsScheduleNoticeText(lang);
}

export default function RankingsHomeScreen({ bottomReserveY }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { topContentPadY } = useBottomTabBarInsets();
  const [category, setCategory] = useState<"playoffs" | "bracket">("playoffs");
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankingsLeague, setRankingsLeague] = useState<"nba" | "wc">("wc");
  const [wcStage, setWcStage] = useState<WcRankingStage>("overall");

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
  const shareFnRef = useRef<() => void>(() => {});
  const [myRankShare, setMyRankShare] = useState({ canShare: false, sharing: false });

  const handleMyRankShareStateChange = useCallback((state: MyRankCardShareState) => {
    shareFnRef.current = state.share;
    setMyRankShare({ canShare: state.canShare, sharing: state.sharing });
  }, []);

  useEffect(() => {
    if (category !== "playoffs") {
      shareFnRef.current = () => {};
      setMyRankShare({ canShare: false, sharing: false });
    }
  }, [category]);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];

  useEffect(() => {
    void ensureMetric(apiKey);
  }, [apiKey, ensureMetric]);

  const rankingLeagueSource = rankingsLeague === "wc" ? "worldcup" : "nba";
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
    return toMobileRows(metric, rawRows);
  }, [metric, rawRows]);

  const myRank = bundle?.myRank ?? null;
  const myRankDeltaPlaces = bundle?.myRankDeltaPlaces ?? null;
  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const myStatsRow =
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ?? myRawRow;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count) ? bundle.count : 0;

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;
    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "exactHits")
      return myRawRow.totalExactHits ?? myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    if (metric === "winRate") {
      const raw = myRawRow.winRate ?? 0;
      return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    }
    return myRawRow.activeWinStreak ?? 0;
  }, [metric, myRawRow]);

  const winRateMinPosts = round === "overall" || round === "r1" ? 20 : 1;
  const metricReady = bundle != null;
  const listContentReady = computeRankingListContentReady({
    listReady,
    metricReady,
  });
  const rankingHasNoEntries = computeRankingHasNoEntries({
    listReady,
    metricReady,
    rowsLength: rows.length,
    rankingLeague: rankingLeagueSource,
    rankingListCount,
  });

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

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const effectiveRound: PlayoffRoundKey =
    rankingsLeague === "wc" ? "overall" : round;
  const pageKey = buildRankingsPageKey({
    phase: "playoffs",
    effectiveRound,
    metric,
    rankingLeague: rankingLeagueSource,
    wcStage: rankingsLeague === "wc" ? wcStage : undefined,
  });
  const reduceMotion = useReducedMotion() ?? false;
  const { topDone, handleTopCountDone } = useRankingsTopDone(pageKey);

  const openProfile = (row: RankingRowWithCountry) => {
    const key = profilePathKeyFromRow(row);
    if (!key) return;
    navigation.navigate("ProfileTab", {
      screen: "PublicProfile",
      params: { handle: key, fromRankings: true },
      initial: false,
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
          <View style={styles.titleSide}>
            <CyberIconButtonNative
              size="sm"
              icon="share-variant"
              onPress={() => void shareFnRef.current()}
              disabled={!myRankShare.canShare || myRankShare.sharing}
              accessibilityLabel={t.shareMyRank}
              style={
                myRankShare.canShare || myRankShare.sharing
                  ? undefined
                  : styles.titleSideHidden
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          {rankingsLeague === "nba" ? (
            <RankingsCategoryTabsNative
              category={category}
              onChange={setCategory}
              language={language}
            />
          ) : null}

          {category === "playoffs" ? (
            <>
              {rankingsLeague === "nba" ? (
                <PlayoffRoundTabsNative round={round} onChange={setRound} language={language} />
              ) : null}
              {rankingsLeague === "wc" ? (
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
                cardResetKey={pageKey}
                onShareStateChange={handleMyRankShareStateChange}
              />
            </>
          ) : null}
        </View>

        {category === "bracket" ? (
          <BracketLeaderboardSectionNative language={language} />
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

            {!listContentReady ? (
              <View style={styles.loadingWrap}>
                <CandleChartLoaderNative scale={0.85} label={t.loading} />
              </View>
            ) : rankingHasNoEntries ? (
              <View style={styles.noDataWrap}>
                <Text style={styles.noData}>{t.noData}</Text>
              </View>
            ) : (
              <View key={pageKey} style={styles.listSection}>
                <RankingsTopPodiumNative
                  rows={top3}
                  metric={metric}
                  language={language}
                  onPressProfile={openProfile}
                  pageKey={pageKey}
                  onTopCountDone={handleTopCountDone}
                />
                <View style={styles.restList}>
                  <RankingsRestListNative
                    rows={restRows}
                    metric={metric}
                    language={language}
                    onPressProfile={openProfile}
                    pageKey={pageKey}
                    topDone={topDone || reduceMotion}
                  />
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
        />
      </SideMenuDrawerNative>
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
  titleSide: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSideHidden: {
    opacity: 0,
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
