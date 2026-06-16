import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  language: "ja" | "en";
  compact?: boolean;
};

type LegendHit = "winner" | "winnerAndGames";

function hitStyle(hitStatus: LegendHit) {
  if (hitStatus === "winnerAndGames") {
    return { color: "#36e6ff", border: "rgba(54, 230, 255, 0.95)" };
  }
  return { color: "#ff9f2f", border: "rgba(255, 159, 47, 0.95)" };
}

function LegendCheck({ hitStatus, compact }: { hitStatus: LegendHit; compact?: boolean }) {
  const hit = hitStyle(hitStatus);
  const box = compact ? 15 : 20;
  const svg = compact ? 9 : 12;

  return (
    <View style={[styles.check, { width: box, height: box, borderColor: hit.border }]}>
      <Svg width={svg} height={svg} viewBox="0 0 24 24">
        <Path
          d="M5 12.5L9.2 16.5L19 7.5"
          stroke={hit.color}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export default function PlayoffBracketHitLegendNative({ language, compact = false }: Props) {
  const isJa = language === "ja";
  const labelStyle = compact ? styles.labelCompact : styles.label;

  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <LegendCheck hitStatus="winner" compact={compact} />
        <Text style={labelStyle}>
          {isJa ? (compact ? "勝者のみ" : "勝者のみ的中") : "Winner correct"}
        </Text>
      </View>
      <View style={styles.item}>
        <LegendCheck hitStatus="winnerAndGames" compact={compact} />
        <Text style={labelStyle}>
          {isJa
            ? compact
              ? "勝者＋試合数"
              : "勝者＋試合数的中"
            : "Winner + games"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  check: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(6, 12, 24, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  labelCompact: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    lineHeight: 12,
  },
});
