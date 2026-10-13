import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openProSubscribeNative } from "../../navigation/navigationRef";
import { useBlockedUidsNative } from "../moderation/blockedUsersStoreNative";
import { filterBlockedRows } from "../../../../../lib/moderation/moderationTypes";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { metricNum } from "../../../../../lib/rankings/metric";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { pillMetricLabel } from "./RankingsMetricRowNative";
import { formatRankingPeriodLabel } from "./RankingsPeriodLabelNavNative";
import {
  RankingsStickyStatusBarNative,
  type RankingsStickyMe,
} from "./RankingsStickyStatusBarNative";
import {
  DEV_DUMMY_RANKINGS_ENABLED,
  buildDevDummyRankingRows,
} from "./devDummyRankingRows";
import {
  PRO_LEAGUE_ATMOSPHERE,
  PRO_LEAGUE_TAB_THEME,
} from "../../../../../lib/rankings/proLeagueAtmosphere";
import { acquireAppPageAtmosphere } from "../../../../../lib/ui/appPageAtmosphere";
import {
  type MobileMetric,
} from "../../../../../lib/rankings/rankingMetrics";
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import {
  buildMyRankMiniMetrics,
} from "../../../../../lib/rankings/buildMyRankMiniMetrics";
import { resolveMyRankForCard, getMyMetricValue, computeWinRateMinPosts } from "../../../../../lib/rankings/rankingsPageShared";
import {
  rankingsPreseasonNotice,
  shouldShowRankingsPreseasonNotice,
} from "../../../../../lib/rankings/rankingsPreseasonNotice";
import {
  upsetRankingEligibilityNotice,
  winRateRankingNoUnitsNotice,
} from "../../../../../lib/rankings/upsetRankingEligibilityNotice";
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
import type { MainTabParamList, RankingsStackParamList } from "../../navigation/types";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import { warmPublicProfileFromRankingRowNative } from "../profile/warmPublicProfileNative";
import type { Language } from "../../../../../lib/i18n/language";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { getRankingsScheduleNoticeText } from "../../../../../lib/rankings/getRankingsScheduleNoticeText";
import BracketLeaderboardSectionNative from "./BracketLeaderboardSectionNative";
import SideMenuDrawerNative from "../../ui/SideMenuDrawerNative";
import RankingsDrawerMenuNative from "./RankingsDrawerMenuNative";
import ProfileMenuEdgeHandleNative from "../profile/ProfileMenuEdgeHandleNative";
import { CandleChartLoaderNative } from "../../components/CandleChartLoaderNative";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useNativeCumulativeRankingsBulk } from "./useNativeCumulativeRankingsBulk";
import { useNativeOpenSeasonRankingsBulk } from "./useNativeOpenSeasonRankingsBulk";
import { useNativePeriodRankingsBulk } from "./useNativePeriodRankingsBulk";
import { useNativeMyRankingUser } from "./useNativeMyRankingUser";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import {
  MyRankCardNative,
  RankingListCardNative,
  RankingsMetricRowNative,
  RankingsTopPodiumNative,
} from "./RankingsUiParts";
import { RankingsPeriodTabsNative } from "./RankingsPeriodTabsNative";
import { RankingsPeriodLabelNavNative } from "./RankingsPeriodLabelNavNative";
import PeriodRankingUnitRewardsSheetNative from "./PeriodRankingUnitRewardsSheetNative";
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
import {
  estimatePeriodRankingUnits,
  periodUnitRanksFromByMetric,
} from "../../../../../lib/rankings/estimatePeriodRankingUnits";

type Props = {
  bottomReserveY: number;
};

function scheduleNoticeForUser(
  language: RankingsLanguage,
  countryCode: string | null,
): string {
  return getRankingsScheduleNoticeText(language as Language, countryCode);
}

export default function RankingsHomeScreen({ bottomReserveY }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<RankingsStackParamList>>();
  const isFocused = useIsFocused();
  const { topContentPadY } = useBottomTabBarInsets();
  const [category, setCategory] = useState<"playoffs" | "bracket">("playoffs");
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [menuOpen, setMenuOpen] = useState(false);
  const rankingsLeague = "nba" as const;
  const [nbaBoard, setNbaBoard] = useState<NbaRankingBoard>("regular");
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("weekly");
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
    wcStageForHook,
    !usePeriodBoard && !useOpenSeasonBoard
  );
  const openSeasonBulk = useNativeOpenSeasonRankingsBulk(useOpenSeasonBoard);
  const periodBulk = useNativePeriodRankingsBulk(
    usePeriodBoard
      ? (rankingPeriod as Exclude<RankingPeriod, "season">)
      : null,
    periodLabel,
    rankingDivision
  );

  const {
    listReady,
    personalPending,
    myUid,
    byMetric: byMetricRaw,
    ensureMetric,
  } = useOpenSeasonBoard
    ? openSeasonBulk
    : usePeriodBoard
      ? periodBulk
      : standardBulk;
  const byMetric = byMetricRaw;
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
  const estimatedUnits =
    myRankCardTier === "pro" &&
    usePeriodBoard &&
    nbaBoard === "regular" &&
    (rankingPeriod === "weekly" || rankingPeriod === "monthly")
      ? estimatePeriodRankingUnits(
          rankingPeriod,
          periodUnitRanksFromByMetric(byMetric)
        )
      : null;
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

  const realRawRows = useMemo(
    () => (Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : []),
    [bundle?.rows]
  );
  const devDummyRows = useMemo(
    () =>
      DEV_DUMMY_RANKINGS_ENABLED && listReady && realRawRows.length === 0
        ? buildDevDummyRankingRows({
            uid: myUid,
            displayName: user.displayName,
            handle: user.handle,
            photoURL: user.photoURL,
          })
        : null,
    [listReady, realRawRows.length, myUid, user.displayName, user.handle, user.photoURL]
  );
  const rawRows: RankingApiRow[] = devDummyRows ?? realRawRows;

  const blockedUids = useBlockedUidsNative();
  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return filterBlockedRows(
      sortRankingRowsByMetric(metric, toMobileRows(metric, rawRows)),
      blockedUids,
      (r) => r.uid
    );
  }, [metric, rawRows, blockedUids]);

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
  const rankingListCount = devDummyRows
    ? devDummyRows.length
    : typeof bundle?.count === "number" && Number.isFinite(bundle.count)
      ? bundle.count
      : 0;

  const myValue = useMemo(
    () => getMyMetricValue(metric, myRawRow ?? myStatsRow),
    [metric, myRawRow, myStatsRow]
  );

  const winRateMinPosts = usePeriodBoard
    ? periodWinRateMinPosts(rankingPeriod as Exclude<RankingPeriod, "season">)
    : computeWinRateMinPosts("nba");
  const winRateUsesPickupRate = usePeriodBoard && nbaBoard === "regular";
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
  /** 切替のたびに新しい入場にする（同じ指標へ戻っても流し直す） */
  const entranceDeps = `${listEntranceKey}|${nbaBoard}|${rankingPeriod}|${periodLabel ?? ""}`;
  const entranceRef = useRef({ deps: entranceDeps, n: 0 });
  if (entranceRef.current.deps !== entranceDeps) {
    entranceRef.current = { deps: entranceDeps, n: entranceRef.current.n + 1 };
  }
  const rowEntranceKey = `${listEntranceKey}#${entranceRef.current.n}`;

  const openProfile = useCallback((row: RankingRowWithCountry) => {
    const key = warmPublicProfileFromRankingRowNative(row);
    if (!key) return;
    navigateToPublicProfileNative(stackNavigation, {
      handle: key,
      fromRankings: true,
      warm: {
        uid: row.uid,
        handle: typeof row.handle === "string" ? row.handle : null,
        displayName: row.displayName,
        photoURL: typeof row.photoURL === "string" ? row.photoURL : null,
        plan: row.plan === "pro" ? "pro" : "free",
        planProBgVariant:
          typeof row.planProBgVariant === "string"
            ? row.planProBgVariant
            : null,
        countryCode:
          typeof row.countryCode === "string" ? row.countryCode : null,
      },
    });
  }, [stackNavigation]);

  useEffect(() => {
    // タブは常時マウントのため、フォーカス中かつ PRO LEAGUE のときだけ背景を差し替える
    if (nbaBoard !== "open" || !isFocused) return;
    return acquireAppPageAtmosphere("pro-league");
  }, [nbaBoard, isFocused]);

  const showVirtualRestList =
    category === "playoffs" &&
    !openProLocked &&
    listReady &&
    !rankingHasNoEntries;

  const listShellPro = nbaBoard === "open";

  const renderRestRow = useCallback(
    ({
      item,
      index,
    }: {
      item: RankingRowWithCountry;
      index: number;
    }) => (
      <View
        style={[
          styles.listSectionMid,
          listShellPro ? styles.listSectionProMid : null,
        ]}
      >
        <RankingsListEntranceRowNative
          index={index + 3}
          entranceKey={rowEntranceKey}
          staggerMs={58}
        >
          <View
            style={
              myUid != null && item.uid === myUid
                ? [styles.meRow, listShellPro ? styles.meRowPro : null]
                : null
            }
          >
            <RankingListCardNative
              row={item}
              rank={index + 4}
              metric={metric}
              language={language}
              onPress={() => openProfile(item)}
            />
          </View>
        </RankingsListEntranceRowNative>
      </View>
    ),
    [metric, language, rowEntranceKey, openProfile, listShellPro, myUid]
  );

  const listRef = useRef<FlatList<RankingRowWithCountry>>(null);
  /** 指標タブ行の下端（リスト content 座標）。ここを過ぎたらバーを出す */
  const [tabsBottomY, setTabsBottomY] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const stickyVisibleRef = useRef(false);
  const tabsBottomRef = useRef<number | null>(null);
  tabsBottomRef.current = tabsBottomY;

  const onListScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const bottom = tabsBottomRef.current;
      const next = bottom != null && e.nativeEvent.contentOffset.y > bottom;
      if (next === stickyVisibleRef.current) return;
      stickyVisibleRef.current = next;
      setStickyVisible(next);
    },
    []
  );

  const myListIndex = useMemo(
    () => (myUid ? rows.findIndex((r) => r.uid === myUid) : -1),
    [rows, myUid]
  );

  const stickyConditionText = useMemo(() => {
    const parts: string[] = [];
    if (nbaBoard === "playoffs") parts.push("PLAYOFFS");
    else parts.push(nbaBoard === "open" ? t.divisionOpen : t.divisionStandard);
    if (showNbaPeriodTabs) {
      parts.push(
        rankingPeriod === "season"
          ? t.periodSeason
          : rankingPeriod === "weekly"
            ? t.periodWeekly
            : t.periodMonthly
      );
    }
    if (usePeriodBoard && periodBulk.activeLabel) {
      parts.push(
        formatRankingPeriodLabel(
          rankingPeriod as Exclude<RankingPeriod, "season">,
          periodBulk.activeLabel,
          language
        )
      );
    }
    parts.push(pillMetricLabel(metric, language));
    return parts.join(" · ").toUpperCase();
  }, [
    nbaBoard,
    showNbaPeriodTabs,
    rankingPeriod,
    usePeriodBoard,
    periodBulk.activeLabel,
    metric,
    language,
    t,
  ]);

  const stickyMe: RankingsStickyMe | null = useMemo(() => {
    if (rankingHasNoEntries) return null;
    const listRow = myListIndex >= 0 ? rows[myListIndex] : null;
    const rank = listRow ? myListIndex + 1 : myRank;
    if (rank == null || rank < 1) return null;
    const { n, d } = listRow
      ? metricNum(listRow, metric)
      : { n: myValue, d: metric === "totalScore" || metric === "upsetScore" ? 1 : 0 };
    const unit = metric === "totalScore" ? " PT" : metric === "winRate" ? "%" : "";
    return {
      rank,
      valueText: `${formatMetricDecimals(n, d)}${unit}`,
      deltaPlaces: listRow?.rankDeltaPlaces ?? myRankDeltaPlaces ?? null,
    };
  }, [
    rankingHasNoEntries,
    myListIndex,
    rows,
    myRank,
    metric,
    myValue,
    myRankDeltaPlaces,
  ]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollToMe = useMemo(() => {
    if (myListIndex < 0) return null;
    if (myListIndex < 3) {
      return () =>
        listRef.current?.scrollToOffset({
          offset: Math.max(0, (tabsBottomRef.current ?? 0) - 40),
          animated: true,
        });
    }
    const index = myListIndex - 3;
    return () =>
      listRef.current?.scrollToIndex({ index, viewPosition: 0.4, animated: true });
  }, [myListIndex]);

  const listHeader = (
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
              {openProLocked ? null : (
              <MyRankCardNative
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={user.displayName?.trim() ?? ""}
                photoURL={user.photoURL || null}
                uid={myUid}
                handle={user.handle}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number" ? myRawRow.totalPosts : undefined
                }
                loading={cardLoading}
                statsScramble={
                  listReady &&
                  personalPending &&
                  !cardFast.myRow &&
                  myRank == null
                }
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
                cardResetKey={listEntranceKey}
                leagueLabel={
                  nbaBoard === "open"
                    ? "PRO LEAGUE"
                    : nbaBoard === "playoffs"
                      ? "PLAYOFFS"
                      : "NBA"
                }
                rankTierGap={myRankCardTier === "pro" ? rankTierGap : null}
                rankProgress={
                  rankProgressEnabled ? (myRankProgressPoints ?? []) : undefined
                }
                rankProgressLoading={
                  rankProgressEnabled && myRankProgressLoading
                }
                hideRankProgress={rankProgressHidden}
                estimatedUnits={estimatedUnits}
              />
              )}
            </>
          ) : null}

        {category === "bracket" ? (
            <BracketLeaderboardSectionNative language={language} />
        ) : null}

        {category === "playoffs" && openProLocked ? (
          <RankingsProLeagueTeaserNative
            language={language}
            onPressSubscribe={() =>
              openProSubscribeNative()
            }
            onBackToPickUp={() => setNbaBoard("regular")}
          />
        ) : category === "playoffs" ? (
          <>
            <View style={styles.scheduleNoticeRow}>
              <Text
                style={[styles.scheduleNoticeInline, styles.scheduleNoticeText]}
                maxFontSizeMultiplier={1.1}
              >
                {scheduleNoticeForUser(language, user.countryCode)}
              </Text>
              <PeriodRankingUnitRewardsSheetNative
                language={language}
                rankingPeriod={rankingPeriod}
              />
            </View>
            <View
              style={styles.metricRowWrap}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                setTabsBottomY(y + height);
              }}
            >
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
                {winRateUsesPickupRate
                  ? t.winRatePickupRate
                  : winRateMinPosts > 1
                    ? t.winRateMin(winRateMinPosts)
                    : t.winRateNoMin}
                {"\n"}
                {winRateRankingNoUnitsNotice(language)}
              </Text>
            ) : null}
            {metric === "upsetScore" && rankingPeriod === "monthly" ? (
              <Text style={styles.winRateHint}>
                {upsetRankingEligibilityNotice(language)}
              </Text>
            ) : null}

            {!listReady ? (
              <View style={styles.loadingWrap}>
                <CandleChartLoaderNative scale={0.85} label={t.loading} />
              </View>
            ) : shouldShowRankingsPreseasonNotice(rankingHasNoEntries) ? (
              <View style={styles.noDataWrap}>
                <Text style={styles.preseasonNotice}>
                  {rankingsPreseasonNotice(language)}
                </Text>
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
                  styles.listSectionTop,
                  nbaBoard === "open" ? styles.listSectionProTop : null,
                ]}
              >
                <RankingsTopPodiumNative
                  rows={top3}
                  metric={metric}
                  language={language}
                  onPressProfile={openProfile}
                  entranceKey={listEntranceKey}
                />
              </View>
            )}
          </>
        ) : null}
        </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        onScroll={onListScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset:
              (tabsBottomRef.current ?? 0) +
              info.averageItemLength * (info.index + 3),
            animated: true,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              viewPosition: 0.4,
              animated: true,
            });
          }, 260);
        }}
        style={styles.scrollLayer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topContentPadY, paddingBottom: bottomReserveY + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        data={showVirtualRestList ? restRows : []}
        keyExtractor={(row) => `${metric}-${row.uid}`}
        ListHeaderComponent={listHeader}
        renderItem={renderRestRow}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        /** リスト枠の下辺・左右を rest 行に継承（見た目維持） */
        ListFooterComponent={
          showVirtualRestList ? (
            <View
              style={[
                styles.listSectionBottom,
                listShellPro ? styles.listSectionProBottom : null,
              ]}
            />
          ) : null
        }
      />
      <RankingsStickyStatusBarNative
        visible={stickyVisible && category === "playoffs" && !openProLocked}
        top={topContentPadY}
        conditionText={stickyConditionText}
        me={stickyMe}
        pro={nbaBoard === "open"}
        onPressConditions={scrollToTop}
        onPressMe={scrollToMe}
      />
      <ProfileMenuEdgeHandleNative
        onOpen={() => setMenuOpen(true)}
        label="MENU"
        hidden={menuOpen}
        fadeIn
      />
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
            stackNavigation.navigate("SquadBattle");
          }}
        />
      </SideMenuDrawerNative>

      <TutorialLiveHostNative
        page="rankings"
        language={resolveLocalizedLang(language)}
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
  scheduleNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 2,
  },
  scheduleNoticeText: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  scheduleNoticeInline: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    lineHeight: 14,
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 2,
  },
  section: {
    gap: 2,
    marginBottom: 0,
  },
  metricRowWrap: {
    marginTop: 6,
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
  preseasonNotice: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 16,
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
  /** FlatList 分割用: 枠線を podium / mid / bottom で継ぐ（見た目は単一 listSection） */
  listSectionTop: {
    marginTop: 4,
    overflow: "hidden",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  listSectionProTop: {
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.panelBg,
  },
  listSectionMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  listSectionProMid: {
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.panelBg,
  },
  listSectionBottom: {
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
    height: 0,
  },
  listSectionProBottom: {
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.panelBg,
  },
  restList: {
    gap: 0,
    paddingTop: 0,
  },
  meRow: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.75)",
    backgroundColor: "rgba(0,245,255,0.07)",
  },
  meRowPro: {
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: "rgba(168,85,247,0.08)",
  },
});
