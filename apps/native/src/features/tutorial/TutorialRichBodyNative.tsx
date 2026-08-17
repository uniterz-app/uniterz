/**
 * チュートリアル本文 — `**強調**` を太字で表示
 */
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { parseTutorialRichText } from "../../../../../lib/tutorial/tutorialRichText";

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
      {parts.map((p, i) =>
        p.bold ? (
          <Text key={i} style={[styles.bold, boldStyle]}>
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "700",
  },
});
