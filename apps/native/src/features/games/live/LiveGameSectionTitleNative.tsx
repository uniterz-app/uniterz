/** Web `LiveGameSectionTitle` 相当 */
import { StyleSheet, Text, View } from "react-native";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const DEFAULT_ACCENT = "#e8edf5";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

type Props = {
  title: string;
  accent?: string;
};

export default function LiveGameSectionTitleNative({
  title,
  accent = DEFAULT_ACCENT,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: hexToRgba(accent, 0.75) }]}>
        {title}
      </Text>
      <View
        style={[styles.line, { backgroundColor: hexToRgba(accent, 0.35) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
