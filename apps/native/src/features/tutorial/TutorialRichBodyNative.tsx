/**
 * チュートリアル本文 — `**強調**` とブランド語（Pick Up / PRO LEAGUE）を表示
 */
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { parseTutorialRichText } from "../../../../../lib/tutorial/tutorialRichText";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
};

export default function TutorialRichBodyNative({
  text,
  style,
  boldStyle,
}: Props) {
  const parts = parseTutorialRichText(text);
  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (p.brand) {
          return (
            <Text
              key={i}
              style={[styles.brand, p.bold ? styles.bold : null, boldStyle]}
            >
              {p.text}
            </Text>
          );
        }
        if (p.bold) {
          return (
            <Text key={i} style={[styles.bold, boldStyle]}>
              {p.text}
            </Text>
          );
        }
        return <Text key={i}>{p.text}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "700",
  },
  /** Web `CyberSlantedTab` / `nameOxanium` 相当 */
  brand: {
    fontFamily: METRIC_FONT,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
