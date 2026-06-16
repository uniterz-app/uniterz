import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  DAY_CHIP_BORDER_DEFAULT,
  DAY_CHIP_BORDER_SELECTED,
  DAY_CHIP_BORDER_TODAY,
  DAY_CHIP_GRADIENT_DEFAULT,
  DAY_CHIP_GRADIENT_SELECTED,
  DAY_STRIP_CHIP_SIZE,
} from "./gamesDayStripTokens";

const NUMERIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

type Props = {
  dayNum: number;
  selected: boolean;
  isToday: boolean;
  onPress: () => void;
};

/**
 * Web `DayStrip` の日付丸ボタン相当。
 * inset ハイライト・内側リング・シアン/ゴールド光彩を RN 向けにレイヤー分解。
 */
export default function DayStripChipNative({
  dayNum,
  selected,
  isToday,
  onPress,
}: Props) {
  const borderColor = selected
    ? DAY_CHIP_BORDER_SELECTED
    : isToday
      ? DAY_CHIP_BORDER_TODAY
      : DAY_CHIP_BORDER_DEFAULT;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        s.pressable,
        selected && s.pressableSelected,
        pressed && s.pressablePressed,
      ]}
    >
      <View
        style={[
          s.circle,
          { borderColor },
          selected && s.circleSelectedShadow,
          isToday && !selected && s.circleTodayShadow,
        ]}
      >
        <LinearGradient
          colors={
            selected
              ? [...DAY_CHIP_GRADIENT_SELECTED]
              : [...DAY_CHIP_GRADIENT_DEFAULT]
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            selected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
            "rgba(255,255,255,0)",
          ]}
          locations={selected ? [0, 0.55] : [0, 0.6]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
        {/* Web `inset 0 1px 0 rgba(255,255,255,*)` 相当 */}
        <View
          pointerEvents="none"
          style={[
            s.insetTopHighlight,
            selected
              ? s.insetTopHighlightSelected
              : isToday
                ? s.insetTopHighlightToday
                : s.insetTopHighlightDefault,
          ]}
        />
        {selected ? (
          <View pointerEvents="none" style={s.innerRingSelected} />
        ) : null}
        {isToday && !selected ? (
          <View pointerEvents="none" style={s.innerRingToday} />
        ) : null}
        <Text style={[s.dayNum, selected && s.dayNumSelected]}>{dayNum}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressableSelected: {
    transform: [{ translateY: -1 }, { scale: 1.02 }],
  },
  pressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  circle: {
    width: DAY_STRIP_CHIP_SIZE,
    height: DAY_STRIP_CHIP_SIZE,
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  circleSelectedShadow: {
    shadowColor: "rgb(34, 211, 238)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  circleTodayShadow: {
    shadowColor: "rgb(250, 204, 21)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 2,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  insetTopHighlightDefault: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  insetTopHighlightToday: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  insetTopHighlightSelected: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  innerRingSelected: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.14)",
  },
  innerRingToday: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.2)",
  },
  dayNum: {
    zIndex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
    fontFamily: NUMERIC_FONT,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  dayNumSelected: {
    color: "#ecfeff",
    textShadowColor: "rgba(34,211,238,0.22)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
