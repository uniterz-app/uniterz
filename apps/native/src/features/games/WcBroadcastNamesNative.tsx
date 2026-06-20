/** Web `MatchCard` 放送局行 — Latin は Bebas、CJK は Noto Sans JP Bold */
import { StyleSheet, Text, type TextStyle } from "react-native";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
  MATCH_CARD_JP_BOLD_FONT,
} from "./matchCardTypography";

/** Web `broadcastNameUsesCjk` 相当 */
export function broadcastLabelUsesCjk(label: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(label);
}

type WcBroadcastNamesNativeProps = {
  labels: string[];
  separator: string;
  style?: TextStyle;
  textAlign?: "left" | "center";
};

export function WcBroadcastNamesNative({
  labels,
  separator,
  style,
  textAlign = "left",
}: WcBroadcastNamesNativeProps) {
  return (
    <Text
      style={[
        styles.wrap,
        textAlign === "center" ? styles.wrapCenter : null,
        style,
      ]}
    >
      {labels.map((label, index) => (
        <Text key={`${label}-${index}`}>
          {index > 0 ? <Text style={styles.sep}>{separator}</Text> : null}
          <Text style={broadcastLabelUsesCjk(label) ? styles.cjk : styles.latin}>
            {label}
          </Text>
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  wrapCenter: {
    flexShrink: 1,
    textAlign: "center",
  },
  latin: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(207,250,254,0.9)",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
  },
  cjk: {
    fontFamily: MATCH_CARD_JP_BOLD_FONT,
    fontWeight: "700",
    color: "rgba(207,250,254,0.9)",
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
  },
  sep: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(207,250,254,0.72)",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
  },
});
