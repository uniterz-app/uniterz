import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  season?: string;
};

export default function PlayoffBracketHeaderNative({ season }: Props) {
  const title = season ? `${season} PLAYOFFS BRACKET` : "PLAYOFFS BRACKET";

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>UNITERZ</Text>
      <LinearGradient
        colors={[
          "transparent",
          "rgba(56,189,248,0.5)",
          "#5f7cff",
          "rgba(56,189,248,0.5)",
          "transparent",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const bebas = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "sans-serif",
});

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: 4,
  },
  brand: {
    fontFamily: bebas,
    fontSize: 20,
    letterSpacing: 4.4,
    color: "#9fb4ff",
    includeFontPadding: false,
  },
  line: {
    marginTop: 8,
    height: 1,
    width: "65%",
    maxWidth: 220,
  },
  title: {
    marginTop: 8,
    fontFamily: bebas,
    fontSize: 24,
    letterSpacing: 1.4,
    color: "#f8fbff",
    textAlign: "center",
    includeFontPadding: false,
  },
});
