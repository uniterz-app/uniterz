/** Web 未実装 — Native MARK LIST。左から横スライドするサイドシート。 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MAX_MARKS_FREE, type UserMark } from "../../../../../lib/marks/markTypes";
import { loadMarksWeeklyBoard, peekMarksWeeklyBoard } from "../../../../../lib/profile/fetchMarksWeeklyBoard";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { peekProfileUserDocNative } from "./profileUserDocCacheNative";
import ProfileBackEdgeHandleNative from "./ProfileBackEdgeHandleNative";
import ProCyberBadgeNative from "./kinetik/ProCyberBadgeNative";
import UniterzUMarkNative from "../units/UniterzUMarkNative";
import { CyberRankNumberNative } from "../rankings/CyberRankNumberNative";
import { RankingsAvatarNative } from "../rankings/RankingsAvatarAndTabs";
import {
  METRIC_FONT,
  RANKING_SCORE_FONT,
  rankingNameFont,
  rankingTagFont,
} from "../rankings/rankingsUiTheme";
import {
  hasJaScript,
  rankingFontSizePx,
} from "../../../../../lib/rankings/rankingJaTextSize";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import {
  CYBER_LIST_CYAN,
  CYBER_LIST_MAGENTA,
  cyberMetricTag,
} from "../../../../../lib/rankings/cyberRankVisual";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { profileMarkListCopy } from "./profileOverviewWidgetsCopy";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";

export type MarkListRow = UserMark & {
  weeklyRank: number | null;
  weeklyPoints: number | null;
  isPro: boolean;
  /** 既知のときだけ（未キャッシュは null → open 時に warm で再解決） */
  planProBgVariant: string | null;
};

function isProPlan(data: Record<string, unknown> | null | undefined): boolean {
  return data?.plan === "pro";
}

function skinFromPeek(uid: string, isPro: boolean): string | null {
  if (!isPro) return null;
  const data = peekProfileUserDocNative(uid);
  const raw = data?.planProBgVariant;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function rowsFromBoard(
  marks: UserMark[],
  board: Record<string, { rank: number | null; points: number | null; isPro: boolean }>
): MarkListRow[] {
  const next = marks.map((m) => {
    const entry = board[m.targetUid];
    const isPro = entry?.isPro ?? isProPlan(peekProfileUserDocNative(m.targetUid));
    return {
      ...m,
      weeklyRank: entry?.rank ?? null,
      weeklyPoints: entry?.points ?? null,
      isPro,
      planProBgVariant: skinFromPeek(m.targetUid, isPro),
    } satisfies MarkListRow;
  });
  next.sort((a, b) => {
    const ar = a.weeklyRank ?? 99999;
    const br = b.weeklyRank ?? 99999;
    if (ar !== br) return ar - br;
    return (b.weeklyPoints ?? 0) - (a.weeklyPoints ?? 0);
  });
  return next;
}

type Props = {
  visible: boolean;
  language: string;
  marks: UserMark[];
  loading: boolean;
  maxMarks?: number;
  markedByCount?: number;
  onClose: () => void;
  onOpenProfile: (row: MarkListRow) => void;
  onUnmark: (targetUid: string) => void;
};

const AVATAR = 32;
/** 右端 BACK タブと背景の覗き窓 */
const SHEET_RIGHT_GAP = 28;
const EXIT_MS = 220;

function MarkListSheetBody({
  visible,
  language,
  marks,
  loading,
  maxMarks = MAX_MARKS_FREE,
  markedByCount = 0,
  onClose,
  onOpenProfile,
  onUnmark,
}: Props) {
  const insets = useSafeAreaInsets();
  const copy = profileMarkListCopy(language);
  const [rows, setRows] = useState<MarkListRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const metricTag = cyberMetricTag("totalScore", resolveLocalizedLang(language));
  const tagFontSize = rankingFontSizePx(7, metricTag);
  const sheetWidth = useMemo(
    () => Math.max(280, Dimensions.get("window").width - SHEET_RIGHT_GAP),
    []
  );
  const slide = useRef(new Animated.Value(-sheetWidth - 24)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(-sheetWidth - 24);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: -sheetWidth - 24,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slide, backdrop, sheetWidth]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const apiBase = getUniterzApiBaseUrl() || undefined;
    const uids = marks.map((m) => m.targetUid);
    const peeked = peekMarksWeeklyBoard(uids);
    setRows(rowsFromBoard(marks, peeked.board));

    if (marks.length === 0 || peeked.missing.length === 0) {
      setStatsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setStatsLoading(true);
    void loadMarksWeeklyBoard(uids, apiBase)
      .then((board) => {
        if (cancelled) return;
        setRows(rowsFromBoard(marks, board));
        setStatsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marks, visible]);

  /** 取得中でも 0 件なら空表示（無限スピナーを避ける） */
  const showSpinner = loading && marks.length === 0;
  const showEmpty = !showSpinner && marks.length === 0;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            intensity={Platform.OS === "ios" ? 48 : 36}
            tint="dark"
            {...nativeBlurViewExtraProps()}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={styles.backdropDim} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.back}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrap,
          {
            width: sheetWidth,
            paddingTop: Math.max(insets.top, 12) + 10,
            transform: [{ translateX: slide }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.sheetInner}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <UniterzUMarkNative size={22} color="#a5f3fc" />
              <Text style={styles.title}>MARK LIST</Text>
            </View>
            <Text style={styles.sub}>
              {copy.sub(marks.length, maxMarks, markedByCount)}
            </Text>
          </View>

          {showSpinner ? (
            <View style={styles.center}>
              <ActivityIndicator color="#a5f3fc" />
            </View>
          ) : showEmpty ? (
            <View style={styles.center}>
              <MaterialCommunityIcons
                name="crosshairs"
                size={28}
                color="rgba(165,243,252,0.45)"
              />
              <Text style={styles.empty}>
                {copy.empty}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {copy.weekly}
                </Text>
                <View style={styles.sectionTitleLine} />
              </View>
              {statsLoading ? (
                <Text style={styles.hint}>
                  {copy.loadingWeekly}
                </Text>
              ) : null}
              {rows.map((row) => {
                const handle = row.handle.trim();
                const nameJa = hasJaScript(row.displayName);
                const nameFontSize = rankingFontSizePx(13, row.displayName);
                const rank = row.weeklyRank;
                const pts = row.weeklyPoints;
                return (
                  <Pressable
                    key={row.targetUid}
                    onPress={() => {
                      if (!handle) return;
                      onOpenProfile(row);
                    }}
                    style={({ pressed }) => [
                      styles.article,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.rowInner}>
                      <View style={styles.rankCol}>
                        <CyberRankNumberNative
                          rank={rank && rank > 0 ? rank : 99}
                          compact
                          muted={rank == null || rank < 1}
                          displayValue={
                            rank != null && rank > 0
                              ? String(rank).padStart(2, "0")
                              : "—"
                          }
                        />
                      </View>
                      <View style={styles.avatarSquare}>
                        <View style={styles.avatarCrop}>
                          <RankingsAvatarNative
                            photoURL={row.photoURL}
                            label={row.displayName}
                            size={AVATAR}
                            square
                          />
                        </View>
                      </View>
                      <View style={styles.mainCol}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[
                              styles.name,
                              {
                                fontSize: nameFontSize,
                                letterSpacing: nameJa ? 0.4 : 0.6,
                                fontFamily: rankingNameFont(row.displayName),
                                textTransform: nameJa ? "none" : "uppercase",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {row.displayName}
                          </Text>
                          {row.isPro ? <ProCyberBadgeNative compact /> : null}
                        </View>
                        <Text style={styles.handle} numberOfLines={1}>
                          {handle ? `@${handle}` : ""}
                        </Text>
                      </View>
                      <View style={styles.scoreCol}>
                        <View style={styles.scoreSkew}>
                          <Text style={styles.scoreMain}>
                            {pts != null ? formatMetricDecimals(pts, 1) : "—"}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.metricTag,
                            {
                              fontSize: tagFontSize,
                              fontFamily: rankingTagFont(metricTag),
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {metricTag}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => onUnmark(row.targetUid)}
                        hitSlop={8}
                        style={styles.unmarkBtn}
                        accessibilityRole="button"
                        accessibilityLabel={copy.unmark}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={16}
                          color="rgba(255,255,255,0.45)"
                        />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Animated.View>

      <ProfileBackEdgeHandleNative
        onPress={onClose}
        accessibilityLabel={copy.back}
      />
    </View>
  );
}

export default function ProfileMarkListOverlayNative(props: Props) {
  const [mounted, setMounted] = useState(props.visible);

  useEffect(() => {
    if (props.visible) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [props.visible]);

  if (!mounted && !props.visible) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      {...(Platform.OS === "ios"
        ? ({ presentationStyle: "overFullScreen" } as const)
        : {})}
      onRequestClose={props.onClose}
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <MarkListSheetBody {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  sheetWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(6,8,12,0.96)",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(165,243,252,0.22)",
  },
  sheetInner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74,163,255,0.22)",
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    color: "#e0faff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  sub: {
    color: "rgba(226, 242, 255, 0.78)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
    paddingLeft: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  empty: {
    color: "rgba(226,242,255,0.72)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.92)",
  },
  sectionTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.42)",
  },
  hint: {
    color: "rgba(200,236,255,0.7)",
    fontSize: 11,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  article: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
  },
  rowPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 56,
  },
  rankCol: {
    width: 40,
    height: AVATAR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSquare: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  avatarCrop: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    color: CYBER_LIST_CYAN,
    fontWeight: "700",
    textShadowColor: "rgba(0,245,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  handle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: METRIC_FONT,
  },
  scoreCol: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 56,
    paddingLeft: 2,
  },
  scoreSkew: {
    transform: [{ skewX: "-12deg" }],
  },
  scoreMain: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: RANKING_SCORE_FONT,
    fontWeight: "700",
    includeFontPadding: false,
  },
  metricTag: {
    marginTop: 2,
    color: CYBER_LIST_MAGENTA,
    fontWeight: "700",
    letterSpacing: 2,
    lineHeight: 12,
    includeFontPadding: false,
    textTransform: "uppercase",
  },
  unmarkBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
