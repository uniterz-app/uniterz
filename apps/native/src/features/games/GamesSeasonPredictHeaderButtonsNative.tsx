/**
 * アワード / 順位予想 — ヘッダー左のコンパクト導線（STATS 右端ハンドルと分離）
 */
import { Image, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES_HEADER_CONTROL_HEIGHT } from "./gamesMobileLayout";

const ICONS = {
  awards: require("../../../assets/games-drawer/awards.png") as number,
  standings: require("../../../assets/games-drawer/standings.png") as number,
} as const;

type Props = {
  onAwards: () => void;
  onStandings: () => void;
  awardsLabel: string;
  standingsLabel: string;
};

export default function GamesSeasonPredictHeaderButtonsNative({
  onAwards,
  onStandings,
  awardsLabel,
  standingsLabel,
}: Props) {
  return (
    <View style={styles.row}>
      <HeaderIconButton
        source={ICONS.awards}
        onPress={onAwards}
        accessibilityLabel={awardsLabel}
      />
      <HeaderIconButton
        source={ICONS.standings}
        onPress={onStandings}
        accessibilityLabel={standingsLabel}
      />
    </View>
  );
}

function HeaderIconButton({
  source,
  onPress,
  accessibilityLabel,
}: {
  source: number;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(8,11,18,0.92)", "rgba(5,8,14,0.88)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <Image source={source} style={styles.icon} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btn: {
    width: GAMES_HEADER_CONTROL_HEIGHT,
    height: GAMES_HEADER_CONTROL_HEIGHT,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  btnPressed: {
    opacity: 0.82,
  },
  icon: {
    width: 22,
    height: 22,
  },
});
