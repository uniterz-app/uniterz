import { StyleSheet, Text, View } from "react-native";
import { resolvePkShootoutWinnerSide } from "../../../../../lib/games/pkScore";
import type { PkScore } from "../../../../../lib/games/pkScore";
import { MATCH_CARD_SCORE_FONT } from "./matchCardTypography";

type Props = {
  pkScore: PkScore;
  density?: "card" | "overlay";
  /** WC カードは得点表示と同じく一段大きく */
  wc?: boolean;
};

const PK_WIN_YELLOW = "#facc15";

export default function MatchPkResultLineNative({
  pkScore,
  density = "card",
  wc = false,
}: Props) {
  const winner = resolvePkShootoutWinnerSide(pkScore);
  const fontSize = wc ? 15 : density === "overlay" ? 12 : 11;
  const lineHeight = wc ? 17 : density === "overlay" ? 14 : 13;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize, lineHeight }]}>PK</Text>
      <Text
        style={[
          styles.num,
          { fontSize, lineHeight },
          winner === "home" ? styles.win : styles.lose,
        ]}
      >
        {pkScore.home}
      </Text>
      <Text style={[styles.dash, { fontSize, lineHeight }]}>-</Text>
      <Text
        style={[
          styles.num,
          { fontSize, lineHeight },
          winner === "away" ? styles.win : styles.lose,
        ]}
      >
        {pkScore.away}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontWeight: "900",
    fontStyle: "italic",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  num: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontWeight: "900",
    fontStyle: "italic",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  win: {
    color: PK_WIN_YELLOW,
  },
  lose: {
    color: "rgba(255,255,255,0.72)",
  },
  dash: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontWeight: "900",
    fontStyle: "italic",
  },
});
