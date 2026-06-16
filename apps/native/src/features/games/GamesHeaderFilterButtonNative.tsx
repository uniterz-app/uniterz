/**
 * Web `gamesHeaderFilterButtonClasses` + `.cyber-filter-bar` 相当のコンパクト絞り込みボタン。
 */
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES_HEADER_CONTROL_HEIGHT } from "./gamesMobileLayout";

type Props = {
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

export default function GamesHeaderFilterButtonNative({
  active = false,
  onPress,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.root,
        active && styles.rootActive,
        pressed && styles.rootPressed,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          active
            ? ["rgba(34,211,238,0.22)", "rgba(8,145,178,0.28)"]
            : ["rgba(8,11,18,0.92)", "rgba(5,8,14,0.88)"]
        }
        style={StyleSheet.absoluteFillObject}
      />
      <MaterialCommunityIcons
        name="tune-variant"
        size={16}
        color={active ? "#a5f3fc" : "rgba(224,250,254,0.88)"}
      />
      {active ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: GAMES_HEADER_CONTROL_HEIGHT,
    height: GAMES_HEADER_CONTROL_HEIGHT,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  rootActive: {
    borderColor: "rgba(34,211,238,0.55)",
  },
  rootPressed: {
    opacity: 0.82,
  },
  activeDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22d3ee",
  },
});
