/**
 * チュートリアル welcome 用 — 散らばった文字がワードマークへ集まってくる。
 */
import { useEffect, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  UNITERZ_LOGO_FILL_LETTERS,
  UNITERZ_LOGO_FILL_VIEWBOX,
  type UniterzLogoFillLetter,
} from "../../../../../lib/units/uniterzLogoFillLetters";
import {
  TUTORIAL_CYAN,
  TUTORIAL_WELCOME_GATHER_MS,
  TUTORIAL_WELCOME_GLOW_MS,
} from "../../../../../lib/tutorial/tutorialMotion";

/** 塗りつぶしのハローではなく、パス輪郭に沿う線幅（viewBox 単位） */
const EDGE_STROKE = 7;

type Props = {
  width?: number;
};

const GATHER_EASE = Easing.bezier(0.16, 1, 0.3, 1);

function WelcomeLetterNative({
  letter,
  index,
}: {
  letter: UniterzLogoFillLetter;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const { width: vw, height: vh } = useWindowDimensions();
  const fromX = letter.scatter.vx * vw;
  const fromY = letter.scatter.vy * vh;
  const x = useSharedValue(fromX);
  const y = useSharedValue(fromY);
  const rot = useSharedValue(letter.scatter.rotate);
  const scale = useSharedValue(0.86);
  const op = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(rot);
    cancelAnimation(scale);
    cancelAnimation(op);
    cancelAnimation(flash);
    if (reduceMotion) {
      x.value = 0;
      y.value = 0;
      rot.value = 0;
      scale.value = 1;
      op.value = 1;
      flash.value = 0;
      return;
    }
    x.value = fromX;
    y.value = fromY;
    rot.value = letter.scatter.rotate;
    scale.value = 0.86;
    op.value = 1;
    const delay = index * 55;
    const timing = {
      duration: TUTORIAL_WELCOME_GATHER_MS,
      easing: GATHER_EASE,
    };
    x.value = withDelay(delay, withTiming(0, timing));
    y.value = withDelay(delay, withTiming(0, timing));
    rot.value = withDelay(delay, withTiming(0, timing));
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, timing),
        withTiming(1.06, {
          duration: Math.round(TUTORIAL_WELCOME_GLOW_MS * 0.35),
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1, {
          duration: Math.round(TUTORIAL_WELCOME_GLOW_MS * 0.65),
          easing: Easing.out(Easing.cubic),
        })
      )
    );
    flash.value = withDelay(
      delay + TUTORIAL_WELCOME_GATHER_MS,
      withSequence(
        withTiming(0.92, {
          duration: 140,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {
          duration: Math.round(TUTORIAL_WELCOME_GLOW_MS * 0.7),
          easing: Easing.out(Easing.cubic),
        })
      )
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(rot);
      cancelAnimation(scale);
      cancelAnimation(op);
      cancelAnimation(flash);
    };
  }, [fromX, fromY, index, letter.scatter.rotate, op, flash, reduceMotion, rot, scale, x, y]);

  const anim = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.letterLayer, anim]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${UNITERZ_LOGO_FILL_VIEWBOX.width} ${UNITERZ_LOGO_FILL_VIEWBOX.height}`}
      >
        {letter.paths.map((d) => (
          <Path key={d.slice(0, 24)} d={d} fill={TUTORIAL_CYAN} />
        ))}
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, flashStyle]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${UNITERZ_LOGO_FILL_VIEWBOX.width} ${UNITERZ_LOGO_FILL_VIEWBOX.height}`}
        >
          {letter.paths.map((d) => (
            <Path
              key={`${d.slice(0, 24)}-edge`}
              d={d}
              fill="none"
              stroke={TUTORIAL_CYAN}
              strokeWidth={EDGE_STROKE}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** welcome の見出し・ステップなどが同じ集合入場をする */
export function WelcomeGatherNative({
  delayMs = 0,
  fromY = 24,
  fromX = 0,
  children,
  style,
}: {
  delayMs?: number;
  fromY?: number;
  fromX?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(fromX);
  const y = useSharedValue(fromY);
  const op = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(op);
    if (reduceMotion) {
      x.value = 0;
      y.value = 0;
      op.value = 1;
      return;
    }
    x.value = fromX;
    y.value = fromY;
    op.value = 0;
    const timing = {
      duration: 550,
      easing: GATHER_EASE,
    };
    x.value = withDelay(delayMs, withTiming(0, timing));
    y.value = withDelay(delayMs, withTiming(0, timing));
    op.value = withDelay(
      delayMs,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(op);
    };
  }, [delayMs, fromX, fromY, op, reduceMotion, x, y]);

  const anim = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

export default function TutorialWelcomeLogoNative({ width = 300 }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width,
          aspectRatio: UNITERZ_LOGO_FILL_VIEWBOX.aspectRatio,
        },
      ]}
      accessibilityLabel="UNITERZ"
      accessibilityRole="image"
    >
      {UNITERZ_LOGO_FILL_LETTERS.map((letter, i) => (
        <WelcomeLetterNative key={letter.id} letter={letter} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignSelf: "center",
    overflow: "visible",
  },
  letterLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
