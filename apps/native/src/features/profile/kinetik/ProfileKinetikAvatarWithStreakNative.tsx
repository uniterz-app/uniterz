import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Polygon } from "react-native-svg";
import type { KinetikMenuAccentKey } from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import {
  KINETIK_STREAK_VARIANT,
  getKinetikStreakTier,
  isKinetikWinStreakActive,
  type KinetikStreakTier,
} from "../../../../../../app/component/profile/edit/kinetikStreakFx";
import {
  KINETIK_AVATAR_MOBILE,
  kinetikMarchDurationMs,
  resolveKinetikAvatarColors,
} from "./kinetikAvatarNativeMetrics";

const M = KINETIK_AVATAR_MOBILE;

function KinetikAvatarGlyphNative({
  colors,
}: {
  colors: ReturnType<typeof resolveKinetikAvatarColors>;
}) {
  return (
    <View style={styles.glyphWrap}>
      <Svg width={M.glyphSize} height={M.glyphSize} viewBox="0 0 40 40">
        <Polygon
          points="20,9 31.5,29 8.5,29"
          fill={colors.greenDim}
          stroke={colors.green}
          strokeWidth={1.35}
        />
        <Circle cx={20} cy={21.5} r={2.8} fill={colors.green} />
      </Svg>
      <View pointerEvents="none" style={styles.glyphScan} />
    </View>
  );
}

function RibCorner({
  corner,
  colors,
}: {
  corner: "tl" | "br";
  colors: ReturnType<typeof resolveKinetikAvatarColors>;
}) {
  const isTl = corner === "tl";
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ribCorner,
        isTl ? styles.ribTl : styles.ribBr,
        { width: M.ribLen, height: M.ribLen },
      ]}
    >
      <LinearGradient
        colors={[colors.greenMid, colors.greenDim, "transparent"]}
        start={isTl ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 }}
        end={isTl ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }}
        style={[styles.ribH, { height: M.ribThick, width: M.ribLen }]}
      />
      <LinearGradient
        colors={[colors.greenMid, colors.greenDim, "transparent"]}
        start={isTl ? { x: 0.5, y: 0 } : { x: 0.5, y: 1 }}
        end={isTl ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 }}
        style={[styles.ribV, { width: M.ribThick, height: M.ribLen }]}
      />
    </View>
  );
}

function EdgeCorner({
  corner,
  colors,
}: {
  corner: "tl" | "br";
  colors: ReturnType<typeof resolveKinetikAvatarColors>;
}) {
  const isTl = corner === "tl";
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}>
      <LinearGradient
        colors={[colors.green, colors.greenSoft, "transparent"]}
        start={isTl ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 }}
        end={isTl ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }}
        style={[
          styles.edgeH,
          isTl ? styles.edgeTlH : styles.edgeBrH,
          { width: M.edgeLen, height: 2 },
        ]}
      />
      <LinearGradient
        colors={[colors.green, colors.greenSoft, "transparent"]}
        start={isTl ? { x: 0.5, y: 0 } : { x: 0.5, y: 1 }}
        end={isTl ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 }}
        style={[
          styles.edgeV,
          isTl ? styles.edgeTlV : styles.edgeBrV,
          { width: 2, height: M.edgeLen },
        ]}
      />
    </View>
  );
}

const GHOST_MARCH_DURATION_MS = 3400;

function EdgeMarchOverlay({
  corner,
  marchColor,
  durationMs,
  ghost = false,
}: {
  corner: "tl" | "br";
  marchColor: string;
  durationMs: number;
  ghost?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const isTl = corner === "tl";
  const hostSize = M.size * M.marchScale;
  const bandLen = hostSize * 1.4;
  const lineThick = 2;
  const duration = ghost ? GHOST_MARCH_DURATION_MS : durationMs;

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [duration, progress, reduceMotion]);

  const hStyle = useAnimatedStyle(() => {
    const t = progress.value;
    if (isTl) {
      return {
        transform: [{ translateX: -bandLen * 0.14 + t * bandLen * 0.34 }],
      };
    }
    return {
      transform: [{ translateX: bandLen * 0.14 - t * bandLen * 0.34 }],
    };
  });

  const vStyle = useAnimatedStyle(() => {
    const t = progress.value;
    if (isTl) {
      return {
        transform: [{ translateY: -bandLen * 0.14 + t * bandLen * 0.34 }],
      };
    }
    return {
      transform: [{ translateY: bandLen * 0.14 - t * bandLen * 0.34 }],
    };
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.marchHost,
        isTl ? styles.marchTl : styles.marchBr,
        { width: hostSize, height: hostSize, opacity: ghost ? 0.35 : 0.85 },
      ]}
    >
      <Animated.View
        style={[
          styles.marchBandH,
          isTl ? styles.marchBandHTl : styles.marchBandHBr,
          { width: bandLen, height: lineThick },
          hStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", marchColor, "transparent"]}
          locations={[0, 0.45, 0.9]}
          start={isTl ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 }}
          end={isTl ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.marchBandV,
          isTl ? styles.marchBandVTl : styles.marchBandVBr,
          { width: lineThick, height: bandLen },
          vStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", marchColor, "transparent"]}
          locations={[0, 0.45, 0.9]}
          start={isTl ? { x: 0.5, y: 0 } : { x: 0.5, y: 1 }}
          end={isTl ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

function StreakFxOverlays({
  variant,
  tier,
  marchColor,
}: {
  variant: typeof KINETIK_STREAK_VARIANT;
  tier: KinetikStreakTier;
  marchColor: string;
}) {
  if (tier <= 0 || variant !== "edge-march") return null;
  const durationMs = kinetikMarchDurationMs(tier);

  return (
    <>
      <EdgeMarchOverlay corner="tl" marchColor={marchColor} durationMs={durationMs} />
      <EdgeMarchOverlay corner="br" marchColor={marchColor} durationMs={durationMs} />
      {tier >= 3 ? (
        <>
          <EdgeMarchOverlay
            corner="tl"
            marchColor={marchColor}
            durationMs={durationMs}
            ghost
          />
          <EdgeMarchOverlay
            corner="br"
            marchColor={marchColor}
            durationMs={durationMs}
            ghost
          />
        </>
      ) : null}
    </>
  );
}

export default function ProfileKinetikAvatarWithStreakNative({
  streak,
  accentKey = "default",
  photoURL,
  displayName,
}: {
  streak: number;
  accentKey?: KinetikMenuAccentKey;
  photoURL?: string | null;
  displayName: string;
}) {
  const streakActive = isKinetikWinStreakActive(streak);
  const streakTier = getKinetikStreakTier(streak);
  const colors = resolveKinetikAvatarColors({
    streakActive,
    streakTier,
    accentKey,
  });

  return (
    <View style={styles.column}>
      <View style={[styles.wrap, { width: M.size, height: M.size }]}>
        <RibCorner corner="tl" colors={colors} />
        <RibCorner corner="br" colors={colors} />

        <View style={[styles.plate, { width: M.size, height: M.size, backgroundColor: colors.plate }]}>
          <EdgeCorner corner="tl" colors={colors} />
          <EdgeCorner corner="br" colors={colors} />

          <View
            style={[
              styles.inner,
              {
                top: M.innerInset,
                left: M.innerInset,
                right: M.innerInset,
                bottom: M.innerInset,
                borderColor: colors.green,
                backgroundColor: colors.plateInner,
              },
            ]}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.photo} resizeMode="cover" />
            ) : (
              <KinetikAvatarGlyphNative colors={colors} />
            )}
          </View>
        </View>

        {streakActive ? (
          <StreakFxOverlays
            variant={KINETIK_STREAK_VARIANT}
            tier={streakTier}
            marchColor={colors.march}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    marginTop: -4,
    flexShrink: 0,
    overflow: "visible",
  },
  wrap: {
    position: "relative",
    overflow: "visible",
  },
  ribCorner: {
    position: "absolute",
    zIndex: 0,
  },
  ribTl: { left: 0, top: 0 },
  ribBr: { right: 0, bottom: 0 },
  ribH: { position: "absolute", left: 0, top: 0 },
  ribV: { position: "absolute", left: 0, top: 0 },
  plate: {
    position: "relative",
    zIndex: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.035)",
  },
  edgeH: { position: "absolute" },
  edgeV: { position: "absolute" },
  edgeTlH: { top: 0, left: 0 },
  edgeTlV: { top: 0, left: 0 },
  edgeBrH: { bottom: 0, right: 0 },
  edgeBrV: { bottom: 0, right: 0 },
  inner: {
    position: "absolute",
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  glyphWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  glyphScan: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  marchHost: {
    position: "absolute",
    zIndex: 4,
    overflow: "hidden",
  },
  marchTl: { left: 0, top: 0 },
  marchBr: { right: 0, bottom: 0 },
  marchBandH: {
    position: "absolute",
  },
  marchBandHTl: { left: 0, top: 0 },
  marchBandHBr: { right: 0, bottom: 0 },
  marchBandV: {
    position: "absolute",
  },
  marchBandVTl: { left: 0, top: 0 },
  marchBandVBr: { right: 0, bottom: 0 },
});
