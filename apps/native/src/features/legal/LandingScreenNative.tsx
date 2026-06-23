/** Web モバイル LP 相当 — 起動時ランディング（ワイヤーフレーム地形 + サイバー UI） */
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrambleDecode } from "@/lib/hooks/useScrambleDecode";
import type { AuthStackParamList } from "../../navigation/types";
import { spacing } from "../../theme/tokens";
import AuthLandingBackgroundNative from "../auth/AuthLandingBackgroundNative";
import { hideNativeBootSplash } from "../../bootstrap/nativeBootSplash";

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";
const CYBER_CYAN_SOFT = "rgba(0, 245, 255, 0.78)";

type LandingSkewBtnProps = {
  label: string;
  labelStyle: TextStyle;
  variant: "primary" | "ghost";
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
};

/** スキュー平行四辺形 — primary / ghost 同一シェル */
function LandingSkewBtn({
  label,
  labelStyle,
  variant,
  onPress,
  onPressIn,
  onPressOut,
}: LandingSkewBtnProps) {
  return (
    <View style={styles.ctaSkewWrap}>
      <Pressable
        style={styles.ctaBtnPressable}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={[
            styles.ctaBtnBorder,
            variant === "primary" ? styles.ctaBtnBorderPrimary : styles.ctaBtnBorderGhost,
          ]}
        >
          <View
            style={[
              styles.ctaBtnFill,
              variant === "primary" ? styles.ctaBtnFillPrimary : styles.ctaBtnFillGhost,
            ]}
          >
            <View style={styles.btnRail} pointerEvents="none" />
            <View style={styles.ctaLabelWrap}>
              <Text style={labelStyle}>{label}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/** コーナーブラケット — サイバーフレーム装飾 */
function CyberFrameNative({ width }: { width: number }) {
  const arm = Math.min(28, width * 0.08);
  const color = "rgba(103,232,249,0.45)";
  const corner = {
    position: "absolute" as const,
    width: arm,
    height: arm,
  };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: 0.85 }]}>
      <View style={[corner, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color }]} />
      <View style={[corner, { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1, borderColor: color }]} />
      <View style={[corner, { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: color }]} />
      <View style={[corner, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color }]} />
    </View>
  );
}

export default function LandingScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = Dimensions.get("window");
  const contentWidth = Math.min(340, windowWidth - 40);

  const [heroScrambleRun, setHeroScrambleRun] = useState(false);
  const heroDisplay = useScrambleDecode("UNITERZ", heroScrambleRun);

  const eyebrowOpacity = useRef(new Animated.Value(0)).current;
  const eyebrowY = useRef(new Animated.Value(10)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const heroGlow = useRef(new Animated.Value(0)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(18)).current;
  const lineFlow = useRef(new Animated.Value(0)).current;
  const primaryScale = useRef(new Animated.Value(1)).current;
  const bootScanY = useRef(new Animated.Value(0)).current;
  const bootScanOpacity = useRef(new Animated.Value(0)).current;
  const contentReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hideNativeBootSplash();

    Animated.parallel([
      Animated.timing(bootScanOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(bootScanY, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(bootScanOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(contentReveal, {
      toValue: 1,
      duration: 420,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(eyebrowOpacity, {
        toValue: 1,
        duration: 320,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(eyebrowY, {
        toValue: 0,
        duration: 320,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const heroTimer = setTimeout(() => setHeroScrambleRun(true), 240);
    const heroEntrance = setTimeout(() => {
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 3,
        }),
      ]).start();
    }, 260);

    const dividerTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(dividerOpacity, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(dividerScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 0,
        }),
      ]).start();
    }, 480);

    const ctaTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 620);

    return () => {
      clearTimeout(heroTimer);
      clearTimeout(heroEntrance);
      clearTimeout(dividerTimer);
      clearTimeout(ctaTimer);
    };
  }, [
    bootScanOpacity,
    bootScanY,
    contentReveal,
    ctaOpacity,
    ctaY,
    dividerOpacity,
    dividerScale,
    eyebrowOpacity,
    eyebrowY,
    heroOpacity,
    heroScale,
  ]);

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlow, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlow, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [heroGlow]);

  useEffect(() => {
    const lineLoop = Animated.loop(
      Animated.timing(lineFlow, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    lineLoop.start();
    return () => lineLoop.stop();
  }, [lineFlow]);

  const lineTravel = lineFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180],
  });
  const heroGlowOpacity = heroGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.62],
  });
  const bootScanTranslateY = bootScanY.interpolate({
    inputRange: [0, 1],
    outputRange: [-windowHeight * 0.08, windowHeight * 1.04],
  });
  /** 光学中心をやや上に — 地形の地平線と UNITERZ が重なる */
  const blockShiftY = -windowHeight * 0.045;
  const contentRevealOpacity = contentReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const contentRevealY = contentReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [14 + blockShiftY, blockShiftY],
  });

  const pressIn = () => {
    Animated.spring(primaryScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 24,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(primaryScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  return (
    <View style={styles.root}>
      <AuthLandingBackgroundNative />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bootScan,
          {
            opacity: bootScanOpacity,
            transform: [{ translateY: bootScanTranslateY }],
          },
        ]}
      />
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.mainBlock,
            {
              width: contentWidth,
              transform: [{ translateY: contentRevealY }],
              opacity: contentRevealOpacity,
            },
          ]}
        >
          <View style={styles.frameShell}>
            <CyberFrameNative width={contentWidth} />

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
                    opacity: heroOpacity,
                    transform: [{ scale: heroScale }],
                  },
                ]}
              >
                <Animated.Text
                  pointerEvents="none"
                  style={[styles.hero, styles.heroGlow, { opacity: heroGlowOpacity }]}
                >
                  {heroDisplay}
                </Animated.Text>
                <Text style={styles.hero}>{heroDisplay}</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.heroDivider,
                  {
                    opacity: dividerOpacity,
                    transform: [{ scaleX: dividerScale }],
                  },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.heroDividerFlowWrap,
                    { transform: [{ translateX: lineTravel }] },
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(103,232,249,0.95)", "rgba(0,0,0,0)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.heroDividerFlow}
                  />
                </Animated.View>
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.ctaBlock,
                {
                  opacity: ctaOpacity,
                  transform: [{ translateY: ctaY }],
                },
              ]}
            >
              <Animated.View style={[styles.ctaScaleWrap, { transform: [{ scale: primaryScale }] }]}>
                <LandingSkewBtn
                  variant="primary"
                  label="GET STARTED"
                  labelStyle={styles.ctaPrimaryLabel}
                  onPress={() => navigation.navigate("Login", { initialMode: "signup" })}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                />
              </Animated.View>

              <LandingSkewBtn
                variant="ghost"
                label="LOG IN"
                labelStyle={styles.ctaSecondaryLabel}
                onPress={() => navigation.navigate("Login")}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#041418",
  },
  bootScan: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    zIndex: 4,
    backgroundColor: "rgba(103,232,249,0.92)",
    shadowColor: "rgba(34,211,238,0.95)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 12,
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
  heroBlock: {
    alignItems: "center",
    gap: 10,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "rgba(165,243,252,0.78)",
    fontSize: 11,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  hero: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 72,
    letterSpacing: 7,
    lineHeight: 72,
    color: "#e6e4de",
    textAlign: "center",
  },
  heroGlow: {
    position: "absolute",
    textShadowColor: "rgba(34,211,238,0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  heroDivider: {
    alignSelf: "center",
    width: "72%",
    maxWidth: 260,
    height: 1,
    marginTop: 4,
    backgroundColor: "rgba(34,211,238,0.9)",
    shadowColor: "rgba(34,211,238,0.65)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  heroDividerFlowWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
  },
  heroDividerFlow: {
    width: 90,
    height: "100%",
  },
  ctaBlock: {
    gap: 14,
    width: "100%",
    alignSelf: "stretch",
  },
  ctaScaleWrap: {
    width: "100%",
    alignSelf: "stretch",
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
  },
  ctaBtnBorderPrimary: {
    borderColor: "rgba(0,245,255,0.34)",
    backgroundColor: "rgba(8,14,22,0.96)",
  },
  ctaBtnBorderGhost: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,14,22,0.48)",
  },
  ctaBtnFill: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  ctaBtnFillPrimary: {
    backgroundColor: "rgba(8,14,22,0.96)",
  },
  ctaBtnFillGhost: {
    backgroundColor: "rgba(8,14,22,0.48)",
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
    backgroundColor: "rgba(0,245,255,0.55)",
    zIndex: 2,
  },
  ctaPrimaryLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 28,
    letterSpacing: 5,
    color: "#e8eaed",
  },
  ctaSecondaryLabel: {
    color: CYBER_CYAN_SOFT,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
    letterSpacing: 4,
  },
});
