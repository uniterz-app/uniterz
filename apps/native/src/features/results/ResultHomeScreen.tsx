import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type RefObject } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Platform, Pressable, RefreshControl, SectionList, StyleSheet, Text, View, type ViewStyle,
  type RefreshControlProps,
} from "react-native";
import { useNavigation, useFocusEffect, useRoute, useIsFocused } from "@react-navigation/native";
import { useAppActiveNative } from "../../hooks/useAppActiveNative";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MainTabParamList, ResultStackParamList } from "../../navigation/types";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useReducedMotion,
} from "react-native-reanimated";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { t as i18nT } from "../../../../../lib/i18n/t";
import {
  L,
  resolveLocalizedLang,
} from "../../../../../lib/i18n/localize";
import { useNativeUserLanguageFromAuth } from "../../hooks/useNativeUserLanguage";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { colors, spacing, typography } from "../../theme/tokens";
import { getTeamAlias, splitTeamNameByLeague } from "../../utils/teamName";
import {
  ScrollVisibilityProvider,
  useScrollVisibilityOnScroll,
} from "../games/ScrollVisibilityNative";
import CountryFlagNative from "../games/CountryFlagNative";
import { resolvePostListLeague, LEAGUES } from "../../../../../lib/leagues";
import type { SectionList as SectionListType } from "react-native";
import {
  isWcKnockoutGame,
  WcGroupStandingRecordLineNative,
  resolveWcGroupStageStandingForKnockoutDisplay,
  resolveWcResultCardGroupStanding,
  resolveWcGroupCodeLabel,
  WcMatchGoalScorersColumnNative,
  WcTeamFlagWithMetaNative,
  WcTeamNameMobileNative,
  WcGoalScorerResultRowNative,
  useWcGoalScorerResultNative,
  resolveWcMatchGoalScorersForDisplay,
  type WcGoalScorerPostLike,
} from "../games/legacyWcNativeShims";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import { resolveTeamJerseyPalette, resolveTeamPrimaryColor } from "../games/teamColors";
import { toCompactTeamName } from "../games/gameCardDisplayUtils";
import type { PostWithMillis, ResultDayGroup } from "./nativeResultModel";
import { canDismissResultListPostNow, mergeResultDayPostsByKickoff } from "./nativeResultModel";
import ResultListFiltersNative, {
  type ResultFilterState,
} from "./ResultListFiltersNative";
import {
  DEFAULT_RESULT_LIST_FILTERS,
  isDefaultResultListFilters,
  postMatchesResultListFilters,
} from "../../../../../lib/result/resultListFilterMatch";
import { peekResultPostsListCache } from "../../../../../lib/result/resultPostsListCache";
import CornerMenuClusterNative from "../../ui/CornerMenuClusterNative";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";
import { useResultLeagueFlagsNative, type ResultListLeagueTab } from "./useResultLeagueFlagsNative";
import ResultOutcomeBadgesNative from "./ResultOutcomeBadgesNative";
import {
  DISPLAY_FONT,
  MOBILE_RESULT_CARD_GAP,
  MOBILE_RESULT_CARD_MAX_W,
  MOBILE_RESULT_DAY_HEADER_TO_CARD_GAP,
  MOBILE_RESULT_JERSEY_SIZE,
  MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  MOBILE_RESULT_PAGE_PAD_X,
  MOBILE_RESULT_SECTION_GAP,
  MOBILE_RESULT_STAT_LABEL_W,
  MOBILE_RESULT_STAT_ROW_GAP,
  MOBILE_RESULT_STAT_VALUE_W,
  NUMERIC_FONT,
  dayStripNumberText,
  resultCardShellNative,
  resultDayStripPanelNative,
  resultFilterBarNative,
} from "./resultMobileUiNative";
import { isResultPostLiveGame, isResultPostMatchStarted } from "../../../../../lib/result/resultLiveGame";
import {
  dayPointsHeaderForNative,
  type NativeDayPointsHeader,
} from "./nativeResultDaySummary";
import { resolveResultBadgeDisplay } from "../../../../../lib/result/resultBadge";
import {
  deletePredictionPostApi,
  PredictionApiError,
} from "../games/submitPredictionApi";
import { notifyScheduleMyPostDeleted } from "../../../../../lib/games/scheduleMyPostSyncEvents";
import ResultStatRatingBarNative from "./ResultStatRatingBarNative";
import ResultDetailScreen from "./ResultDetailScreen";
import ResultHitCyberFrameNative from "./ResultHitCyberFrameNative";
import ResultPerfectCyberFrameNative from "./ResultPerfectCyberFrameNative";
import ResultStreakCyberFrameNative from "./ResultStreakCyberFrameNative";
import ResultMatchScoreLineNative from "./ResultMatchScoreLineNative";
import MatchPkResultLineNative from "../games/MatchPkResultLineNative";
import {
  resolveResultPostPkScore,
  useResultPostsPkScores,
} from "../../../../../lib/games/useResultPostsPkScores";
import {
  resolveResultPostGameMarket,
  resolveResultPostGameRoundMeta,
  useResultPostsGameMarkets,
  useResultPostsGameRoundMeta,
} from "../../../../../lib/games/useResultPostsGameMarkets";
import { resolvePkScoreFromResultPost } from "../../../../../lib/games/pkScore";
import ResultGlassShellNative from "./ResultGlassShellNative";
import ResultPostCardNative from "./ResultPostCardNative";
import { RESULT_CYBER_FRAME_STROKE_WIDTH } from "./resultCyberFrameNativeMetrics";
import { useNativeResultPosts } from "./useNativeResultPosts";
import {
  useResultDayHeaderEntrance,
  useResultEntranceArmed,
  useResultFilterBarEntrance,
  useResultPostCardEntrance,
  type ResultStatRowEntranceMeta,
} from "./useResultHomeEntrance";
import { useTeamRecordLineNative } from "../games/useTeamRecordLineNative";
import { shareResultCardNative } from "./shareResultCardNative";
import ShareLinkCaptureFooterNative from "../share/ShareLinkCaptureFooterNative";
import { buildResultShareUrl, getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";

const JERSEY_SIZE_RESULT = MOBILE_RESULT_JERSEY_SIZE;

const NUMERIC_FONT_FAMILY = NUMERIC_FONT;
const DISPLAY_FONT_FAMILY = DISPLAY_FONT;
/** Firestore は数値フィールドが文字列で返ることがあるため Number に寄せる */
function ResultListHeaderBlock({
  cacheCapped,
  hintText,
  filterLabel,
  filterCollapseLabel,
  entranceArmed,
  onFilterPress,
  filterPanelOpen,
  filterActive,
  filterPanel,
  leagueTabs,
}: {
  cacheCapped: boolean;
  hintText: string;
  filterLabel: string;
  filterCollapseLabel: string;
  entranceArmed: boolean;
  onFilterPress: () => void;
  filterPanelOpen: boolean;
  filterActive: boolean;
  filterPanel?: React.ReactNode;
  leagueTabs?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const filterMotion = useResultFilterBarEntrance(entranceArmed, reduceMotion);
  return (
    <View style={styles.headerBlock}>
      {leagueTabs}
      {cacheCapped ? <Text style={styles.hint}>{hintText}</Text> : null}
      <View style={styles.listRowOuter}>
        <Animated.View style={filterMotion}>
          <Pressable
            style={({ pressed }) => [
              resultFilterBarNative.bar,
              styles.filterBarRow,
              pressed && resultFilterBarNative.barPressed,
            ]}
            onPress={onFilterPress}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color="rgba(255,255,255,0.6)"
              style={filterPanelOpen ? styles.filterChevronOpen : undefined}
            />
            <Text style={resultFilterBarNative.text}>
              {filterPanelOpen ? filterCollapseLabel : filterLabel}
            </Text>
            {filterActive ? <View style={styles.filterActiveDot} /> : null}
          </Pressable>
        </Animated.View>
        {filterPanelOpen ? filterPanel : null}
      </View>
    </View>
  );
}

function ResultDayHeader({
  dateLabel,
  dayPoints,
  entranceActive,
  sectionStaggerIndex,
  leadGap = false,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
  entranceActive: boolean;
  sectionStaggerIndex: number;
  /** 前セクションの最終カードとの間（SectionSeparator の代わり） */
  leadGap?: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { clipStyle, dateClusterStyle, rightClusterStyle } = useResultDayHeaderEntrance(
    entranceActive,
    reduceMotion,
    sectionStaggerIndex
  );
  return (
    <View
      style={[
        styles.listRowOuter,
        styles.dayHeaderSpacing,
        leadGap ? styles.dayHeaderLeadGap : null,
      ]}
    >
      <View style={resultDayStripPanelNative.outer}>
        <Animated.View style={[resultDayStripPanelNative.panel, clipStyle]}>
          <View style={resultDayStripPanelNative.row}>
            <Animated.View style={[resultDayStripPanelNative.dateCol, dateClusterStyle]}>
              <Text style={resultDayStripPanelNative.date}>{dateLabel}</Text>
            </Animated.View>
            {dayPoints?.variant === "total" ? (
              <>
                <Animated.View style={[resultDayStripPanelNative.hitCol, rightClusterStyle]}>
                  {typeof dayPoints.hitTotal === "number" && dayPoints.hitTotal > 0 ? (
                    <View style={styles.dayHitWrap}>
                      <Text style={styles.dayHitLabel}>hit</Text>
                      <Text style={styles.dayHitNums}>
                        {dayPoints.hitWins ?? 0}/{dayPoints.hitTotal}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>
                <Animated.View style={[resultDayStripPanelNative.totalCol, rightClusterStyle]}>
                  <View style={styles.dayTotalWrap}>
                    <Text style={styles.dayTotalPrefix}>{dayPoints.prefix}</Text>
                    <Text style={styles.dayTotalValue}>{dayPoints.value}</Text>
                    <Text style={styles.dayTotalUnit}>{dayPoints.unit}</Text>
                  </View>
                </Animated.View>
              </>
            ) : dayPoints?.variant === "pending" ? (
              <>
                <View style={resultDayStripPanelNative.divider} />
                <Animated.View style={[resultDayStripPanelNative.rightCol, rightClusterStyle]}>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>{dayPoints.line}</Text>
                  </View>
                </Animated.View>
              </>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}


type SectionT = {
  title: string;
  dateLabel: string;
  pending: PostWithMillis[];
  final: PostWithMillis[];
  data: PostWithMillis[];
  /** リスト全体でのカード入場スタッガー用の先頭インデックス */
  baseFlatIndex: number;
};

export default function ResultHomeScreen({
  bottomReserveY = 0,
}: {
  bottomReserveY?: number;
}) {
  const { fUser } = useFirebaseUser();
  const isFocused = useIsFocused();
  const appActive = useAppActiveNative();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  /** 詳細オープン中は一覧 tick / 再取得を止めて裏コストを落とす */
  const listTickActive = isFocused && appActive && detailPostId == null;
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<ResultStackParamList>>();
  const route = useRoute<RouteProp<ResultStackParamList, "ResultHome">>();
  const reopenDetailPostId = route.params?.reopenDetailPostId;
  const { topContentPadY } = useBottomTabBarInsets();
  const listTopPad = topContentPadY;
  const { language } = useNativeUserLanguageFromAuth();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const uid = fUser?.uid ?? null;

  const t = useMemo(() => {
    const lang = resolveLocalizedLang(language);
    const r = i18nT(lang).results;
    const profile = i18nT(lang).profile;
    return {
      empty: profile.noStatsYet,
      cacheHint: L(lang, {
        ja: "古い投稿の一部は表示を省略しています。",
        en: "Older posts may be omitted from this list.",
        ko: "오래된 게시물 일부는 표시에서 생략됩니다.",
        zh: "部分旧帖可能未在此列表中显示。",
        es: "Algunas publicaciones antiguas pueden omitirse de esta lista.",
        pt: "Algumas publicações antigas podem ser omitidas desta lista.",
        fr: "Certaines publications anciennes peuvent être omises de cette liste.",
      }),
      pull: L(lang, {
        ja: "引っ張って更新",
        en: "Pull to refresh",
        ko: "당겨서 새로고침",
        zh: "下拉刷新",
        es: "Desliza para actualizar",
        pt: "Puxe para atualizar",
        fr: "Tirez pour actualiser",
      }),
      filterFold: r.filterTitle,
      filterClose: r.filterClose,
    };
  }, [language]);

  const [listNowTick, setListNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!listTickActive) return;
    const id = setInterval(() => setListNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [listTickActive]);

  const deleteSubmittingRef = useRef(false);

  useEffect(() => {
    const id = reopenDetailPostId?.trim();
    if (!id) return;
    setDetailPostId(id);
    stackNavigation.setParams({ reopenDetailPostId: undefined });
  }, [reopenDetailPostId, stackNavigation]);

  const { showResultLeagueTabs, defaultLeagueTab, flagsReady } =
    useResultLeagueFlagsNative(uid ?? null);
  const [leagueTab, setLeagueTab] = useState<ResultListLeagueTab | null>(null);
  useEffect(() => {
    if (!flagsReady || leagueTab !== null) return;
    setLeagueTab(defaultLeagueTab);
  }, [flagsReady, defaultLeagueTab, leagueTab]);

  const resultListRef = useRef<SectionListType<PostWithMillis, SectionT>>(null);
  const resultScrollYRef = useRef(0);
  const [tutorialListScrollEnabled, setTutorialListScrollEnabled] =
    useState(true);

  const { grouped, loading, hasFetchedOnce, postsCacheCapped, refreshPosts, loadMore, removePostById } =
    useNativeResultPosts(uid, language, {
      league: leagueTab,
      enabled: leagueTab !== null,
    });

  const refreshPostsRef = useRef(refreshPosts);
  refreshPostsRef.current = refreshPosts;
  const lastFocusRefreshAtRef = useRef(0);

  /** タブ再訪で再取得（精算直後の pending を残さない）。
   * 温かいキャッシュがあるときだけ 30s スロットル。予想投稿後の invalidate 直後は必ず取り直す。
   * refreshPosts を deps に入れると identity 変化でフォーカス中に無限再取得になる */
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const hasWarmCache = Boolean(
        uid && leagueTab && peekResultPostsListCache(uid, leagueTab)
      );
      if (hasWarmCache && now - lastFocusRefreshAtRef.current < 30_000) return;
      lastFocusRefreshAtRef.current = now;
      void refreshPostsRef.current();
    }, [uid, leagueTab])
  );

  const hasPendingSettlement = useMemo(
    () => grouped.some((g) => g.pending.length > 0),
    [grouped]
  );

  /** 未精算カードがある間は定期再取得（Cloud Functions 精算完了を待つ） */
  useEffect(() => {
    if (!hasPendingSettlement || !listTickActive) return;
    const id = setInterval(() => void refreshPostsRef.current(), 120_000);
    return () => clearInterval(id);
  }, [hasPendingSettlement, listTickActive]);

  const [resultFilters, setResultFilters] = useState<ResultFilterState>({
    ...DEFAULT_RESULT_LIST_FILTERS,
    detailOpen: false,
  });

  const filteredGrouped = useMemo(() => {
    const base = grouped
      .map((g) => {
        const filterPost = (p: PostWithMillis) => {
          if (
            !postMatchesResultListFilters(
              p as Parameters<typeof postMatchesResultListFilters>[0],
              resultFilters
            )
          ) {
            return false;
          }
          if (showResultLeagueTabs) {
            const league = (p.leagueId ?? p.league) as string | undefined;
            if (leagueTab === "nba" && league === "wc") return false;
          }
          return true;
        };
        const pending = g.pending.filter(filterPost);
        const final = g.final.filter(filterPost);
        return { ...g, pending, final };
      })
      .filter((g) => g.pending.length > 0 || g.final.length > 0);

    return base;
  }, [
    grouped,
    resultFilters,
    leagueTab,
    showResultLeagueTabs,
  ]);

  const sections: SectionT[] = useMemo(() => {
    let baseFlatIndex = 0;
    return filteredGrouped.map((g: ResultDayGroup) => {
      const data = mergeResultDayPostsByKickoff(g);
      const section: SectionT = {
        title: g.dateLabel,
        dateLabel: g.dateLabel,
        pending: g.pending,
        final: g.final,
        data,
        baseFlatIndex,
      };
      baseFlatIndex += data.length;
      return section;
    });
  }, [filteredGrouped]);

  const visiblePostsFlat = useMemo(
    () => sections.flatMap((s) => s.data),
    [sections]
  );
  const pkFromGames = useResultPostsPkScores(visiblePostsFlat);
  const marketsFromGames = useResultPostsGameMarkets(visiblePostsFlat);
  const roundMetaFromGames = useResultPostsGameRoundMeta(visiblePostsFlat);

  const detailWarmPost = useMemo(() => {
    if (!detailPostId) return null;
    return visiblePostsFlat.find((p) => p.id === detailPostId) ?? null;
  }, [detailPostId, visiblePostsFlat]);

  const detailWarmMarket = useMemo(() => {
    if (!detailWarmPost) return null;
    return resolveResultPostGameMarket(detailWarmPost, marketsFromGames);
  }, [detailWarmPost, marketsFromGames]);

  const detailWarmRoundMeta = useMemo(() => {
    if (!detailWarmPost) return null;
    return resolveResultPostGameRoundMeta(detailWarmPost, roundMetaFromGames);
  }, [detailWarmPost, roundMetaFromGames]);

  const onOpenResultDetail = useCallback((id: string) => {
    setDetailPostId(id);
  }, []);

  const onCloseResultDetail = useCallback(() => {
    setDetailPostId(null);
  }, []);

  /** 初回マウント時のみ一覧入場を有効化（スクロールで遅延マウントされた日付帯は除外） */
  const entranceArmed = useResultEntranceArmed();
  const [initialSectionIdSet, setInitialSectionIdSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (sections.length === 0 || initialSectionIdSet !== null) return;
    setInitialSectionIdSet(new Set(sections.map((s) => `${s.dateLabel}:${s.baseFlatIndex}`)));
  }, [sections, initialSectionIdSet]);

  const onFilterPress = useCallback(() => {
    setResultFilters((f) => ({ ...f, detailOpen: !f.detailOpen }));
  }, []);

  /** Web `/games/[id]/predict?edit=1` と同様：予想タブのスコア編集へ遷移 */
  const openPredictEditFromResult = useCallback(
    (post: PostWithMillis) => {
      const gameId =
        typeof post.gameId === "string" && post.gameId.length > 0 ? post.gameId : null;
      if (!gameId) return;
      const pred = post.prediction as
        | {
            winner?: "home" | "away" | "draw";
            score?: { home?: number; away?: number };
            goalScorer?: unknown;
          }
        | undefined;
      const scoreHome = pred?.score?.home;
      const scoreAway = pred?.score?.away;
      const winner = pred?.winner;
      const openPredictSeed =
        winner &&
        typeof scoreHome === "number" &&
        typeof scoreAway === "number"
          ? {
              winner,
              scoreHome,
              scoreAway,
              goalScorer: pred?.goalScorer,
            }
          : undefined;
      tabNavigation.navigate("GamesTab", {
        screen: "GamesHome",
        params: {
          openPredictGameId: gameId,
          expandScoreForm: true,
          openPredictPostId: post.id,
          openPredictSeed,
        },
        initial: false,
      });
    },
    [tabNavigation]
  );

  const listHeader = (
    <ResultListHeaderBlock
      cacheCapped={postsCacheCapped}
      hintText={t.cacheHint}
      filterLabel={t.filterFold}
      filterCollapseLabel={t.filterClose}
      entranceArmed={entranceArmed}
      onFilterPress={onFilterPress}
      filterPanelOpen={resultFilters.detailOpen}
      filterActive={!isDefaultResultListFilters(resultFilters)}
      leagueTabs={null}
      filterPanel={
        <ResultListFiltersNative
          language={language}
          filters={resultFilters}
          onChange={setResultFilters}
        />
      }
    />
  );

  const onRefresh = useCallback(async () => {
    setManualRefreshing(true);
    try {
      await refreshPosts({ force: true });
    } finally {
      setManualRefreshing(false);
    }
  }, [refreshPosts]);

  const requestDeleteConfirm = useCallback(
    (post: PostWithMillis) => {
      const loc = resolveLocalizedLang(language);
      const common = i18nT(loc).common;
      const results = i18nT(loc).results;
      cyberAlert(
        results.deletePostConfirm,
        "",
        [
          { text: common.cancel, style: "cancel" },
          {
            text: common.delete,
            style: "destructive",
            onPress: () => {
              void (async () => {
                if (deleteSubmittingRef.current) return;
                if (!canDismissResultListPostNow(post, Date.now())) return;
                deleteSubmittingRef.current = true;
                try {
                  await deletePredictionPostApi(post.id);
                  removePostById(post.id);
                  const gameId =
                    typeof post.gameId === "string" ? post.gameId.trim() : "";
                  if (gameId) {
                    notifyScheduleMyPostDeleted({
                      gameId,
                      uid,
                    });
                  }
                } catch (err) {
                  const msg =
                    err instanceof PredictionApiError
                      ? err.message
                      : results.deleteFailed;
                  cyberAlert(common.error, msg);
                } finally {
                  deleteSubmittingRef.current = false;
                }
              })();
            },
          },
        ],
        { variant: "confirm" }
      );
    },
    [language, removePostById, uid]
  );
  const listEmpty =
    hasFetchedOnce && !loading && filteredGrouped.length === 0 ? (
      <View style={styles.emptyNoDataWrap}>
        <Text style={styles.emptyNoDataText}>NO DATA</Text>
      </View>
    ) : null;

  const showInitialSpinner =
    leagueTab === null ||
    !hasFetchedOnce ||
    (loading && grouped.length === 0);

  /** 下端はスクロール内容側のパディングのみ（親に付けるとナビ下が塗りつぶされリストが届かない） */
  const listContentWithBottomPad = useMemo(
    () => [styles.listContent, { paddingTop: listTopPad, paddingBottom: bottomReserveY }],
    [bottomReserveY, listTopPad]
  );

  return (
    <ScrollVisibilityProvider margin={360}>
    <View style={styles.resultScreenWrap}>
    <View
      style={styles.root}
      pointerEvents={detailPostId != null ? "none" : "auto"}
    >
      {showInitialSpinner ? (
        <View style={[styles.centered, { paddingTop: listTopPad, paddingBottom: bottomReserveY }]}>
          <BlocksPulseLoader />
        </View>
      ) : sections.length === 0 ? (
        <View style={[styles.listContent, { paddingTop: listTopPad, paddingBottom: bottomReserveY }]}>
          {listHeader}
          {listEmpty}
        </View>
      ) : (
        <ResultSectionListWithVisibility
          listRef={resultListRef}
          style={styles.listScroll}
          sections={sections}
          contentContainerStyle={listContentWithBottomPad}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          scrollEnabled={tutorialListScrollEnabled && detailPostId == null}
          onScrollY={(y) => {
            resultScrollYRef.current = y;
          }}
          ListFooterComponent={
            loading && sections.some((s) => s.data.length > 0) ? (
              <View style={styles.footer}>
                <BlocksPulseLoader pixelScale={0.78} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.accent}
              /** 詳細オープン中は一覧操作を止める */
              enabled={detailPostId == null}
            />
          }
          onEndReached={() => loadMore()}
          renderSectionHeader={({ section }) => {
            const sid = `${section.dateLabel}:${section.baseFlatIndex}`;
            const isInitialHeader = initialSectionIdSet?.has(sid) ?? false;
            const sectionIndex = sections.findIndex(
              (s) => s.dateLabel === section.dateLabel && s.baseFlatIndex === section.baseFlatIndex
            );
            return (
              <ResultDayHeader
                dateLabel={section.dateLabel}
                dayPoints={dayPointsHeaderForNative(section.final, section.pending, language)}
                entranceActive={
                  entranceArmed && isInitialHeader
                }
                sectionStaggerIndex={sectionIndex >= 0 ? sectionIndex : 0}
                leadGap={sectionIndex > 0}
              />
            );
          }}
          renderItem={({ item, index, section }) => {
            const isLastInSection = index === section.data.length - 1;
            return (
              <ResultPostCardNative
                post={item}
                pkScore={resolveResultPostPkScore(item, pkFromGames)}
                gameMarket={resolveResultPostGameMarket(item, marketsFromGames)}
                gameRoundMeta={resolveResultPostGameRoundMeta(
                  item,
                  roundMetaFromGames
                )}
                language={language}
                nowMs={listNowTick}
                viewerUid={uid}
                listEnterIndex={section.baseFlatIndex + index}
                entranceEnabled={entranceArmed}
                siblingOverlayOpen={detailPostId != null}
                compactSpacing={isLastInSection}
                tutorialTargetId={
                  section.baseFlatIndex + index === 0
                    ? "result-card"
                    : undefined
                }
                onOpenDetail={onOpenResultDetail}
                onRequestDeleteConfirm={requestDeleteConfirm}
                onRequestPredictEdit={openPredictEditFromResult}
              />
            );
          }}
        />
      )}
    </View>
    <ResultDetailScreen
      visible={detailPostId != null}
      postId={detailPostId}
      language={language}
      warmPost={detailWarmPost}
      warmMarket={detailWarmMarket}
      warmRoundMeta={detailWarmRoundMeta}
      onClose={onCloseResultDetail}
    />
    <View style={styles.tutorialHostLayer} pointerEvents="box-none">
      <TutorialLiveHostNative
        page="results"
        language={resolveLocalizedLang(language)}
      />
    </View>
    </View>
    </ScrollVisibilityProvider>
  );
}

function ResultSectionListWithVisibility({
  listRef,
  style,
  sections,
  contentContainerStyle,
  ListHeaderComponent,
  ListEmptyComponent,
  scrollEnabled,
  onScrollY,
  ListFooterComponent,
  refreshControl,
  onEndReached,
  renderSectionHeader,
  renderItem,
}: {
  listRef: RefObject<SectionListType<PostWithMillis, SectionT> | null>;
  style: ViewStyle | ViewStyle[];
  sections: SectionT[];
  contentContainerStyle: object;
  ListHeaderComponent: ReactElement | null;
  ListEmptyComponent: ReactElement | null;
  scrollEnabled: boolean;
  onScrollY: (y: number) => void;
  ListFooterComponent: ReactElement | null;
  refreshControl: ReactElement<RefreshControlProps>;
  onEndReached: () => void;
  renderSectionHeader: (info: {
    section: SectionT;
  }) => ReactElement;
  renderItem: (info: {
    item: PostWithMillis;
    index: number;
    section: SectionT;
  }) => ReactElement;
}) {
  const onVis = useScrollVisibilityOnScroll();
  return (
    <SectionList<PostWithMillis, SectionT>
      ref={listRef}
      style={style}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={7}
      removeClippedSubviews={Platform.OS === "android"}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      scrollEnabled={scrollEnabled}
      bounces={scrollEnabled}
      scrollEventThrottle={16}
      onScroll={(e) => {
        onScrollY(e.nativeEvent.contentOffset.y);
        onVis?.(e);
      }}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      SectionSeparatorComponent={null}
    />
  );
}

const styles = StyleSheet.create({
  /** リザルト詳細オーバーレイの containing block */
  resultScreenWrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    position: "relative",
    backgroundColor: "transparent",
  },
  /** 詳細オーバーレイ (zIndex 120) より前面にコーチを載せる */
  tutorialHostLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  root: {
    flex: 1,
    backgroundColor: "transparent",
    minHeight: 0,
    zIndex: 1,
  },
  /** フローティングナビの背後までスクロール背景を伸ばす */
  listScroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    /** Web `/mobile/result` の px-[18px]（親 mainArea xs=8 を差し引く） */
    paddingHorizontal: Math.max(0, MOBILE_RESULT_PAGE_PAD_X - spacing.xs),
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: MOBILE_RESULT_SECTION_GAP,
  },
  filterBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  filterChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginLeft: "auto",
  },
  hint: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  /** 絞り込み・日付帯・リザルトカードで共通の横幅 */
  listRowOuter: {
    alignSelf: "center",
    width: "100%",
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    backgroundColor: "rgba(8,11,18,0.84)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  filterBarPressed: {
    opacity: 0.88,
  },
  filterBarText: {
    color: "rgba(224,250,254,0.88)",
    fontSize: 13,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyNoDataWrap: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyNoDataText: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 36,
    letterSpacing: 3.5,
    color: "rgba(255,255,255,0.92)",
    textShadowColor: "rgba(34,211,238,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  sectionGap: {
    height: MOBILE_RESULT_SECTION_GAP,
  },
  dayHeaderSpacing: {
    marginBottom: MOBILE_RESULT_DAY_HEADER_TO_CARD_GAP,
  },
  dayHeaderLeadGap: {
    marginTop: MOBILE_RESULT_DAY_HEADER_TO_CARD_GAP,
  },
  dayHeaderClip: {
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(3,3,8,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  dayHeaderRow: {
    position: "relative",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  /** 日付テキストのみスキャン方向の移動を付ける（レイアウト幅は維持） */
  dayHeaderDateSlot: {
    flexShrink: 0,
  },
  /** hit / 総合 / pending をまとめてフェード（日付より 100ms 遅れ） */
  dayHeaderRightCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
  },
  /** Web `ResultDayPipeGroup` の日付：`font-mono … text-cyan-50` + シアングロー */
  dayHeaderDate: {
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(236,254,255,0.95)",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    textShadowColor: "rgba(34,211,238,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dayHitWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    flexShrink: 0,
  },
  dayHitLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.3,
  },
  dayHitNums: {
    ...dayStripNumberText,
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: -0.4,
    lineHeight: 18,
  },
  dayTotalWrap: {
    flexShrink: 0,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 4,
  },
  dayTotalPrefix: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  dayTotalValue: {
    ...dayStripNumberText,
    fontSize: 17,
    color: "rgba(255,255,255,0.98)",
    letterSpacing: -0.4,
    lineHeight: 19,
  },
  dayTotalUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  /** Web `ResultDayPipeGroup` の pending 右寄せラッパ */
  pendingRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingLeft: 4,
  },
  /**
   * 得点未確定ピル — 白黒・グローなし
   */
  pendingPill: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.35,
    color: "rgba(248,250,252,0.88)",
    backgroundColor: "transparent",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  cornerTl: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(34,211,238,0.95)",
    zIndex: 2,
  },
  cornerBr: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(217,70,239,0.88)",
    zIndex: 2,
  },
  cornerTr: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(34,211,238,0.45)",
    zIndex: 2,
  },
  cornerBl: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(34,211,238,0.38)",
    zIndex: 2,
  },
  cardOuter: {
    marginBottom: MOBILE_RESULT_CARD_GAP,
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    alignSelf: "center",
    width: "100%",
  },
  resultCardPressable: {
    flexShrink: 0,
    position: "relative",
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardShell: {
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  },
  /** Web モバイル `ResultCard` の contentPad（px-2 pb-2 pt-9） */
  cardPressableBody: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 8,
    paddingTop: 36,
    paddingBottom: 8,
  },
  /** Web モバイル：左上リーグ */
  cardBadgeOverlay: {
    position: "absolute",
    left: 0,
    top: 6,
    zIndex: 22,
    paddingLeft: 8,
  },
  cardBadgeLeague: {
    maxWidth: 160,
  },
  /** Web `absolute top-1.5 right-11` — HIT 等（メニューと分離） */
  cardBadgeOutcomeAbsolute: {
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 22,
    maxWidth: "68%",
    alignItems: "flex-end",
  },
  /** メニュー展開でフライアウトがはみ出すときのクリップ解除（Web と同様） */
  cardShellOverflowVisible: {
    overflow: "visible",
  },
  cardCaptureWrap: {
    position: "relative",
  },
  /** 左上：線枠 marginTop(14) の内側へ。枠線に乗らないよう少し下げる */
  leftActionCluster: {
    position: "absolute",
    top: 24,
    left: 10,
    zIndex: 60,
    overflow: "visible",
  },
  cardFrameUpset: {
    borderColor: "rgba(254,226,226,0.95)",
    shadowColor: "rgba(248,113,113,1)",
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  cardFrameStreakSilver: {
    borderColor: "rgba(248,250,252,0.92)",
    shadowColor: "rgba(226,232,240,1)",
    shadowOpacity: 0.62,
    shadowRadius: 18,
  },
  cardFrameStreakPlatinum: {
    borderColor: "rgba(207,250,254,0.95)",
    shadowColor: "rgba(34,211,238,1)",
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },
  cardFrameStreakGold: {
    borderColor: "rgba(254,243,199,0.95)",
    shadowColor: "rgba(251,191,36,1)",
    shadowOpacity: 0.72,
    shadowRadius: 22,
  },
  cardFrameHit: {
    borderColor: "rgba(254,243,199,0.92)",
    shadowColor: "rgba(251,191,36,1)",
    shadowOpacity: 0.72,
    shadowRadius: 18,
  },
  cardFramePerfect: {
    borderColor: "rgba(237,233,254,0.95)",
    shadowColor: "rgba(167,139,250,1)",
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  cardFrameMiss: {
    borderColor: "rgba(107,114,128,0.55)",
    shadowColor: "rgba(100,116,139,0.35)",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardContent: {
    position: "relative",
    zIndex: 2,
    paddingTop: 0,
  },
  /** リーグ略称スロット（Web `ResultLeagueBadge` compact） */
  leagueLabelSlot: {
    marginTop: 0,
    marginLeft: 0,
  },
  leaguePill: {
    marginTop: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  leaguePillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  matchArea: {
    position: "relative",
    marginTop: 0,
    minHeight: 88,
  },
  matchGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  flagStack: {
    alignItems: "center",
  },
  sideColHome: {
    paddingTop: 0,
    paddingRight: MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  },
  sideColAway: {
    paddingTop: 0,
    paddingLeft: MOBILE_RESULT_MATCH_SIDE_SCORE_PAD,
  },
  wcTeamStack: {
    alignItems: "center",
    width: 88,
  },
  centerScoreOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 14,
    alignItems: "center",
    zIndex: 10,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  teamName: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(248,250,252,0.95)",
    letterSpacing: 0.6,
    fontFamily: "Oxanium_600SemiBold",
    textAlign: "center",
    width: "100%",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  teamRecordText: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.4,
    color: "rgba(248,250,252,0.6)",
    textAlign: "center",
  },
  teamNameWcWrap: {
    width: 88,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  teamNameWc: {
    width: 88,
    maxWidth: 88,
    alignSelf: "center",
    fontSize: 13,
    lineHeight: 15,
    paddingTop: 0,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  predictedScoreFallback: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    textAlign: "center",
  },
  predictedScoreFallbackBasketball: {
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  finalScoreWrap: {
    marginTop: 3,
  },
  groupCodeLabel: {
    marginBottom: 6,
    maxWidth: "100%",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: DISPLAY_FONT_FAMILY,
    letterSpacing: 5,
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "uppercase",
  },
  divider: {
    marginTop: 6,
    marginBottom: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.14)",
  },
  statBlock: {
    marginTop: 4,
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MOBILE_RESULT_STAT_ROW_GAP,
    paddingVertical: 2,
  },
  /** Skia バーを左基点で scaleX 表示（親の overflow でクリップ） */
  statBarRevealSlot: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  statLabel: {
    width: MOBILE_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  statValue: {
    width: MOBILE_RESULT_STAT_VALUE_W,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontVariant: ["tabular-nums"],
  },
  statValueWhite: {
    color: "rgba(255,255,255,0.95)",
  },
  statValueYellow: {
    color: "rgba(253,224,71,0.95)",
  },
  statValueRed: {
    color: "rgba(248,113,113,0.95)",
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 8,
  },
});
