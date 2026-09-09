import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Polygon } from "react-native-svg";
import type { KinetikMenuAccentKey } from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import {
  getKinetikStreakTier,
  isKinetikWinStreakActive,
} from "../../../../../../app/component/profile/edit/kinetikStreakFx";
import {
  KINETIK_AVATAR_MOBILE,
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

export default function ProfileKinetikAvatarWithStreakNative({
  streak,
  accentKey = "default",
  isPlanPro = false,
  photoURL,
  displayName: _displayName,
}: {
  streak: number;
  accentKey?: KinetikMenuAccentKey;
  isPlanPro?: boolean;
  photoURL?: string | null;
  displayName: string;
  /** 互換: 常時 march はしない */
  motionPaused?: boolean;
}) {
  const streakActive = isKinetikWinStreakActive(streak);
  const streakTier = getKinetikStreakTier(streak);
  const colors = resolveKinetikAvatarColors({
    streakActive,
    streakTier,
    accentKey: !streakActive && isPlanPro ? "plan-pro" : accentKey,
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
});
