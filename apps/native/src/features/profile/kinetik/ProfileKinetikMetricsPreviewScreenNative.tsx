/**
 * __DEV__ プロフィール 2x2 メトリクスカード見た目案。本番コンポーネントは未接続。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../../games/matchCardTypography";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import {
  MetricPatternGrid,
  PATTERN_GALLERY,
  type PatternMeta,
} from "./profileKinetikMetricCardPreviewPatterns";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function PatternBlock({
  meta,
  ja,
}: {
  meta: PatternMeta;
  ja: boolean;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.code}>{meta.code}</Text>
        <Text style={styles.name}>{ja ? meta.nameJa : meta.nameEn}</Text>
      </View>
      <Text style={styles.note}>{ja ? meta.noteJa : meta.noteEn}</Text>

      <Text style={styles.planCap}>FREE</Text>
      <MetricPatternGrid pattern={meta.id} isPro={false} />

      <Text style={[styles.planCap, styles.planCapGap]}>PRO</Text>
      <MetricPatternGrid pattern={meta.id} isPro />
    </View>
  );
}

export default function ProfileKinetikMetricsPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();

  return (
    <MobilePageShell
      title={ja ? "PROFILE 2×2" : "PROFILE 2×2"}
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "メトリクスカードの見た目案。A が現行。本番には未反映。"
          : "Metric card proposals. A is current production. Not wired live."
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
            ? "各案は Free（白黒）と Pro（色 or 金）を並べている。塗りは黒。選んだら本番に載せる。"
            : "Each proposal shows Free (mono) vs Pro (color or gold). Black fill. Pick one to ship."}
        </Text>
        {PATTERN_GALLERY.map((meta) => (
          <PatternBlock key={meta.id} meta={meta} ja={ja} />
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
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
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
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
    fontSize: 18,
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
    marginTop: -2,
    marginBottom: 4,
  },
  planCap: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "rgba(148,163,184,0.7)",
  },
  planCapGap: {
    marginTop: 8,
  },
});
