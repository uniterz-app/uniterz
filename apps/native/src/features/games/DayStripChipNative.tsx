import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  DAY_CHIP_BORDER_DEFAULT,
  DAY_CHIP_BORDER_SELECTED,
  DAY_CHIP_BORDER_TODAY,
  DAY_CHIP_FILL_SELECTED,
  DAY_CHIP_GRADIENT_DEFAULT,
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
 * 選択中はフラットなオレンジ塗り。未選択のみ薄いハイライト。
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
        pressed && s.pressablePressed,
      ]}
    >
      <View
        style={[
          s.circle,
          { borderColor },
          selected && s.circleSelected,
          selected && s.circleSelectedShadow,
          isToday && !selected && s.circleTodayShadow,
        ]}
      >
        {!selected ? (
          <LinearGradient
            colors={[...DAY_CHIP_GRADIENT_DEFAULT]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        {!selected ? (
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
            locations={[0, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        {!selected ? (
          <View
            pointerEvents="none"
            style={[
              s.insetTopHighlight,
              isToday ? s.insetTopHighlightToday : s.insetTopHighlightDefault,
            ]}
          />
        ) : null}
        {isToday && !selected ? (
          <View pointerEvents="none" style={s.innerRingToday} />
        ) : null}
        <Text style={s.dayNum}>{dayNum}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
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
  circleSelected: {
    backgroundColor: DAY_CHIP_FILL_SELECTED,
    overflow: "visible",
  },
  circleSelectedShadow: {
    shadowColor: "rgb(126, 34, 206)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
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
});
