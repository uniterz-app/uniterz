import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";

type Props = {
  home: number;
  away: number;
  variant?: "predicted" | "final";
  /** 一覧カードは Web `ResultCard` mobileScheduleDense の大きめスコア */
  density?: "list" | "listBasketball" | "compact";
  style?: TextStyle;
};

/** Web `MatchScoreLine`（モバイル dense リザルト）相当 */
export default function ResultMatchScoreLineNative({
  home,
  away,
  variant = "predicted",
  density = "compact",
  style,
}: Props) {
  const predictedStyle =
    density === "list"
      ? styles.predictedList
      : density === "listBasketball"
        ? styles.predictedListBasketball
        : styles.predictedCompact;
  const finalStyle =
    density === "list" || density === "listBasketball"
      ? styles.finalList
      : styles.finalCompact;
  const base = variant === "final" ? finalStyle : predictedStyle;
  const dashStyle = variant === "final" ? styles.dashFinal : styles.dashPredicted;
  return (
    <View style={styles.row}>
      <Text style={[base, style]}>{home}</Text>
      <Text style={[base, dashStyle, style]}>–</Text>
      <Text style={[base, style]}>{away}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    maxWidth: "100%",
  },
  /** Web 一覧 mobileScheduleDense: `text-base`（コンパクト） */
  predictedCompact: {
    flexShrink: 0,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
  /** Web 一覧: `font-black text-white/85` + Montserrat、ネイティブは視認性のためやや大きめ */
  predictedList: {
    flexShrink: 0,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.6,
  },
  /** NBA/BJ など3桁スコア — Web mobile `text-xl` 相当 */
  predictedListBasketball: {
    flexShrink: 0,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  finalCompact: {
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: "rgba(253,224,71,0.95)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  /** Web 一覧確定スコア: `text-[10px] font-bold text-amber-200` */
  finalList: {
    flexShrink: 0,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    color: "rgba(253,224,71,0.95)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dashPredicted: {
    opacity: 0.7,
  },
  dashFinal: {
    opacity: 0.75,
  },
});
