import { StyleSheet } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  style?: AnimatedStyle<Record<string, unknown>>;
};

/** Web `MatchCard` 入場スキャン光（カード上→下へ走査） */
export default function MatchCardEntryScanNative({ style }: Props) {
  return (
    <Animated.View pointerEvents="none" style={[styles.band, style]}>
      <LinearGradient
        colors={[
          "transparent",
          "rgba(94,234,212,0.05)",
          "rgba(186,230,253,0.13)",
          "rgba(94,234,212,0.05)",
          "transparent",
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "34%",
    zIndex: 13,
  },
});
