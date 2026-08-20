/** Web 未実装 — Native MARK LIST。得点上位行に近い細いサイバーリスト。 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_MARKS_FREE, type UserMark } from "../../../../../lib/marks/markTypes";
import { loadMarksWeeklyBoard, peekMarksWeeklyBoard } from "../../../../../lib/profile/fetchMarksWeeklyBoard";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import MarkListFloorGridNative from "./MarkListFloorGridNative";
import { peekProfileUserDocNative } from "./profileUserDocCacheNative";
import ProCyberBadgeNative from "./kinetik/ProCyberBadgeNative";
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

export type MarkListRow = UserMark & {
  weeklyRank: number | null;
  weeklyPoints: number | null;
  isPro: boolean;
};

function isProPlan(data: Record<string, unknown> | null | undefined): boolean {
  return data?.plan === "pro";
}

function rowsFromBoard(
  marks: UserMark[],
  board: Record<string, { rank: number | null; points: number | null; isPro: boolean }>
): MarkListRow[] {
  const next = marks.map((m) => {
    const entry = board[m.targetUid];
    return {
      ...m,
      weeklyRank: entry?.rank ?? null,
      weeklyPoints: entry?.points ?? null,
      isPro: entry?.isPro ?? isProPlan(peekProfileUserDocNative(m.targetUid)),
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
  language: "ja" | "en";
  marks: UserMark[];
  loading: boolean;
  maxMarks?: number;
  markedByCount?: number;
  onClose: () => void;
  onOpenProfile: (handle: string) => void;
  onUnmark: (targetUid: string) => void;
};

const AVATAR = 32;

export default function ProfileMarkListOverlayNative({
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
  const isJa = language === "ja";
  const [rows, setRows] = useState<MarkListRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const metricTag = cyberMetricTag("totalScore", language);
  const tagFontSize = rankingFontSizePx(7, metricTag);

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <MarkListFloorGridNative />
        <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>MARK LIST</Text>
            <Text style={styles.sub}>
              {isJa
                ? `マーク中 ${marks.length}/${maxMarks} · マークされた数 ${markedByCount}`
                : `Marked ${marks.length}/${maxMarks} · marked by ${markedByCount}`}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeText}>{isJa ? "閉じる" : "Close"}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#a5f3fc" />
          </View>
        ) : marks.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="crosshairs"
              size={28}
              color="rgba(165,243,252,0.45)"
            />
            <Text style={styles.empty}>
              {isJa
                ? "他の予想者を MARK するとここに並びます"
                : "MARK other predictors to see them here"}
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
                {isJa ? "今週の順位" : "WEEKLY"}
              </Text>
              <View style={styles.sectionTitleLine} />
            </View>
            {statsLoading ? (
              <Text style={styles.hint}>
                {isJa ? "今週の成績を読み込み中…" : "Loading weekly stats…"}
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
                    onClose();
                    onOpenProfile(handle);
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
                      accessibilityLabel={isJa ? "マークを外す" : "Unmark"}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74,163,255,0.18)",
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: METRIC_FONT,
    color: "#a5f3fc",
    fontSize: 12,
    letterSpacing: 1.8,
  },
  sub: {
    marginTop: 4,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  closeText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  empty: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 12,
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(0,245,255,0.75)",
  },
  sectionTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.35)",
  },
  hint: {
    color: "rgba(165,243,252,0.55)",
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
