import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Platform, Pressable, RefreshControl, SectionList, StyleSheet, Text, View, type LayoutChangeEvent, type ViewStyle,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { Language } from "../../../../../lib/i18n/language";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";
import { db } from "../../lib/firebase";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { colors, spacing, typography } from "../../theme/tokens";
import { getTeamAlias, splitTeamNameByLeague } from "../../utils/teamName";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import CountryFlagNative from "../games/CountryFlagNative";
import { resolvePostListLeague, LEAGUES } from "../../../../../lib/leagues";
import TutorialTargetNative from "../tutorial/TutorialTargetNative";
import {
  readTutorialLivePhaseNative,
} from "../tutorial/tutorialLivePhaseNative";
import {
  readTutorialLivePickNative,
} from "../tutorial/tutorialLivePickNative";
import type { TutorialLivePickPayload } from "../../../../../lib/tutorial/tutorialLivePick";
import {
  buildTutorialResultPost,
  TUTORIAL_RESULT_POST_ID,
} from "../../../../../lib/tutorial/tutorialNbaUi";
import { prependTutorialResultPost } from "../../../../../lib/tutorial/prependTutorialResultPost";
import type { ResultDayGroup as LibResultDayGroup } from "../../../../../lib/result/result-page-data";
import { registerTutorialScrollHost } from "../tutorial/tutorialMeasureNative";
import { setTutorialResultDetailHandlers } from "../tutorial/tutorialResultDetailEventsNative";
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
  DAY_STRIP_METRIC_FONT,
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
import { resolvePkScoreFromResultPost } from "../../../../../lib/games/pkScore";
import ResultDeleteConfirmModal from "./ResultDeleteConfirmModal";
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
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { t as i18nT } from "../../../../../lib/i18n/t";
import { shareResultCardNative } from "./shareResultCardNative";
import ShareLinkCaptureFooterNative from "../share/ShareLinkCaptureFooterNative";
import { buildResultShareUrl, getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";

const JERSEY_SIZE_RESULT = MOBILE_RESULT_JERSEY_SIZE;

/** Web モバイル日付帯グリッド — `opacity-[0.08]` + 14px */
const DAY_HEADER_MOBILE_GRID_STEP = 14;
const DAY_HEADER_MOBILE_GRID_LINE = "rgba(34,211,238,0.45)";
const DAY_HEADER_MOBILE_GRID_OPACITY = 0.08;

const dayHeaderGridStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});

function ResultDayHeaderGridOverlay({ mobileStrip = false }: { mobileStrip?: boolean }) {
  const step = DAY_HEADER_MOBILE_GRID_STEP;
  const lineColor = DAY_HEADER_MOBILE_GRID_LINE;
  const opacity = mobileStrip ? DAY_HEADER_MOBILE_GRID_OPACITY : 0.1;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const verticalLefts = useMemo(() => {
    const out: number[] = [];
    for (let x = step; x < size.w; x += step) {
      out.push(x);
    }
    return out;
  }, [size.w, step]);
  const horizontalTops = useMemo(() => {
    const out: number[] = [];
    for (let y = step; y < size.h; y += step) {
      out.push(y);
    }
    return out;
  }, [size.h, step]);

  function onGridLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View pointerEvents="none" style={dayHeaderGridStyles.overlay} onLayout={onGridLayout}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity }]}
      >
        {verticalLefts.map((left) => (
          <View
            key={`dhgv-${left}`}
            style={[dayHeaderGridStyles.gridLineV, { left, backgroundColor: lineColor }]}
          />
        ))}
        {horizontalTops.map((top) => (
          <View
            key={`dhgh-${top}`}
            style={[dayHeaderGridStyles.gridLineH, { top, backgroundColor: lineColor }]}
          />
        ))}
      </View>
    </View>
  );
}

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
      </View>
      {filterPanelOpen ? filterPanel : null}
    </View>
  );
}

function ResultDayHeader({
  dateLabel,
  dayPoints,
  entranceActive,
  sectionStaggerIndex,
}: {
  dateLabel: string;
  dayPoints: NativeDayPointsHeader;
  entranceActive: boolean;
  sectionStaggerIndex: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { clipStyle, dateClusterStyle, rightClusterStyle } = useResultDayHeaderEntrance(
    entranceActive,
    reduceMotion,
    sectionStaggerIndex
  );
  return (
    <View style={[styles.listRowOuter, styles.dayHeaderSpacing]}>
      <View style={resultDayStripPanelNative.outer}>
        <Animated.View style={[resultDayStripPanelNative.panel, clipStyle]}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 22 : 14}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={resultDayStripPanelNative.glassBlur}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.08)",
              "rgba(255,255,255,0.035)",
              "rgba(255,255,255,0.015)",
            ]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={resultDayStripPanelNative.glassSheen}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(34,211,238,0.95)", "rgba(34,211,238,0.2)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={resultDayStripPanelNative.leftAccent}
          />
          <View style={resultDayStripPanelNative.insetTopHighlight} pointerEvents="none" />
          <View style={resultDayStripPanelNative.insetBottomShade} pointerEvents="none" />
          <View style={resultDayStripPanelNative.cornerTl} pointerEvents="none" />
          <View style={resultDayStripPanelNative.cornerBr} pointerEvents="none" />
          <ResultDayHeaderGridOverlay mobileStrip />
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
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { topContentPadY } = useBottomTabBarInsets();
  const listTopPad = topContentPadY;
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const uid = fUser?.uid ?? null;

  useEffect(() => {
    let alive = true;
    async function loadLang() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!alive) return;
        const row = snap.data() as { language?: unknown } | undefined;
        setLanguage(row?.language === "en" ? "en" : "ja");
      } catch {
        if (!alive) return;
        setLanguage("ja");
      }
    }
    void loadLang();
    return () => {
      alive = false;
    };
  }, [uid]);

  const t = useMemo(
    () =>
      language === "ja"
        ? {
            empty: "まだ予想の投稿がありません。",
            cacheHint: "古い投稿の一部は表示を省略しています。",
            pull: "引っ張って更新",
            filterFold: "絞り込み条件を指定",
            filterClose: "閉じる",
          }
        : {
            empty: "No predictions yet.",
            cacheHint: "Older posts may be omitted from this list.",
            pull: "Pull to refresh",
            filterFold: "Specify filters",
            filterClose: "Close",
          },
    [language]
  );

  const [listNowTick, setListNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setListNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<PostWithMillis | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const deleteSubmittingRef = useRef(false);

  const { showResultLeagueTabs, defaultLeagueTab, flagsReady } =
    useResultLeagueFlagsNative(uid ?? null);
  const [leagueTab, setLeagueTab] = useState<ResultListLeagueTab | null>(null);
  useEffect(() => {
    if (!flagsReady || leagueTab !== null) return;
    setLeagueTab(defaultLeagueTab);
  }, [flagsReady, defaultLeagueTab, leagueTab]);

  const [tutorialBoost, setTutorialBoost] =
    useState<TutorialLivePickPayload | null>(null);
  const resultListRef = useRef<SectionListType<PostWithMillis, SectionT>>(null);
  const resultScrollYRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const phase = await readTutorialLivePhaseNative();
        if (cancelled) return;
        if (phase === "results" || phase === "gotoResults" || phase === "resultDetail") {
          const pick = await readTutorialLivePickNative();
          if (cancelled) return;
          setTutorialBoost(pick);
          if (pick) setLeagueTab(LEAGUES.NBA);
        } else {
          setTutorialBoost(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (!tutorialBoost) return;
    return registerTutorialScrollHost({
      getOffsetY: () => resultScrollYRef.current,
      scrollBy: (dy, animated) => {
        const list = resultListRef.current as unknown as {
          getScrollResponder?: () => {
            scrollTo?: (opts: { y: number; animated?: boolean }) => void;
          } | null;
        } | null;
        const y = Math.max(0, resultScrollYRef.current + dy);
        list?.getScrollResponder?.()?.scrollTo?.({ y, animated });
      },
    });
  }, [tutorialBoost]);

  useEffect(() => {
    return setTutorialResultDetailHandlers({
      onOpen: () => setDetailPostId(TUTORIAL_RESULT_POST_ID),
      onClose: () =>
        setDetailPostId((cur) =>
          cur === TUTORIAL_RESULT_POST_ID ? null : cur
        ),
    });
  }, []);

  const { grouped, loading, postsCacheCapped, refreshPosts, loadMore, removePostById } =
    useNativeResultPosts(uid, language, {
      league: leagueTab,
      enabled: leagueTab !== null,
    });

  const refreshPostsRef = useRef(refreshPosts);
  refreshPostsRef.current = refreshPosts;
  const lastFocusRefreshAtRef = useRef(0);

  /** タブ再訪で再取得（精算直後の pending を残さない）。
   * 連打で毎回 Firestore を叩かないよう最短間隔を空ける。
   * refreshPosts を deps に入れると identity 変化でフォーカス中に無限再取得になる */
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusRefreshAtRef.current < 30_000) return;
      lastFocusRefreshAtRef.current = now;
      void refreshPostsRef.current();
    }, [])
  );

  const hasPendingSettlement = useMemo(
    () => grouped.some((g) => g.pending.length > 0),
    [grouped]
  );

  /** 未精算カードがある間は定期再取得（Cloud Functions 精算完了を待つ） */
  useEffect(() => {
    if (!hasPendingSettlement) return;
    const id = setInterval(() => void refreshPostsRef.current(), 120_000);
    return () => clearInterval(id);
  }, [hasPendingSettlement]);

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

    if (!tutorialBoost) return base;
    return prependTutorialResultPost(
      base as unknown as LibResultDayGroup[],
      buildTutorialResultPost(tutorialBoost.pick, tutorialBoost.grade),
      language === "en" ? "en" : "ja"
    ) as unknown as ResultDayGroup[];
  }, [
    grouped,
    resultFilters,
    leagueTab,
    showResultLeagueTabs,
    tutorialBoost,
    language,
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
      await refreshPosts();
    } finally {
      setManualRefreshing(false);
    }
  }, [refreshPosts]);

  const confirmDismissPostFromList = useCallback(async () => {
    const post = deleteConfirmPost;
    if (!post || deleteSubmittingRef.current) return;
    if (!canDismissResultListPostNow(post, Date.now())) {
      setDeleteConfirmPost(null);
      return;
    }
    deleteSubmittingRef.current = true;
    setDeleteInProgress(true);
    try {
      await deletePredictionPostApi(post.id);
      removePostById(post.id);
      setDeleteConfirmPost(null);
    } catch (err) {
      const msg =
        err instanceof PredictionApiError
          ? err.message
          : language === "en"
            ? "Could not delete."
            : "削除に失敗しました。";
      cyberAlert(language === "en" ? "Error" : "エラー", msg);
    } finally {
      deleteSubmittingRef.current = false;
      setDeleteInProgress(false);
    }
  }, [deleteConfirmPost, language, removePostById]);

  const listEmpty =
    !loading && filteredGrouped.length === 0 ? (
      <View style={styles.emptyNoDataWrap}>
        <Text style={styles.emptyNoDataText}>NO DATA</Text>
      </View>
    ) : null;

  const showInitialSpinner =
    leagueTab === null || (loading && grouped.length === 0);

  /** 下端はスクロール内容側のパディングのみ（親に付けるとナビ下が塗りつぶされリストが届かない） */
  const listContentWithBottomPad = useMemo(
    () => [styles.listContent, { paddingTop: listTopPad, paddingBottom: bottomReserveY }],
    [bottomReserveY, listTopPad]
  );

  return (
    <View style={styles.resultScreenWrap}>
    <View style={styles.root}>
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
        <SectionList<PostWithMillis, SectionT>
          ref={resultListRef}
          style={styles.listScroll}
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={listContentWithBottomPad}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          scrollEventThrottle={16}
          onScroll={(e) => {
            resultScrollYRef.current = e.nativeEvent.contentOffset.y;
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
            />
          }
          onEndReached={() => loadMore()}
          onEndReachedThreshold={0.4}
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
                entranceActive={entranceArmed && isInitialHeader}
                sectionStaggerIndex={sectionIndex >= 0 ? sectionIndex : 0}
              />
            );
          }}
          renderItem={({ item, index, section }) => {
            const card = (
              <ResultPostCardNative
                post={item}
                pkScore={resolveResultPostPkScore(item, pkFromGames)}
                language={language}
                nowMs={listNowTick}
                viewerUid={
                  item.id === TUTORIAL_RESULT_POST_ID ? null : uid
                }
                listEnterIndex={section.baseFlatIndex + index}
                entranceEnabled={entranceArmed}
                siblingOverlayOpen={detailPostId != null}
                onOpenDetail={(id) => {
                  setDetailPostId(id);
                }}
                onRequestDeleteConfirm={setDeleteConfirmPost}
                onRequestPredictEdit={
                  item.id === TUTORIAL_RESULT_POST_ID
                    ? undefined
                    : openPredictEditFromResult
                }
              />
            );
            if (item.id === TUTORIAL_RESULT_POST_ID) {
              return (
                <TutorialTargetNative id="result-card">
                  {card}
                </TutorialTargetNative>
              );
            }
            return card;
          }}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        />
      )}
    </View>
    <ResultDetailScreen
      visible={detailPostId != null}
      postId={detailPostId}
      language={language}
      onClose={() => setDetailPostId(null)}
    />
    <ResultDeleteConfirmModal
      visible={deleteConfirmPost != null}
      isEn={language === "en"}
      loading={deleteInProgress}
      onCancel={() => {
        if (!deleteInProgress) setDeleteConfirmPost(null);
      }}
      onConfirm={() => void confirmDismissPostFromList()}
    />
    <TutorialLiveHostNative
      page="results"
      language={(language === "en" ? "en" : "ja") as Language}
    />
    </View>
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
    backgroundColor: "rgba(34,211,238,0.95)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    marginLeft: "auto",
  },
  hint: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  /** 絞り込み・日付帯・リザルトカードで共通の横幅（`listContent` の内側いっぱい） */
  listRowOuter: {
    alignSelf: "stretch",
    width: "100%",
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
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.3,
  },
  dayHitNums: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    fontFamily: DAY_STRIP_METRIC_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
    lineHeight: 22,
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
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  dayTotalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "rgba(255,255,255,0.98)",
    fontFamily: DAY_STRIP_METRIC_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  dayTotalUnit: {
    fontSize: 12,
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
   * Web `ResultDayPipeGroup` pending と同型:
   * `border-dashed border-fuchsia-500/50 bg-black/60 px-2.5 py-1.5 font-mono … text-fuchsia-300/80`
   * `box-shadow:0_0_16px_-4px_rgba(217,70,239,0.4)` … 親が overflow:hidden のため外側シャドウはテキスト側のグローで代替
   */
  pendingPill: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(217,70,239,0.55)",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(217,70,239,0.4)",
        shadowOpacity: 1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: "600",
    /** Web `tracking-wide` 相当 */
    letterSpacing: 0.35,
    /** Tailwind `text-fuchsia-300/80` に近い */
    color: "rgba(240,171,252,0.82)",
    backgroundColor: "transparent",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    textShadowColor: "rgba(217,70,239,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.OS === "ios" ? 10 : 6,
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
  /** 左上：Web mobile `CyberMenuButton` + 右／下フライアウト */
  leftActionCluster: {
    position: "absolute",
    top: 6,
    left: 8,
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
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(248,250,252,0.95)",
    letterSpacing: 1.04,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    textAlign: "center",
    width: "100%",
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
