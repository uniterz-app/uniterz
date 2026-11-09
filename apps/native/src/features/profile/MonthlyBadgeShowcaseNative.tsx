/**
 * 月間ランキングバッジの大きな表示。端末を傾けると光が走り、タップで裏返して刻印（名前・記録）を見る。
 */
import { useEffect } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Canvas,
  Image as SkiaImage,
  LinearGradient,
  Rect,
  useImage,
} from "@shopify/react-native-skia";
import Animated, {
  Easing,
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { resolveUniterzAssetUrl } from "../../lib/resolveUniterzAssetUrl";
import { hapticSelection } from "../../lib/hapticsNative";
import {
  MONTHLY_BADGE_BACK_PANEL,
  MONTHLY_BADGE_ENGRAVE_INK,
  formatMonthlyBadgeValue,
  monthlyBadgeArt,
  monthlyBadgeKindLabelArt,
  monthlyBadgeMonthArt,
  monthlyBadgeRankOrdinal,
  type MonthlyBadgeRecord,
  type MonthlyBadgeRef,
} from "../../../../../lib/badges/monthlyRankingBadge";

const OXANIUM_BOLD = Platform.select({ ios: "Oxanium_700Bold", android: "Oxanium_700Bold", default: "sans-serif" });
const OXANIUM_XBOLD = Platform.select({
  ios: "Oxanium_800ExtraBold",
  android: "Oxanium_800ExtraBold",
  default: "sans-serif",
});

const TILT_DEG = 11;
/** 刻印の文字サイズの基準（この大きさのときの px） */
const DESIGN_SIZE = 340;

type Props = {
  badgeRef: MonthlyBadgeRef;
  record?: MonthlyBadgeRecord | null;
  size: number;
  /** false で傾き・光を止める（画面外・モーダル閉じ） */
  active?: boolean;
  /** 初回に光を 1 回走らせるまでの待ち（受け取り演出で着地に合わせる） */
  introSheenDelayMs?: number;
};

function clamp(v: number, lo: number, hi: number): number {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
}

function EngravedBack({
  badgeRef,
  record,
  size,
}: {
  badgeRef: MonthlyBadgeRef;
  record?: MonthlyBadgeRecord | null;
  size: number;
}) {
  const panel = MONTHLY_BADGE_BACK_PANEL[badgeRef.division];
  const ink = MONTHLY_BADGE_ENGRAVE_INK[Math.min(badgeRef.rank, 3)] ?? MONTHLY_BADGE_ENGRAVE_INK[1];
  const k = size / DESIGN_SIZE;
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as const;
  const engrave = { ...shadow, color: ink } as const;
  const value = formatMonthlyBadgeValue(badgeRef.kind, record?.value);
  const ordinal = monthlyBadgeRankOrdinal(badgeRef.rank);
  const rankLine = record?.participantCount ? `${ordinal} OF ${record.participantCount.toLocaleString("en-US")}` : ordinal;
  const foot = `${monthlyBadgeMonthArt(badgeRef.label)} · ${monthlyBadgeKindLabelArt(badgeRef.kind)}`;
  const fit = { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.6 } as const;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.panel,
        { left: panel.x * size, top: panel.y * size, width: panel.w * size, height: panel.h * size, gap: 2 * k },
      ]}
    >
      <Text style={[shadow, styles.name, { fontSize: 24 * k, lineHeight: 30 * k }]} {...fit}>
        {record?.engravedName ?? "—"}
      </Text>
      {record?.handle ? (
        <Text style={[engrave, styles.small, { fontSize: 11 * k, letterSpacing: 1 * k, opacity: 0.75 }]} {...fit}>
          @{record.handle}
        </Text>
      ) : null}
      <View style={{ width: "56%", height: StyleSheet.hairlineWidth * 2, backgroundColor: ink, opacity: 0.4, marginVertical: 6 * k }} />
      {value ? (
        <Text style={[engrave, styles.value, { fontSize: 36 * k, lineHeight: 40 * k, letterSpacing: 1 * k }]} {...fit}>
          {value.value}
          <Text style={{ fontSize: 14 * k, letterSpacing: 2 * k }}> {value.unit}</Text>
        </Text>
      ) : null}
      <Text style={[engrave, styles.value, { fontSize: 14 * k, letterSpacing: 2.5 * k, marginTop: 4 * k }]} {...fit}>
        {rankLine}
      </Text>
      <Text style={[engrave, styles.small, { fontSize: 10.5 * k, letterSpacing: 1.5 * k, opacity: 0.8, marginTop: 3 * k }]} {...fit}>
        {foot}
      </Text>
    </View>
  );
}

export default function MonthlyBadgeShowcaseNative({
  badgeRef,
  record,
  size,
  active = true,
  introSheenDelayMs = 350,
}: Props) {
  const art = monthlyBadgeArt(badgeRef);
  const frontUri = resolveUniterzAssetUrl(art.full) ?? "";
  const backUri = resolveUniterzAssetUrl(art.back) ?? "";
  const frontImage = useImage(frontUri);
  const reduceMotion = useReducedMotion() ?? false;
  const first = badgeRef.rank === 1;

  const flip = useSharedValue(0);
  const flipped = useSharedValue(false);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const baseX = useSharedValue(0);
  const baseY = useSharedValue(0);
  const hasBase = useSharedValue(false);
  const sweep = useSharedValue(-1.6);
  const motionOn = useSharedValue(active && !reduceMotion);

  useEffect(() => {
    motionOn.value = active && !reduceMotion;
    if (!active || reduceMotion) {
      tiltX.value = withTiming(0, { duration: 240 });
      tiltY.value = withTiming(0, { duration: 240 });
      hasBase.value = false;
    }
  }, [active, reduceMotion, motionOn, tiltX, tiltY, hasBase]);

  useEffect(() => {
    if (!active) return;
    sweep.value = -1.6;
    sweep.value = withDelay(
      introSheenDelayMs,
      withTiming(reduceMotion ? 0 : 1.6, { duration: reduceMotion ? 0 : 1100, easing: Easing.inOut(Easing.cubic) })
    );
  }, [active, introSheenDelayMs, reduceMotion, sweep]);

  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 16 });

  useAnimatedReaction(
    () => gravity.sensor.value,
    (g) => {
      if (!motionOn.value) return;
      const mag = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
      if (!(mag > 0.01)) return;
      const gx = g.x / mag;
      const gy = g.y / mag;
      if (!hasBase.value) {
        baseX.value = gx;
        baseY.value = gy;
        hasBase.value = true;
      }
      // 基準をゆっくり追従させる（持ち方が変わっても正面に戻る）
      baseX.value += (gx - baseX.value) * 0.012;
      baseY.value += (gy - baseY.value) * 0.012;
      tiltX.value = clamp((gx - baseX.value) * 3, -1, 1);
      tiltY.value = clamp((gy - baseY.value) * 3, -1, 1);
    }
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltY.value * TILT_DEG}deg` },
      { rotateY: `${flip.value * 180 + tiltX.value * TILT_DEG}deg` },
    ],
  }));
  const frontStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 0 : 1 }));

  const sheenPos = useDerivedValue(() => sweep.value + tiltX.value * 0.9 - tiltY.value * 0.5);
  const sheenStart = useDerivedValue(() => {
    const c = size / 2 + sheenPos.value * size * 0.55;
    return { x: c - size * 0.28, y: c - size * 0.28 };
  });
  const sheenEnd = useDerivedValue(() => {
    const c = size / 2 + sheenPos.value * size * 0.55;
    return { x: c + size * 0.28, y: c + size * 0.28 };
  });
  const holoStart = useDerivedValue(() => {
    const c = size / 2 - sheenPos.value * size * 0.4;
    return { x: c - size * 0.6, y: c + size * 0.2 };
  });
  const holoEnd = useDerivedValue(() => {
    const c = size / 2 - sheenPos.value * size * 0.4;
    return { x: c + size * 0.6, y: c - size * 0.2 };
  });

  const onPress = () => {
    const next = !flipped.value;
    flipped.value = next;
    flip.value = withTiming(next ? 1 : 0, { duration: 560, easing: Easing.inOut(Easing.cubic) });
    hapticSelection();
  };

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint="Flip">
      <Animated.View style={[{ width: size, height: size }, cardStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
          {frontImage ? (
            <Canvas style={{ width: size, height: size }} pointerEvents="none">
              <SkiaImage image={frontImage} x={0} y={0} width={size} height={size} fit="contain" />
              {first ? (
                <Rect x={0} y={0} width={size} height={size} blendMode="srcATop" opacity={0.16}>
                  <LinearGradient
                    start={holoStart}
                    end={holoEnd}
                    colors={["#ff4fd800", "#ff4fd8", "#ffe14f", "#4fffb0", "#4fc3ff", "#b44fff", "#b44fff00"]}
                  />
                </Rect>
              ) : null}
              <Rect x={0} y={0} width={size} height={size} blendMode="srcATop">
                <LinearGradient
                  start={sheenStart}
                  end={sheenEnd}
                  colors={["#FFFFFF00", "#FFFFFF00", "#FFFFFF59", "#FFFFFF00", "#FFFFFF00"]}
                  positions={[0, 0.38, 0.5, 0.62, 1]}
                />
              </Rect>
            </Canvas>
          ) : frontUri ? (
            <Image source={{ uri: frontUri }} style={{ width: size, height: size }} resizeMode="contain" />
          ) : null}
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, backStyle, { transform: [{ rotateY: "180deg" }] }]}>
          {backUri ? <Image source={{ uri: backUri }} style={{ width: size, height: size }} resizeMode="contain" /> : null}
          <EngravedBack badgeRef={badgeRef} record={record} size={size} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    fontFamily: OXANIUM_BOLD,
    textAlign: "center",
  },
  name: {
    color: "#fbf6ea",
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "90%",
  },
  value: {
    fontFamily: OXANIUM_XBOLD,
    textAlign: "center",
  },
});
