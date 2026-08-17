/**
 * __DEV__ リザルト左上連勝タグ 16 案ギャラリー。本番は未接続。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../games/matchCardTypography";
import {
  ResultStreakTagPattern,
  STREAK_PATTERN_GALLERY,
  STREAK_SAMPLES,
  streakTagTone,
  type StreakPatternMeta,
} from "./resultStreakTagDesignPreviewPatterns";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function PatternBlock({
  meta,
  ja,
}: {
  meta: StreakPatternMeta;
  ja: boolean;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.code}>{meta.code}</Text>
        <Text style={styles.name}>{ja ? meta.nameJa : meta.nameEn}</Text>
      </View>
      <Text style={styles.note}>{ja ? meta.noteJa : meta.noteEn}</Text>

      <View style={styles.cardMock}>
        <View style={styles.cardMockTop}>
          <ResultStreakTagPattern id={meta.id} n={7} />
          <Text style={styles.cardMockEyebrow}>HIT</Text>
        </View>
        <Text style={styles.cardMockScore}>112 — 108</Text>
      </View>

      <View style={styles.row}>
        {STREAK_SAMPLES.map((n) => (
          <View key={n} style={styles.cell}>
            <Text style={styles.cellCap}>{streakLabelCap(n, ja)}</Text>
            <ResultStreakTagPattern id={meta.id} n={n} />
          </View>
        ))}
      </View>
    </View>
  );
}

function streakLabelCap(n: number, ja: boolean) {
  const tone = streakTagTone(n);
  return ja ? `W${n} ${tone.nameJa}` : `W${n} ${tone.nameEn}`;
}

export default function ResultStreakTagDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();

  return (
    <MobilePageShell
      title="STREAK TAG"
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "カード左上の連勝タグ案。本番は未反映。"
          : "Top-left streak tag patterns. Not wired to production."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(28, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {ja
            ? "文字は W3 / W5 / W7 / W10。色は 鋼→電→金→紅。各案の上段はカード左上の実寸イメージ（W7）。"
            : "Labels: W3 / W5 / W7 / W10. Colors: steel → cyber → gold → hot. Top of each block is card-corner scale (W7)."}
        </Text>
        <View style={styles.legend}>
          {STREAK_SAMPLES.map((n) => {
            const tone = streakTagTone(n);
            return (
              <View key={n} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: tone.accent }]} />
                <Text style={[styles.legendText, { color: tone.accent }]}>
                  {ja ? `W${n} ${tone.nameJa}` : `W${n} ${tone.nameEn}`}
                </Text>
              </View>
            );
          })}
        </View>
        {STREAK_PATTERN_GALLERY.map((meta) => (
          <PatternBlock key={meta.id} meta={meta} ja={ja} />
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 18,
  },
  lead: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 8,
    height: 8,
  },
  legendText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  block: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    backgroundColor: "rgba(5,8,14,0.55)",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  blockHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  code: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#4ff7f4",
  },
  name: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 20,
    letterSpacing: 1.2,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  note: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    lineHeight: 15,
    color: "rgba(148,163,184,0.88)",
    marginTop: -4,
  },
  cardMock: {
    backgroundColor: "#0a0e16",
    borderWidth: 1,
    borderColor: "rgba(79,247,244,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardMockTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMockEyebrow: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "rgba(148,163,184,0.7)",
    paddingTop: 4,
  },
  cardMockScore: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    letterSpacing: 1,
    color: "#E2E8F0",
    marginTop: 6,
    includeFontPadding: false,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 14,
    paddingTop: 2,
  },
  cell: {
    flexShrink: 0,
    gap: 6,
    alignItems: "flex-start",
  },
  cellCap: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "rgba(148,163,184,0.7)",
  },
});
