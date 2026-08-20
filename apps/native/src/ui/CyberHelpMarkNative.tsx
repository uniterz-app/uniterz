/** Web `CyberHelpMark` 相当 — 予想入力の採点ルールはてな */
import { StyleSheet, Text, View } from "react-native";
import { METRIC_FONT } from "../features/rankings/rankingsUiTheme";

type Props = {
  active?: boolean;
  size?: "sm" | "md";
};

export default function CyberHelpMarkNative({
  active = false,
  size = "sm",
}: Props) {
  const box = size === "md" ? 32 : 28;
  const fontSize = size === "md" ? 13 : 12;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.box,
        { width: box, height: box },
        active ? styles.boxActive : null,
      ]}
    >
      <Text
        style={[styles.glyph, { fontSize, lineHeight: fontSize + 2 }]}
        maxFontSizeMultiplier={1.1}
      >
        ?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(6,182,212,0.1)",
  },
  boxActive: {
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "rgba(6,182,212,0.16)",
  },
  glyph: {
    fontFamily: METRIC_FONT,
    color: "rgba(224,255,255,0.95)",
    fontWeight: "800",
    includeFontPadding: false,
  },
});
