/**
 * アワード / 順位予想 — ヘッダー左のコンパクト導線（STATS 右端ハンドルと分離）
 */
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { GAMES_HEADER_CONTROL_HEIGHT } from "./gamesMobileLayout";
import { CYBER_CHAMFER_ACCENT, CYBER_CHAMFER_STROKE } from "../../../../../lib/ui/cyberChamferAccent";

const ICONS = {
  awards: require("../../../assets/games-drawer/awards.png") as number,
  standings: require("../../../assets/games-drawer/standings.png") as number,
} as const;

const PENDING_YELLOW = "#FACC15";

type Props = {
  onAwards: () => void;
  onStandings: () => void;
  awardsLabel: string;
  standingsLabel: string;
  /** 未提出（締切前）なら右上に黄色マーク */
  awardsPending?: boolean;
  standingsPending?: boolean;
};

export default function GamesSeasonPredictHeaderButtonsNative({
  onAwards,
  onStandings,
  awardsLabel,
  standingsLabel,
  awardsPending = false,
  standingsPending = false,
}: Props) {
  return (
    <View style={styles.row}>
      <HeaderIconButton
        source={ICONS.awards}
        onPress={onAwards}
        accessibilityLabel={awardsLabel}
        pending={awardsPending}
      />
      <HeaderIconButton
        source={ICONS.standings}
        onPress={onStandings}
        accessibilityLabel={standingsLabel}
        pending={standingsPending}
      />
    </View>
  );
}

function PendingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 1000 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none" style={[styles.pendingDot, animStyle]} />;
}

function HeaderIconButton({
  source,
  onPress,
  accessibilityLabel,
  pending,
}: {
  source: number;
  onPress: () => void;
  accessibilityLabel: string;
  pending: boolean;
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
      <Image
        source={source}
        style={styles.icon}
        resizeMode="contain"
        tintColor={CYBER_CHAMFER_ACCENT}
      />
      {pending ? <PendingDot /> : null}
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
    borderColor: CYBER_CHAMFER_STROKE,
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
  pendingDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#050508",
    backgroundColor: PENDING_YELLOW,
    shadowColor: PENDING_YELLOW,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
