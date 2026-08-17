/**
 * __DEV__ リザルト右上スタンプ 10 案ギャラリー。本番は未接続。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../games/matchCardTypography";
import { OUTCOME_KINDS } from "./resultBadgeDesignPreviewPatterns";
import {
  ResultStampPattern,
  STAMP_PATTERN_GALLERY,
  type StampPatternMeta,
} from "./resultStampDesignPreviewPatterns";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function MiniCard({
  kind,
  id,
  caption,
}: {
  kind: "hit" | "miss";
  id: StampPatternMeta["id"];
  caption: string;
}) {
  return (
    <View style={styles.cardMock}>
      <View style={styles.cardMockTop}>
        <Text style={styles.cardMockEyebrow}>{caption}</Text>
        <ResultStampPattern id={id} kind={kind} />
      </View>
      <Text style={styles.cardMockScore}>112 — 108</Text>
    </View>
  );
}

function PatternBlock({
  meta,
  ja,
}: {
  meta: StampPatternMeta;
  ja: boolean;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.code}>{meta.code}</Text>
        <Text style={styles.name}>{ja ? meta.nameJa : meta.nameEn}</Text>
      </View>
      <Text style={styles.note}>{ja ? meta.noteJa : meta.noteEn}</Text>

      <View style={styles.cardPair}>
        <MiniCard id={meta.id} kind="hit" caption="HIT" />
        <MiniCard id={meta.id} kind="miss" caption="MISS" />
      </View>

      <View style={styles.row}>
        {OUTCOME_KINDS.map((kind) => (
          <View key={kind} style={styles.cell}>
            <Text style={styles.cellCap}>{kind.toUpperCase()}</Text>
            <ResultStampPattern id={meta.id} kind={kind} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ResultStampDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();

  return (
    <MobilePageShell
      title="RESULT STAMP"
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "サイバー HUD の押印。文字は HIT / MISS / PERFECT / UPSET のみ。本番は未反映。"
          : "Cyber HUD stamps. Words: HIT / MISS / PERFECT / UPSET only. Not in production."
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
            ? "角切り・二重枠・スキャン線。色は HIT 金 / PERFECT 青 / UPSET 赤 / MISS 鋼。"
            : "Chamfer, double frame, scanlines. HIT gold / PERFECT blue / UPSET red / MISS steel."}
        </Text>
        {STAMP_PATTERN_GALLERY.map((meta) => (
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
  cardPair: {
    flexDirection: "row",
    gap: 8,
  },
  cardMock: {
    flex: 1,
    backgroundColor: "#0a0e16",
    borderWidth: 1,
    borderColor: "rgba(79,247,244,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: "visible",
  },
  cardMockTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    minHeight: 36,
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
    fontSize: 18,
    letterSpacing: 1,
    color: "#E2E8F0",
    marginTop: 6,
    includeFontPadding: false,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 12,
    paddingTop: 4,
  },
  cell: {
    flexShrink: 0,
    alignItems: "center",
    gap: 6,
  },
  cellCap: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(148,163,184,0.7)",
  },
});
