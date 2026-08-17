/** Web `/mobile/live-game-stats-preview` 相当 */
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import { LiveMarkPill } from "../LiveMarkPill";
import ResultMatchScoreLineNative from "../../results/ResultMatchScoreLineNative";
import {
  liveMarkPillCyberBase,
  liveMarkTextCyberBase,
} from "../../../ui/liveMarkCyberStyles";
import {
  liveGameStatsPreviewReport,
  type LiveGamePhase,
  type LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStatsPreviewMocks";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import LiveGameStatsPanelNative from "./LiveGameStatsPanelNative";

const OXANIUM = "Oxanium_700Bold";
const OXANIUM_800 = "Oxanium_800ExtraBold";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function MatchTapCard({
  report,
  language,
  onOpen,
}: {
  report: LiveGameStatsReport;
  language: "ja" | "en";
  onOpen: () => void;
}) {
  const isJa = language === "ja";
  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#e8edf5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#e8edf5";
  const isLive = report.phase === "live";
  const clock = [report.periodLabel, report.clock ?? ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.cardTop}>
        {isLive ? (
          <LiveMarkPill
            pillStyle={styles.livePill}
            textStyle={styles.livePillText}
          />
        ) : (
          <Text style={styles.finalBadge}>FINAL</Text>
        )}
        <Text style={styles.clock}>{clock}</Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.abbr, styles.abbrRight, { color: homeColor }]} numberOfLines={1}>
          {report.home.abbr}
        </Text>
        <ResultMatchScoreLineNative
          home={report.home.score}
          away={report.away.score}
          density="listBasketball"
          style={styles.score}
        />
        <Text style={[styles.abbr, styles.abbrLeft, { color: awayColor }]} numberOfLines={1}>
          {report.away.abbr}
        </Text>
      </View>

      <Text style={styles.tapHint}>
        {isJa ? "タップでスタッツを開く" : "Tap to open stats"}
      </Text>
    </Pressable>
  );
}

export default function LiveGameStatsPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const liveReport = useMemo(() => liveGameStatsPreviewReport("live"), []);
  const finalReport = useMemo(() => liveGameStatsPreviewReport("final"), []);
  const [openPhase, setOpenPhase] = useState<LiveGamePhase | null>(null);

  const openReport =
    openPhase === "live"
      ? liveReport
      : openPhase === "final"
        ? finalReport
        : null;

  return (
    <MobilePageShell
      title="Live Game Stats"
      eyebrow="PREVIEW"
      subtitle={
        isJa
          ? "試合カード → チームスタッツ + ボックススコア。データは mock。"
          : "Match card → Team stats + Box score. Mock data."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.pad}>
        <MatchTapCard
          report={liveReport}
          language={language}
          onOpen={() => setOpenPhase("live")}
        />
        <MatchTapCard
          report={finalReport}
          language={language}
          onOpen={() => setOpenPhase("final")}
        />
      </ScrollView>

      <Modal
        visible={openReport != null}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenPhase(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpenPhase(null)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.sheetTop}>
              <View style={styles.handle} />
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetPad}
              showsVerticalScrollIndicator={false}
            >
              {openReport ? (
                <LiveGameStatsPanelNative
                  report={openReport}
                  language={language}
                />
              ) : null}
            </ScrollView>
            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => setOpenPhase(null)}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: {
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  livePill: {
    ...liveMarkPillCyberBase,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  livePillText: {
    ...liveMarkTextCyberBase,
    fontSize: 8,
    letterSpacing: 1,
  },
  finalBadge: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  clock: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  abbr: {
    flex: 1,
    minWidth: 0,
    fontFamily: OXANIUM_800,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  abbrRight: { textAlign: "right" },
  abbrLeft: { textAlign: "left" },
  score: {
    fontSize: 24,
    lineHeight: 26,
    color: "#fff",
  },
  tapHint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#07090f",
    paddingTop: 10,
  },
  sheetTop: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sheetScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  sheetPad: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sheetFooter: {
    flexShrink: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
