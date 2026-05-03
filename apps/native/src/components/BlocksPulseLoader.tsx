/**
 * Uiverse.io（ClawHack1）風の 8 ブロック縦パルスローダー（ネイティブ用）。
 * ブロックは既定で単色＋英字「LOADING」。
 */
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

const BLOCK_COUNT = 8;
const PERIOD_MS = 1200;
const PULSE_UP_MS = 240;
const PULSE_DOWN_MS = 240;
const STAGGER_MS = 100;

const BEZIER = Easing.bezier(0.5, 0, 0.5, 1);

/** 未指定時のブロック色（シアン系・単色） */
const DEFAULT_BLOCK_COLOR = "rgba(165,243,252,0.95)";

type BlocksPulseLoaderProps = {
  /** 1 でブロック約10px・CSS 相当。フッター等は 0.75〜0.85 */
  pixelScale?: number;
  /** 全ブロック同一色（最優先） */
  color?: string;
  /** ブロックごとに色を分けたいとき（8 個。`color` 未指定時のみ） */
  colors?: readonly string[];
  /** 下に英字ラベルを付ける（既定 true） */
  showLabel?: boolean;
  /** ラベル文言（既定 `LOADING`） */
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function BlocksPulseLoader({
  pixelScale = 1,
  color,
  colors,
  showLabel = true,
  label = "LOADING",
  labelStyle,
  style,
}: BlocksPulseLoaderProps) {
  const scales = useRef(
    Array.from({ length: BLOCK_COUNT }, () => new Animated.Value(1))
  ).current;

  const blockColors =
    color != null
      ? Array.from({ length: BLOCK_COUNT }, () => color)
      : colors != null && colors.length >= BLOCK_COUNT
        ? [...colors].slice(0, BLOCK_COUNT)
        : Array.from({ length: BLOCK_COUNT }, () => DEFAULT_BLOCK_COLOR);

  useEffect(() => {
    /** CSS の animation-delay は初回のみ。ループ本体は常に同じ 1.2s 周期 */
    const idlePad = PERIOD_MS - PULSE_UP_MS - PULSE_DOWN_MS;
    const loops: Animated.CompositeAnimation[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    scales.forEach((v, i) => {
      const loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 2.5,
            duration: PULSE_UP_MS,
            easing: BEZIER,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 1,
            duration: PULSE_DOWN_MS,
            easing: BEZIER,
            useNativeDriver: true,
          }),
          Animated.delay(idlePad),
        ])
      );
      loops.push(loopAnim);
      timeouts.push(
        setTimeout(() => {
          loopAnim.start();
        }, i * STAGGER_MS)
      );
    });

    return () => {
      timeouts.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
      scales.forEach((v) => {
        v.stopAnimation();
        v.setValue(1);
      });
    };
  }, [scales]);

  const block = 10 * pixelScale;
  const gap = 4 * pixelScale;
  const pad = 10 * pixelScale;

  return (
    <View style={[styles.column, { padding: pad, minHeight: block * 2.5 + pad * 2 }, style]}>
      <View style={styles.loaderInner}>
        {scales.map((anim, i) => {
          const c = blockColors[i] ?? DEFAULT_BLOCK_COLOR;
          return (
            <Animated.View
              key={i}
              style={[
                styles.loaderBlock,
                {
                  width: block,
                  height: block,
                  marginRight: i < BLOCK_COUNT - 1 ? gap : 0,
                  backgroundColor: c,
                  transform: [{ scaleY: anim }],
                  shadowColor: c,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.65,
                  shadowRadius: 10 * pixelScale,
                  elevation: 5,
                },
              ]}
            />
          );
        })}
      </View>
      {showLabel ? (
        <Text style={[styles.label, { marginTop: 10 * pixelScale }, labelStyle]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  loaderInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderBlock: {
    borderRadius: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.42,
    color: "rgba(165,243,252,0.92)",
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
});
