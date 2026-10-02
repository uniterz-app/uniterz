/**
 * Web モバイル LP 相当 — 起動ランディング
 * 演出方針: スキャン/スクランブル/着弾系は使わない。
 * 「暗い地平 → 光の線 → ブランドが立ち上がる → CTA」のシネマティックな一幕。
 * 追加のセンス層: 地平の残光、CTA レールの一閃。
 */
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  type TextStyle,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import type { AuthStackParamList } from "../../navigation/types";
import { fonts, spacing } from "../../theme/tokens";
import AuthLandingBackgroundNative from "../auth/AuthLandingBackgroundNative";
import { AUTH_LANDING } from "../auth/authLandingPalette";
import { hideNativeBootSplash } from "../../bootstrap/nativeBootSplash";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import SlantCtaNative from "../../ui/SlantCtaNative";

const HERO_LOGO_WIDTH = 280;

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";

export type LandingScreenNativeProps = {
  /** シェル側で背景を描くとき */
  hideBackground?: boolean;
  /** シェル側でスプラッシュを閉じるとき */
  skipBootSplash?: boolean;
  onGetStarted?: () => void;
  onLogIn?: () => void;
};

type LandingSkewBtnProps = {
  label: string;
  labelStyle: TextStyle;
  variant: "mono" | "monoGhost";
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  /** 入場・待機アニメ用 */
  enterOpacity: Animated.Value;
  enterX: Animated.Value;
  pressScale: Animated.Value;
  /** 0→1 でレール光が一閃（入場後） */
  railSweep: Animated.Value;
  /** 0↔1 待機中のレール脈動 */
  railPulse: Animated.Value;
};

function LandingSkewBtn({
  label,
  variant,
  onPress,
  onPressIn,
  onPressOut,
  enterOpacity,
  enterX,
  pressScale,
}: LandingSkewBtnProps) {
  return (
    <Animated.View
      style={[
        styles.ctaSkewWrap,
        {
          opacity: enterOpacity,
          transform: [{ translateX: enterX }, { scale: pressScale }],
        },
      ]}
    >
      <SlantCtaNative
        label={label}
        variant={variant}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      />
    </Animated.View>
  );
}

export default function LandingScreenNative({
  hideBackground = false,
  skipBootSplash = false,
  onGetStarted,
  onLogIn,
}: LandingScreenNativeProps = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = Dimensions.get("window");
  const contentWidth = Math.min(340, windowWidth - 40);
  const [veilSize, setVeilSize] = useState({ w: 0, h: 0 });

  const onVeilLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - veilSize.w) < 1 && Math.abs(height - veilSize.h) < 1) return;
    setVeilSize({ w: width, h: height });
  };

  /** 全体の暗幕（最初は黒く、徐々に背景が見える） */
  const curtain = useRef(new Animated.Value(1)).current;
  /** 地平線の光 — 中央から左右へ伸びる */
  const horizon = useRef(new Animated.Value(0)).current;
  const horizonGlow = useRef(new Animated.Value(0)).current;
  /** 入場後の線の脈動・コア点滅・横走りシマー */
  const horizonPulse = useRef(new Animated.Value(0)).current;
  const horizonCorePulse = useRef(new Animated.Value(0)).current;
  const horizonShimmer = useRef(new Animated.Value(0)).current;
  /** ブランドが地平から立ち上がる */
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(28)).current;
  const brandBreath = useRef(new Animated.Value(0)).current;
  /** サブコピー */
  const eyebrowOpacity = useRef(new Animated.Value(0)).current;
  const eyebrowY = useRef(new Animated.Value(8)).current;
  /** CTA — 2ボタン個別入場 + レール脈動 */
  const primaryOpacity = useRef(new Animated.Value(0)).current;
  const primaryX = useRef(new Animated.Value(-28)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;
  const ghostX = useRef(new Animated.Value(28)).current;
  const primaryScale = useRef(new Animated.Value(1)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const primaryRailSweep = useRef(new Animated.Value(0)).current;
  const ghostRailSweep = useRef(new Animated.Value(0)).current;
  const primaryRailPulse = useRef(new Animated.Value(0)).current;
  const ghostRailPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!skipBootSplash) hideNativeBootSplash();

    const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
    const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

    Animated.sequence([
      Animated.delay(180),
      Animated.timing(curtain, {
        toValue: 0,
        duration: 900,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(420),
      Animated.parallel([
        Animated.timing(horizon, {
          toValue: 1,
          duration: 1100,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(horizonGlow, {
          toValue: 1,
          duration: 1200,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(980),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 900,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 1100,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(eyebrowOpacity, {
          toValue: 1,
          duration: 700,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(eyebrowY, {
          toValue: 0,
          duration: 700,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // GET STARTED ← / LOG IN → スタッガー入場 → レール一閃 → 脈動開始
    Animated.sequence([
      Animated.delay(1880),
      Animated.stagger(140, [
        Animated.parallel([
          Animated.timing(primaryOpacity, {
            toValue: 1,
            duration: 620,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(primaryX, {
            toValue: 0,
            duration: 720,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ghostOpacity, {
            toValue: 1,
            duration: 620,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(ghostX, {
            toValue: 0,
            duration: 720,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.stagger(120, [
        Animated.timing(primaryRailSweep, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ghostRailSweep, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(primaryRailPulse, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(primaryRailPulse, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(ghostRailPulse, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ghostRailPulse, {
            toValue: 0,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [
    brandOpacity,
    brandY,
    curtain,
    eyebrowOpacity,
    eyebrowY,
    ghostOpacity,
    ghostRailSweep,
    ghostX,
    horizon,
    horizonGlow,
    primaryOpacity,
    primaryRailSweep,
    primaryX,
    skipBootSplash,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(brandBreath, {
            toValue: 1,
            duration: 3600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(brandBreath, {
            toValue: 0,
            duration: 3600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }, 2200);
    return () => clearTimeout(t);
  }, [brandBreath]);

  /** 地平線 — ゆっくり脈動＋中央コア＋光が横に走る */
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let shimmerLoop: Animated.CompositeAnimation | null = null;
    const t = setTimeout(() => {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(horizonPulse, {
              toValue: 1,
              duration: 2400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(horizonCorePulse, {
              toValue: 1,
              duration: 2400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(horizonPulse, {
              toValue: 0,
              duration: 2400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(horizonCorePulse, {
              toValue: 0,
              duration: 2400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(horizonShimmer, {
            toValue: 1,
            duration: 4200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(horizonShimmer, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      horizonShimmer.setValue(0);
      pulseLoop.start();
      shimmerLoop.start();
    }, 1600);
    return () => {
      clearTimeout(t);
      pulseLoop?.stop();
      shimmerLoop?.stop();
    };
  }, [horizonCorePulse, horizonPulse, horizonShimmer]);

  const blockShiftY = -windowHeight * 0.045;
  const horizonScaleX = horizon.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 1],
  });
  const horizonLineOpacity = Animated.multiply(
    horizonGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.88],
    }),
    horizonPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.58, 1],
    })
  );
  const horizonCoreOpacity = Animated.multiply(
    horizonGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    horizonCorePulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.55, 1],
    })
  );
  const horizonCoreScale = horizonCorePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });
  const horizonBloomOpacity = Animated.multiply(
    horizonGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.55],
    }),
    horizonCorePulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    })
  );
  const horizonBloomScale = horizonCorePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.85],
  });
  const horizonShimmerX = horizonShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });
  const brandGlowOpacity = brandBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.48],
  });
  const makePress = (scale: Animated.Value) => ({
    in: () => {
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 24,
        bounciness: 0,
      }).start();
    },
    out: () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }).start();
    },
  });
  const primaryPress = makePress(primaryScale);
  const ghostPress = makePress(ghostScale);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    navigation.navigate("Login", { initialMode: "signup" });
  };
  const handleLogIn = () => {
    if (onLogIn) {
      onLogIn();
      return;
    }
    navigation.navigate("Login");
  };

  return (
    <View style={[styles.root, hideBackground && styles.rootEmbedded]}>
      {hideBackground ? null : <AuthLandingBackgroundNative />}

      <Animated.View pointerEvents="none" style={[styles.curtain, { opacity: curtain }]} />

      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
      >
        <View style={[styles.mainBlock, { width: contentWidth, transform: [{ translateY: blockShiftY }] }]}>
          <View style={styles.frameShell}>
            <View pointerEvents="none" style={styles.readabilityVeil} onLayout={onVeilLayout}>
              {hideBackground || veilSize.w <= 0 ? null : (
                <Svg width={veilSize.w} height={veilSize.h}>
                  <Defs>
                    <RadialGradient
                      id="landingHeroVeil"
                      cx="50%"
                      cy="48%"
                      rx="74%"
                      ry="62%"
                    >
                      <Stop offset="0" stopColor="#000000" stopOpacity="0.86" />
                      <Stop offset="0.4" stopColor="#000000" stopOpacity="0.58" />
                      <Stop offset="0.74" stopColor="#000000" stopOpacity="0.2" />
                      <Stop offset="1" stopColor="#000000" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width={veilSize.w}
                    height={veilSize.h}
                    fill="url(#landingHeroVeil)"
                  />
                </Svg>
              )}
            </View>
            <View style={styles.heroBlock}>
              <Animated.Text
                style={[
                  styles.eyebrow,
                  {
                    opacity: eyebrowOpacity,
                    transform: [{ translateY: eyebrowY }],
                  },
                ]}
              >
                Sports Prediction Game
              </Animated.Text>

              <Animated.View
                style={[
                  styles.heroWrap,
                  {
                    opacity: brandOpacity,
                    transform: [{ translateY: brandY }],
                  },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[styles.heroGlow, { opacity: brandGlowOpacity }]}
                >
                  <UniterzLogoNative width={HERO_LOGO_WIDTH} />
                </Animated.View>
                <UniterzLogoNative width={HERO_LOGO_WIDTH} />
              </Animated.View>

              <View style={styles.horizonSlot}>
                <Animated.View
                  style={[
                    styles.horizonLineWrap,
                    {
                      opacity: horizonLineOpacity,
                      transform: [{ scaleX: horizonScaleX }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "transparent",
                      "rgba(0,245,255,0.45)",
                      "rgba(233,253,255,0.95)",
                      "rgba(0,245,255,0.45)",
                      "transparent",
                    ]}
                    locations={[0, 0.28, 0.5, 0.72, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.horizonLine}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.horizonShimmer,
                      { transform: [{ translateX: horizonShimmerX }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "transparent",
                        "rgba(233,253,255,0.55)",
                        AUTH_LANDING.accent,
                        "rgba(233,253,255,0.55)",
                        "transparent",
                      ]}
                      locations={[0, 0.3, 0.5, 0.7, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.horizonBloom,
                    {
                      opacity: horizonBloomOpacity,
                      transform: [{ scale: horizonBloomScale }],
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.horizonCore,
                    {
                      opacity: horizonCoreOpacity,
                      transform: [{ scale: horizonCoreScale }],
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.ctaBlock}>
              <LandingSkewBtn
                variant="mono"
                label="GET STARTED"
                labelStyle={styles.ctaPrimaryLabel}
                enterOpacity={primaryOpacity}
                enterX={primaryX}
                pressScale={primaryScale}
                railSweep={primaryRailSweep}
                railPulse={primaryRailPulse}
                onPress={handleGetStarted}
                onPressIn={primaryPress.in}
                onPressOut={primaryPress.out}
              />
              <LandingSkewBtn
                variant="monoGhost"
                label="LOG IN"
                labelStyle={styles.ctaSecondaryLabel}
                enterOpacity={ghostOpacity}
                enterX={ghostX}
                pressScale={ghostScale}
                railSweep={ghostRailSweep}
                railPulse={ghostRailPulse}
                onPress={handleLogIn}
                onPressIn={ghostPress.in}
                onPressOut={ghostPress.out}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_LANDING.canvas,
  },
  rootEmbedded: {
    backgroundColor: "transparent",
  },
  curtain: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    backgroundColor: AUTH_LANDING.void,
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  mainBlock: {
    alignSelf: "center",
  },
  frameShell: {
    position: "relative",
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 36,
  },
  readabilityVeil: {
    position: "absolute",
    left: -56,
    right: -56,
    top: -36,
    bottom: -24,
    zIndex: 0,
  },
  heroBlock: {
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: AUTH_LANDING.muted,
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heroGlow: {
    position: "absolute",
    shadowColor: "rgba(0,245,255,0.75)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 32,
  },
  horizonSlot: {
    width: "78%",
    maxWidth: 280,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "visible",
  },
  horizonLineWrap: {
    width: "100%",
    height: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  horizonLine: {
    width: "100%",
    height: 1.5,
  },
  horizonShimmer: {
    position: "absolute",
    width: 56,
    height: 3,
    alignSelf: "center",
  },
  horizonBloom: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AUTH_LANDING.accentFill,
    shadowColor: AUTH_LANDING.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  horizonCore: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AUTH_LANDING.ink,
    shadowColor: AUTH_LANDING.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  ctaBlock: {
    gap: 14,
    width: "100%",
    alignSelf: "stretch",
    zIndex: 1,
  },
  ctaSkewWrap: {
    width: "100%",
    alignSelf: "stretch",
    transform: [{ skewX: BTN_SKEW }],
  },
  ctaBtnPressable: {
    width: "100%",
    alignSelf: "stretch",
  },
  ctaBtnBorder: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  ctaBtnBorderPrimary: {
    borderColor: AUTH_LANDING.accent,
    backgroundColor: AUTH_LANDING.accent,
  },
  ctaBtnBorderGhost: {
    borderColor: AUTH_LANDING.accentLine,
    backgroundColor: "rgba(8,17,22,0.48)",
  },
  ctaBtnGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaBtnGlowPrimary: {
    borderWidth: 1,
    borderColor: AUTH_LANDING.ink,
    shadowColor: AUTH_LANDING.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  ctaBtnGlowGhost: {
    borderWidth: 1,
    borderColor: AUTH_LANDING.accentLine,
  },
  ctaBtnFill: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    overflow: "hidden",
  },
  ctaBtnFillPrimary: {
    backgroundColor: AUTH_LANDING.accent,
  },
  ctaBtnFillGhost: {
    backgroundColor: "rgba(8,17,22,0.48)",
  },
  ctaLabelWrap: {
    transform: [{ skewX: BTN_UNSKEW }],
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  btnRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: AUTH_LANDING.onAccent,
    opacity: 0.28,
    zIndex: 2,
  },
  btnRailSweep: {
    position: "absolute",
    left: 0,
    width: 2,
    height: 18,
    backgroundColor: AUTH_LANDING.ink,
    shadowColor: AUTH_LANDING.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    zIndex: 3,
  },
  ctaPrimaryLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 28,
    letterSpacing: 5,
    color: AUTH_LANDING.onAccent,
  },
  ctaSecondaryLabel: {
    color: AUTH_LANDING.accent,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
    letterSpacing: 4,
  },
});
