/**
 * Web `ProfileKinetikFlipShell` 相当 — プロフィール表 ↔ CAREER 裏。
 * 耳タブはカード枠側（Panel / Career face）が描画する。
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ProfileKinetikFlipEarProvider } from "./ProfileKinetikFlipEarNative";

const FLIP_MS = 420;

type Props = {
  language: "ja" | "en";
  front: ReactNode;
  back: ReactNode;
  /** 裏面表示時に true — CAREER データの遅延読込用 */
  onFlipChange?: (flipped: boolean) => void;
};

export default function ProfileKinetikFlipShellNative({
  language: _language,
  front,
  back,
  onFlipChange,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  const [flipped, setFlipped] = useState(false);
  const [frontH, setFrontH] = useState(0);
  const progress = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    onFlipChange?.(next);
    if (reduceMotion) {
      progress.value = next ? 1 : 0;
      return;
    }
    progress.value = withTiming(next ? 1 : 0, {
      duration: FLIP_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [flipped, onFlipChange, progress, reduceMotion]);

  const frontEar = useMemo(
    () => ({
      label: "CAREER",
      onToggle: toggle,
      pressed: false,
    }),
    [toggle]
  );

  const backEar = useMemo(
    () => ({
      label: "PROFILE",
      onToggle: toggle,
      pressed: true,
    }),
    [toggle]
  );

  const frontStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: progress.value < 0.5 ? 1 : 0 };
    }
    const rot = interpolate(progress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rot}deg` }],
      opacity: rot > 90 ? 0 : 1,
      backfaceVisibility: "hidden" as const,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        opacity: progress.value >= 0.5 ? 1 : 0,
        zIndex: progress.value >= 0.5 ? 2 : 0,
      };
    }
    const rot = interpolate(progress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rot}deg` }],
      opacity: rot < 270 ? 0 : 1,
      backfaceVisibility: "hidden" as const,
      zIndex: progress.value > 0.5 ? 2 : 0,
    };
  });

  return (
    <View style={styles.root}>
      <View style={[styles.scene, frontH > 0 ? { minHeight: frontH } : null]}>
        <Animated.View
          style={[styles.face, frontStyle]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - frontH) > 1) setFrontH(h);
          }}
          pointerEvents={flipped ? "none" : "auto"}
        >
          <ProfileKinetikFlipEarProvider value={frontEar}>
            {front}
          </ProfileKinetikFlipEarProvider>
        </Animated.View>
        <Animated.View
          style={[
            styles.face,
            styles.faceBack,
            frontH > 0 ? { height: frontH } : null,
            backStyle,
          ]}
          pointerEvents={flipped ? "auto" : "none"}
        >
          <View style={styles.backBody}>
            <ProfileKinetikFlipEarProvider value={backEar}>
              {back}
            </ProfileKinetikFlipEarProvider>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
  },
  scene: {
    alignSelf: "stretch",
    width: "100%",
    position: "relative",
  },
  face: {
    width: "100%",
  },
  faceBack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backBody: {
    flex: 1,
    minHeight: 0,
    height: "100%",
  },
});
