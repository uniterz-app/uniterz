import { useEffect, useId, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Line,
  Pattern,
  Path,
  Rect,
  SvgXml,
} from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  PROFILE_PLAN_PRO_BG_DEFAULT,
  PROFILE_PLAN_PRO_BG_DEPTH_TIMING,
  isProfilePlanProDepthVariant,
  type ProfilePlanProBgVariant,
} from "../../../../../../lib/profile/profilePlanProBgVariants";
import { isProfilePlanProGeoBgVariant } from "../../../../../../lib/profile/profilePlanProGeoBgVariants";
import type { ProfilePlanProHexBgVariant } from "../../../../../../lib/profile/profilePlanProHexBgVariants";
import {
  getProfilePlanProHexLayoutId,
  isProfilePlanProHexBgVariant,
} from "../../../../../../lib/profile/profilePlanProHexBgVariants";
import {
  getProfilePlanProHexLayoutArt,
  hexCellToPathD,
  PROFILE_PLAN_PRO_HEX_LAYOUT_W,
  PROFILE_PLAN_PRO_HEX_LAYOUT_H,
} from "../../../../../../lib/profile/profilePlanProHexLayoutPattern";
import {
  getProfilePlanProAtmosHexCells,
  PROFILE_PLAN_PRO_ATMOS_CANVAS,
} from "../../../../../../lib/profile/profilePlanProAtmosBg";
import type { KinetikProfileAccentKey } from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import { isProfilePlanProMoodBgVariant } from "../../../../../../lib/profile/profilePlanProMoodBgVariants";
import { isProfilePlanProNovaBgVariant } from "../../../../../../lib/profile/profilePlanProNovaBgVariants";
import {
  getProfilePlanProScaleHudItems,
  getProfilePlanProScaleSkinItems,
  PROFILE_PLAN_PRO_SCALE_CANVAS,
  type ProfilePlanProScaleDrawItem,
} from "../../../../../../lib/profile/profilePlanProScalePattern";
import {
  isProfilePlanProScaleBgVariant,
  type ProfilePlanProScaleBgVariant,
} from "../../../../../../lib/profile/profilePlanProScaleBgVariants";
import {
  getProfilePlanProBeastHudSvg,
  getProfilePlanProBeastSkinSvg,
  PROFILE_PLAN_PRO_BEAST_CANVAS,
} from "../../../../../../lib/profile/profilePlanProBeastPattern";
import {
  isProfilePlanProBeastBgVariant,
  type ProfilePlanProBeastBgVariant,
} from "../../../../../../lib/profile/profilePlanProBeastBgVariants";
import {
  getProfilePlanProCosmosHudSvg,
  getProfilePlanProCosmosSkinSvg,
  PROFILE_PLAN_PRO_COSMOS_CANVAS,
} from "../../../../../../lib/profile/profilePlanProCosmosPattern";
import {
  isProfilePlanProCosmosBgVariant,
  type ProfilePlanProCosmosBgVariant,
} from "../../../../../../lib/profile/profilePlanProCosmosBgVariants";
import {
  getProfilePlanProLabHudSvg,
  getProfilePlanProLabSkinSvg,
  PROFILE_PLAN_PRO_LAB_CANVAS,
} from "../../../../../../lib/profile/profilePlanProLabPattern";
import {
  isProfilePlanProLabBgVariant,
  type ProfilePlanProLabBgVariant,
} from "../../../../../../lib/profile/profilePlanProLabBgVariants";
import {
  getProfilePlanProFormHudSvg,
  getProfilePlanProFormSkinSvg,
  PROFILE_PLAN_PRO_FORM_CANVAS,
} from "../../../../../../lib/profile/profilePlanProFormPattern";
import {
  isProfilePlanProFormBgVariant,
  type ProfilePlanProFormBgVariant,
} from "../../../../../../lib/profile/profilePlanProFormBgVariants";
import {
  getProfilePlanProNeoSkinSvg,
  PROFILE_PLAN_PRO_NEO_CANVAS,
} from "../../../../../../lib/profile/profilePlanProNeoPattern";
import {
  isProfilePlanProNeoBgVariant,
  type ProfilePlanProNeoBgVariant,
} from "../../../../../../lib/profile/profilePlanProNeoBgVariants";
import {
  getProfilePlanProFuturisticArtId,
  isProfilePlanProFuturisticBgVariant,
  type ProfilePlanProFuturisticBgVariant,
} from "../../../../../../lib/profile/profilePlanProFuturisticBgVariants";
import EclipseBackground from "../backgrounds/EclipseBackground";
import DataStreamBackground from "../backgrounds/DataStreamBackground";
import { PROFILE_PLAN_PRO_BG } from "../../../../../../lib/profile/profilePlanVisual";

type Props = {
  width: number;
  height: number;
  animate?: boolean;
  variant?: ProfilePlanProBgVariant;
  /** 枠 accent — 図形色を tier に合わせる */
  profileAccent?: KinetikProfileAccentKey;
  /** false の間は背景を出さない（stats 確定前の accent チラつき防止） */
  accentReady?: boolean;
};

function DepthBase() {
  return (
    <LinearGradient
      colors={["#050c14", "#030508", "#020305"]}
      locations={[0, 0.55, 1]}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

function AuroraLayers({
  shouldAnimate,
}: {
  shouldAnimate: boolean;
}) {
  const aurora = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(aurora);
      aurora.value = 0.6;
      return;
    }
    aurora.value = withRepeat(
      withTiming(1, {
        duration: PROFILE_PLAN_PRO_BG.auroraPulseMs,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    return () => cancelAnimation(aurora);
  }, [aurora, shouldAnimate]);

  const cyanStyle = useAnimatedStyle(() => ({
    opacity: 0.58 + aurora.value * 0.42,
    transform: [{ scale: 0.94 + aurora.value * 0.14 }],
  }));
  const purpleStyle = useAnimatedStyle(() => ({
    opacity: 0.48 + (1 - aurora.value) * 0.48,
    transform: [{ scale: 1.06 - aurora.value * 0.1 }],
  }));

  return (
    <>
      <LinearGradient
        colors={[
          "rgba(34,211,238,0.07)",
          "transparent",
          "transparent",
          "rgba(167,139,250,0.06)",
        ]}
        locations={[0, 0.38, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.auroraCyan, cyanStyle]}>
        <LinearGradient
          colors={["rgba(34,211,238,0.46)", "rgba(34,211,238,0.1)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[styles.auroraPurple, purpleStyle]}>
        <LinearGradient
          colors={["rgba(167,139,250,0.4)", "rgba(167,139,250,0.08)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </>
  );
}

function ParallaxLayers({ shouldAnimate }: { shouldAnimate: boolean }) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(phase);
      phase.value = 0.5;
      return;
    }
    phase.value = withRepeat(
      withTiming(1, { duration: PROFILE_PLAN_PRO_BG_DEPTH_TIMING.parallaxMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => cancelAnimation(phase);
  }, [phase, shouldAnimate]);

  const farStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + phase.value * 0.28,
    transform: [{ translateX: phase.value * 8 }, { translateY: phase.value * 4 }, { scale: 1 + phase.value * 0.06 }],
  }));
  const midStyle = useAnimatedStyle(() => ({
    opacity: 0.68 + (1 - phase.value) * 0.28,
    transform: [{ translateX: (1 - phase.value) * -10 }, { translateY: (1 - phase.value) * -6 }, { scale: 1 + (1 - phase.value) * 0.08 }],
  }));
  const nearStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + phase.value * 0.28,
    transform: [{ translateX: phase.value * 14 }, { translateY: -phase.value * 10 }, { scale: 1 + phase.value * 0.12 }],
  }));

  return (
    <>
      <DepthBase />
      <Animated.View style={[styles.layerFar, farStyle]}>
        <LinearGradient colors={["rgba(34,211,238,0.3)", "transparent"]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View style={[styles.layerMid, midStyle]}>
        <LinearGradient colors={["rgba(124,92,255,0.34)", "transparent"]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View style={[styles.layerNear, nearStyle]}>
        <LinearGradient colors={["rgba(79,247,244,0.42)", "transparent"]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </>
  );
}

function TunnelLayers({ shouldAnimate }: { shouldAnimate: boolean }) {
  const flow = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(flow);
      flow.value = 0;
      return;
    }
    flow.value = withRepeat(
      withTiming(1, { duration: PROFILE_PLAN_PRO_BG_DEPTH_TIMING.tunnelMs, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(flow);
  }, [flow, shouldAnimate]);

  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: flow.value * 28 }],
  }));

  return (
    <>
      <DepthBase />
      <LinearGradient
        colors={[
          "rgba(34,211,238,0.16)",
          "rgba(34,211,238,0.04)",
          "transparent",
          "rgba(167,139,250,0.08)",
        ]}
        locations={[0, 0.22, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.tunnelWrap}>
        <Animated.View style={[styles.tunnelGrid, gridStyle]}>
          {Array.from({ length: 14 }, (_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.tunnelLineH,
                { top: `${(i / 13) * 100}%`, opacity: 0.15 + (i / 13) * 0.55 },
              ]}
            />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.tunnelLineV,
                {
                  left: `${8 + (i / 8) * 84}%`,
                  opacity: 0.12 + Math.abs(4 - i) * 0.08,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    </>
  );
}

function DepthFieldLayers({ shouldAnimate }: { shouldAnimate: boolean }) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(drift);
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: PROFILE_PLAN_PRO_BG_DEPTH_TIMING.depthFieldMs, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(drift);
  }, [drift, shouldAnimate]);

  const farStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value * 18 }] }));
  const midStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value * 30 }] }));
  const nearStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value * 44 }] }));

  const farDots: { top: `${number}%`; left: `${number}%` }[] = [
    { top: "12%", left: "18%" },
    { top: "28%", left: "72%" },
    { top: "44%", left: "35%" },
    { top: "58%", left: "82%" },
  ];
  const midDots: { top: `${number}%`; left: `${number}%` }[] = [
    { top: "20%", left: "55%" },
    { top: "38%", left: "12%" },
    { top: "52%", left: "64%" },
    { top: "66%", left: "28%" },
  ];
  const nearDots: { top: `${number}%`; left: `${number}%` }[] = [
    { top: "30%", left: "42%" },
    { top: "48%", left: "78%" },
    { top: "62%", left: "18%" },
  ];

  return (
    <>
      <DepthBase />
      <Animated.View style={[StyleSheet.absoluteFillObject, farStyle]}>
        {farDots.map((d, i) => (
          <View key={`f-${i}`} style={[styles.dotFar, { top: d.top, left: d.left }]} />
        ))}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, midStyle]}>
        {midDots.map((d, i) => (
          <View key={`m-${i}`} style={[styles.dotMid, { top: d.top, left: d.left }]} />
        ))}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, nearStyle]}>
        {nearDots.map((d, i) => (
          <View key={`n-${i}`} style={[styles.dotNear, { top: d.top, left: d.left }]} />
        ))}
      </Animated.View>
    </>
  );
}

function SonarLayers({
  shouldAnimate,
  variant,
}: {
  shouldAnimate: boolean;
  variant: ProfilePlanProBgVariant;
}) {
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(spin);
      spin.value = 0;
      return;
    }
    spin.value = withRepeat(
      withTiming(1, {
        duration:
          variant === "wormhole"
            ? PROFILE_PLAN_PRO_BG_DEPTH_TIMING.wormholeMs
            : PROFILE_PLAN_PRO_BG_DEPTH_TIMING.sonarMs,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(spin);
  }, [spin, shouldAnimate, variant]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <>
      <DepthBase />
      <View style={[styles.sonarRing, { width: "130%", height: "130%" }]} />
      <View style={[styles.sonarRing, { width: "62%", height: "62%", opacity: 0.55 }]} />
      <View style={[styles.sonarRing, { width: "32%", height: "32%", opacity: 0.4, borderColor: "rgba(124,92,255,0.35)" }]} />
      {variant === "orbit" ? (
        <>
          <View style={styles.orbitA} />
          <View style={styles.orbitB} />
        </>
      ) : null}
      <Animated.View style={[styles.sonarSweep, sweepStyle]} />
      {variant === "wormhole" ? <View style={styles.wormholeCore} /> : null}
    </>
  );
}

function MoodLayers({
  variant,
  shouldAnimate,
}: {
  variant: ProfilePlanProBgVariant;
  shouldAnimate: boolean;
}) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(phase);
      phase.value = 0.5;
      return;
    }
    phase.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => cancelAnimation(phase);
  }, [phase, shouldAnimate]);

  const blobA = useAnimatedStyle(() => ({
    opacity: 0.65 + phase.value * 0.35,
    transform: [{ scale: 0.94 + phase.value * 0.12 }],
  }));
  const blobB = useAnimatedStyle(() => ({
    opacity: 0.55 + (1 - phase.value) * 0.4,
    transform: [{ scale: 1.04 - phase.value * 0.08 }],
  }));

  const palette = (() => {
    switch (variant) {
      case "mood-sunset":
        return { a: "rgba(249,115,22,0.45)", b: "rgba(251,113,133,0.4)", c: "rgba(124,58,237,0.28)" };
      case "mood-ember":
        return { a: "rgba(220,38,38,0.5)", b: "rgba(234,88,12,0.42)", c: "rgba(127,29,29,0.35)" };
      case "mood-arctic":
        return { a: "rgba(186,230,253,0.4)", b: "rgba(56,189,248,0.36)", c: "rgba(148,163,184,0.22)" };
      case "mood-toxic":
        return { a: "rgba(132,204,22,0.48)", b: "rgba(34,197,94,0.4)", c: "rgba(163,230,53,0.26)" };
      case "mood-neon-pink":
        return { a: "rgba(236,72,153,0.5)", b: "rgba(217,70,239,0.44)", c: "rgba(99,102,241,0.3)" };
      case "mood-deep-sea":
        return { a: "rgba(6,182,212,0.42)", b: "rgba(14,116,144,0.36)", c: "rgba(30,58,95,0.38)" };
      case "mood-infrared":
        return { a: "rgba(239,68,68,0.48)", b: "rgba(249,115,22,0.45)", c: "rgba(254,240,138,0.2)" };
      case "mood-lavender":
        return { a: "rgba(196,181,253,0.4)", b: "rgba(167,139,250,0.36)", c: "rgba(99,102,241,0.26)" };
      default:
        return { a: "rgba(249,115,22,0.45)", b: "rgba(251,113,133,0.4)", c: "rgba(124,58,237,0.28)" };
    }
  })();

  return (
    <>
      <LinearGradient
        colors={["#0a0a12", "#050508", "#020204"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.moodBlob, styles.moodBlobA, blobA]}>
        <LinearGradient
          colors={[palette.a, "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[styles.moodBlob, styles.moodBlobB, blobB]}>
        <LinearGradient
          colors={[palette.b, "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <View style={[styles.moodBlob, styles.moodBlobC]}>
        <LinearGradient
          colors={[palette.c, "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </>
  );
}

/** Web SVG データ URL 相当 — SvgXml で skin + hud を重ねる（幅ロック） */
function SvgSkinHudLayers({
  width,
  skinXml,
  hudXml,
  canvasW,
  canvasH,
  shouldAnimate,
  variantKey,
}: {
  width: number;
  skinXml: string;
  hudXml: string;
  canvasW: number;
  canvasH: number;
  shouldAnimate: boolean;
  variantKey: string;
}) {
  const enter = useSharedValue(shouldAnimate ? 0 : 1);
  const artH = width * (canvasH / canvasW);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(enter);
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withTiming(1, {
      duration: PROFILE_PLAN_PRO_BG.atmosEnterMs,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(enter);
  }, [enter, shouldAnimate, variantKey]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      {
        translateY:
          (1 - enter.value) * PROFILE_PLAN_PRO_BG.atmosEnterYOffsetPx,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, width, height: artH },
        layerStyle,
      ]}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <SvgXml
          xml={skinXml}
          width={width}
          height={artH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          preserveAspectRatio="none"
        />
      </View>
      <View style={StyleSheet.absoluteFillObject}>
        <SvgXml
          xml={hudXml}
          width={width}
          height={artH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          preserveAspectRatio="none"
        />
      </View>
    </Animated.View>
  );
}

/** Web `beast-*` 相当 */
function BeastLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProBeastBgVariant;
  shouldAnimate: boolean;
}) {
  return (
    <SvgSkinHudLayers
      width={width}
      skinXml={getProfilePlanProBeastSkinSvg(variant)}
      hudXml={getProfilePlanProBeastHudSvg(variant)}
      canvasW={PROFILE_PLAN_PRO_BEAST_CANVAS.width}
      canvasH={PROFILE_PLAN_PRO_BEAST_CANVAS.height}
      shouldAnimate={shouldAnimate}
      variantKey={variant}
    />
  );
}

/** Web `cosmos-*` 相当 */
function CosmosLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProCosmosBgVariant;
  shouldAnimate: boolean;
}) {
  return (
    <SvgSkinHudLayers
      width={width}
      skinXml={getProfilePlanProCosmosSkinSvg(variant)}
      hudXml={getProfilePlanProCosmosHudSvg(variant)}
      canvasW={PROFILE_PLAN_PRO_COSMOS_CANVAS.width}
      canvasH={PROFILE_PLAN_PRO_COSMOS_CANVAS.height}
      shouldAnimate={shouldAnimate}
      variantKey={variant}
    />
  );
}

/** Web `lab-*` 相当 */
function LabLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProLabBgVariant;
  shouldAnimate: boolean;
}) {
  return (
    <SvgSkinHudLayers
      width={width}
      skinXml={getProfilePlanProLabSkinSvg(variant)}
      hudXml={getProfilePlanProLabHudSvg(variant)}
      canvasW={PROFILE_PLAN_PRO_LAB_CANVAS.width}
      canvasH={PROFILE_PLAN_PRO_LAB_CANVAS.height}
      shouldAnimate={shouldAnimate}
      variantKey={variant}
    />
  );
}

/** Web `form-*` 相当 */
function FormLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProFormBgVariant;
  shouldAnimate: boolean;
}) {
  return (
    <SvgSkinHudLayers
      width={width}
      skinXml={getProfilePlanProFormSkinSvg(variant)}
      hudXml={getProfilePlanProFormHudSvg(variant)}
      canvasW={PROFILE_PLAN_PRO_FORM_CANVAS.width}
      canvasH={PROFILE_PLAN_PRO_FORM_CANVAS.height}
      shouldAnimate={shouldAnimate}
      variantKey={variant}
    />
  );
}

/** Web `futuristic-*` 相当 — RN SVG 背景コンポーネント */
function FuturisticLayers({
  width,
  height,
  variant,
}: {
  width: number;
  height: number;
  variant: ProfilePlanProFuturisticBgVariant;
}) {
  const artId = getProfilePlanProFuturisticArtId(variant);
  const props = { width, height };
  switch (artId) {
    case "eclipse":
      return <EclipseBackground {...props} />;
    case "data-stream":
      return <DataStreamBackground {...props} />;
    default:
      return <EclipseBackground {...props} />;
  }
}

/** Web `neo-*` 相当（フルブリード skin のみ） */
function NeoLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProNeoBgVariant;
  shouldAnimate: boolean;
}) {
  const emptyHud = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PROFILE_PLAN_PRO_NEO_CANVAS.width} ${PROFILE_PLAN_PRO_NEO_CANVAS.height}"></svg>`;
  return (
    <SvgSkinHudLayers
      width={width}
      skinXml={getProfilePlanProNeoSkinSvg(variant)}
      hudXml={emptyHud}
      canvasW={PROFILE_PLAN_PRO_NEO_CANVAS.width}
      canvasH={PROFILE_PLAN_PRO_NEO_CANVAS.height}
      shouldAnimate={shouldAnimate}
      variantKey={variant}
    />
  );
}

/** Web `scale-*` 相当 — 爬虫類鱗 + 微細 HUD（幅ロック） */
function ScaleLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProScaleBgVariant;
  shouldAnimate: boolean;
}) {
  const skin = getProfilePlanProScaleSkinItems(variant);
  const hud = getProfilePlanProScaleHudItems(variant);
  const enter = useSharedValue(shouldAnimate ? 0 : 1);
  const artH =
    width *
    (PROFILE_PLAN_PRO_SCALE_CANVAS.height / PROFILE_PLAN_PRO_SCALE_CANVAS.width);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(enter);
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withTiming(1, {
      duration: PROFILE_PLAN_PRO_BG.atmosEnterMs,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(enter);
  }, [enter, shouldAnimate, variant]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      {
        translateY:
          (1 - enter.value) * PROFILE_PLAN_PRO_BG.atmosEnterYOffsetPx,
      },
    ],
  }));

  const renderItems = (items: ProfilePlanProScaleDrawItem[], keyPrefix: string) =>
    items.map((item, i) => {
      const key = `${keyPrefix}-${i}`;
      if (item.t === "path") {
        return (
          <Path
            key={key}
            d={item.d}
            fill={item.fill}
            stroke={item.stroke}
            strokeWidth={item.strokeWidth}
          />
        );
      }
      if (item.t === "line") {
        return (
          <Line
            key={key}
            x1={item.x1}
            y1={item.y1}
            x2={item.x2}
            y2={item.y2}
            stroke={item.stroke}
            strokeWidth={item.strokeWidth}
          />
        );
      }
      return (
        <Circle
          key={key}
          cx={item.cx}
          cy={item.cy}
          r={item.r}
          fill={item.fill}
        />
      );
    });

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, width, height: artH },
        layerStyle,
      ]}
    >
      <Svg
        width={width}
        height={artH}
        viewBox={`0 0 ${PROFILE_PLAN_PRO_SCALE_CANVAS.width} ${PROFILE_PLAN_PRO_SCALE_CANVAS.height}`}
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        {renderItems(skin, "skin")}
        {renderItems(hud, "hud")}
      </Svg>
    </Animated.View>
  );
}

/** Web `atmos` 相当 — 図形だけ（幅ロック・入場は1回のみ） */
function AtmosLayers({
  width,
  accent,
  shouldAnimate,
  accentReady,
}: {
  width: number;
  accent: KinetikProfileAccentKey;
  shouldAnimate: boolean;
  accentReady: boolean;
}) {
  const cells = getProfilePlanProAtmosHexCells(accent);
  const enter = useSharedValue(0);
  const hasEnteredRef = useRef(false);
  const artH =
    width *
    (PROFILE_PLAN_PRO_ATMOS_CANVAS.height / PROFILE_PLAN_PRO_ATMOS_CANVAS.width);

  useEffect(() => {
    if (!accentReady) {
      cancelAnimation(enter);
      enter.value = 0;
      return;
    }

    if (!shouldAnimate) {
      cancelAnimation(enter);
      enter.value = 1;
      hasEnteredRef.current = true;
      return;
    }

    if (hasEnteredRef.current) {
      enter.value = 1;
      return;
    }

    hasEnteredRef.current = true;
    enter.value = 0;
    enter.value = withTiming(1, {
      duration: PROFILE_PLAN_PRO_BG.atmosEnterMs,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(enter);
  }, [accentReady, enter, shouldAnimate]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      {
        translateY:
          (1 - enter.value) * PROFILE_PLAN_PRO_BG.atmosEnterYOffsetPx,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: artH,
        },
        layerStyle,
      ]}
    >
      <Svg
        width={width}
        height={artH}
        viewBox={`0 0 ${PROFILE_PLAN_PRO_ATMOS_CANVAS.width} ${PROFILE_PLAN_PRO_ATMOS_CANVAS.height}`}
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        {cells.map((cell, i) => (
          <Path
            key={`atmos-${i}`}
            d={cell.d}
            fill="none"
            stroke={cell.stroke}
            strokeWidth={cell.strokeWidth}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

function HexLayoutLayers({
  width,
  variant,
  shouldAnimate,
}: {
  width: number;
  variant: ProfilePlanProHexBgVariant;
  shouldAnimate: boolean;
}) {
  const enter = useSharedValue(shouldAnimate ? 0 : 1);
  const layoutId = getProfilePlanProHexLayoutId(variant);
  const art = getProfilePlanProHexLayoutArt(layoutId);
  const artH =
    width * (PROFILE_PLAN_PRO_HEX_LAYOUT_H / PROFILE_PLAN_PRO_HEX_LAYOUT_W);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(enter);
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withTiming(1, {
      duration: PROFILE_PLAN_PRO_BG.atmosEnterMs,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(enter);
  }, [enter, shouldAnimate, layoutId]);

  const patternStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + enter.value * 0.68,
    transform: [
      {
        translateY:
          (1 - enter.value) * PROFILE_PLAN_PRO_BG.atmosEnterYOffsetPx,
      },
    ],
  }));

  return (
    <>
      <LinearGradient
        colors={["#050810", "#070d16", "#030508"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, width, height: artH },
          patternStyle,
        ]}
        pointerEvents="none"
      >
        <Svg
          width={width}
          height={artH}
          viewBox={`0 0 ${PROFILE_PLAN_PRO_HEX_LAYOUT_W} ${PROFILE_PLAN_PRO_HEX_LAYOUT_H}`}
          preserveAspectRatio="none"
        >
          {art.cells.map((cell, i) => (
            <Path
              key={`hex-${i}`}
              d={hexCellToPathD(cell)}
              fill="rgba(34,211,238,0.04)"
              stroke={cell.stroke.replace(",1)", `,${cell.opacity})`)}
              strokeWidth={1}
              opacity={0.85}
            />
          ))}
        </Svg>
      </Animated.View>
      <LinearGradient
        colors={["transparent", "rgba(2,4,8,0.4)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </>
  );
}

function GeoLayers({
  variant,
  shouldAnimate,
  height = 400,
}: {
  variant: ProfilePlanProBgVariant;
  shouldAnimate: boolean;
  height?: number;
}) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const patternId = `profile_plan_pro_geo_${sid}`;
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(phase);
      phase.value = 0.5;
      return;
    }
    phase.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    return () => cancelAnimation(phase);
  }, [phase, shouldAnimate]);

  const patternStyle = useAnimatedStyle(() => ({
    opacity: 0.38 + phase.value * 0.34,
    transform: [
      { translateX: (phase.value - 0.5) * 16 },
      { translateY: (phase.value - 0.5) * 10 },
    ],
  }));

  const stroke =
    variant === "geo-diamond" || variant === "geo-crosshatch"
      ? "rgba(167,139,250,0.14)"
      : "rgba(34,211,238,0.12)";
  const cell =
    variant === "geo-stipple" ? 20 : variant === "geo-hex" ? 28 : 22;

  return (
    <>
      <LinearGradient
        colors={["#050810", "#070d16", "#030508"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[StyleSheet.absoluteFillObject, patternStyle]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            {variant === "geo-stipple" ? (
              <Pattern
                id={patternId}
                width={cell}
                height={cell}
                patternUnits="userSpaceOnUse"
              >
                <Circle cx={4} cy={4} r={1.2} fill="rgba(34,211,238,0.35)" />
                <Circle cx={14} cy={14} r={1} fill="rgba(167,139,250,0.28)" />
              </Pattern>
            ) : variant === "geo-crosshatch" || variant === "geo-diamond" ? (
              <Pattern
                id={patternId}
                width={cell}
                height={cell}
                patternUnits="userSpaceOnUse"
              >
                <Line x1={0} y1={cell} x2={cell} y2={0} stroke={stroke} strokeWidth={1} />
                <Line x1={0} y1={0} x2={cell} y2={cell} stroke="rgba(34,211,238,0.1)" strokeWidth={1} />
              </Pattern>
            ) : (
              <Pattern
                id={patternId}
                width={cell}
                height={cell}
                patternUnits="userSpaceOnUse"
              >
                <Line x1={0} y1={0} x2={cell} y2={0} stroke={stroke} strokeWidth={1} />
                <Line x1={0} y1={0} x2={0} y2={cell} stroke={stroke} strokeWidth={1} />
                {variant === "geo-triangle" ? (
                  <Line x1={0} y1={cell} x2={cell} y2={0} stroke="rgba(79,247,244,0.08)" strokeWidth={1} />
                ) : null}
              </Pattern>
            )}
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={0.85} />
        </Svg>
      </Animated.View>
      <LinearGradient
        colors={["transparent", "rgba(2,4,8,0.75)"]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </>
  );
}

function NovaLayers({
  variant,
  height,
  shouldAnimate,
}: {
  variant: ProfilePlanProBgVariant;
  height: number;
  shouldAnimate: boolean;
}) {
  const phase = useSharedValue(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(phase);
      cancelAnimation(scan);
      phase.value = 0.5;
      scan.value = 0.35;
      return;
    }
    phase.value = withRepeat(
      withTiming(1, { duration: 8500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    scan.value = withRepeat(
      withTiming(1, { duration: 3800, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(phase);
      cancelAnimation(scan);
    };
  }, [phase, scan, shouldAnimate]);

  const blobA = useAnimatedStyle(() => ({
    opacity: 0.62 + phase.value * 0.38,
    transform: [{ scale: 0.92 + phase.value * 0.14 }],
  }));
  const blobB = useAnimatedStyle(() => ({
    opacity: 0.52 + (1 - phase.value) * 0.42,
    transform: [{ scale: 1.05 - phase.value * 0.1 }],
  }));
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -height * 0.6 + scan.value * height * 1.4 }],
    opacity: variant === "nova-scan" ? 0.75 + phase.value * 0.25 : 0,
  }));

  const palette = (() => {
    switch (variant) {
      case "nova-neural":
        return { a: "rgba(34,211,238,0.48)", b: "rgba(124,92,255,0.42)", c: "rgba(79,247,244,0.28)" };
      case "nova-scan":
        return { a: "rgba(6,182,212,0.38)", b: "rgba(34,211,238,0.32)", c: "rgba(14,116,144,0.22)" };
      case "nova-cascade":
        return { a: "rgba(8,145,178,0.42)", b: "rgba(99,102,241,0.38)", c: "rgba(34,211,238,0.26)" };
      case "nova-plasma":
        return { a: "rgba(240,171,252,0.5)", b: "rgba(124,58,237,0.45)", c: "rgba(34,211,238,0.32)" };
      case "nova-shockwave":
        return { a: "rgba(34,211,238,0.4)", b: "rgba(167,139,250,0.32)", c: "rgba(79,247,244,0.22)" };
      case "nova-facet":
        return { a: "rgba(34,211,238,0.38)", b: "rgba(236,72,153,0.32)", c: "rgba(167,139,250,0.28)" };
      case "nova-field":
        return { a: "rgba(103,232,249,0.42)", b: "rgba(34,211,238,0.34)", c: "rgba(124,92,255,0.24)" };
      case "nova-bloom":
        return { a: "rgba(34,211,238,0.48)", b: "rgba(192,132,252,0.42)", c: "rgba(79,247,244,0.28)" };
      default:
        return { a: "rgba(34,211,238,0.48)", b: "rgba(124,92,255,0.42)", c: "rgba(79,247,244,0.28)" };
    }
  })();

  return (
    <>
      <LinearGradient
        colors={["#050810", "#030508", "#020204"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.moodBlob, styles.moodBlobA, blobA]}>
        <LinearGradient colors={[palette.a, "transparent"]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <Animated.View style={[styles.moodBlob, styles.moodBlobB, blobB]}>
        <LinearGradient colors={[palette.b, "transparent"]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <View style={[styles.moodBlob, styles.moodBlobC]}>
        <LinearGradient colors={[palette.c, "transparent"]} style={StyleSheet.absoluteFillObject} />
      </View>
      {variant === "nova-scan" ? (
        <Animated.View style={[styles.novaScanBeam, scanStyle]} pointerEvents="none">
          <LinearGradient
            colors={["transparent", "rgba(34,211,238,0.55)", "rgba(236,254,255,0.85)", "rgba(34,211,238,0.55)", "transparent"]}
            locations={[0, 0.42, 0.5, 0.58, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
    </>
  );
}

/** PRO プロフィールカード背景 — Web バリエーション対応 */
export default function ProfilePlanProBackgroundNative({
  width,
  height,
  animate = true,
  variant = PROFILE_PLAN_PRO_BG_DEFAULT,
  profileAccent = "default",
  accentReady = true,
}: Props) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && reduceMotion !== true;

  if (width <= 0 || height <= 0) return null;

  const isDepth = isProfilePlanProDepthVariant(variant);
  const isMood = isProfilePlanProMoodBgVariant(variant);
  const isNova = isProfilePlanProNovaBgVariant(variant);
  const isScale = isProfilePlanProScaleBgVariant(variant);
  const isBeast = isProfilePlanProBeastBgVariant(variant);
  const isCosmos = isProfilePlanProCosmosBgVariant(variant);
  const isLab = isProfilePlanProLabBgVariant(variant);
  const isForm = isProfilePlanProFormBgVariant(variant);
  const isNeo = isProfilePlanProNeoBgVariant(variant);
  const isFuturistic = isProfilePlanProFuturisticBgVariant(variant);
  const isHexLayout = isProfilePlanProHexBgVariant(variant);
  const isGeo = isProfilePlanProGeoBgVariant(variant) && !isHexLayout;
  const useTunnel =
    variant === "tunnel" ||
    variant === "hex-depth" ||
    variant === "isometric" ||
    variant === "circuit";
  const useParallax =
    variant === "parallax" ||
    variant === "light-shaft" ||
    variant === "stack" ||
    variant === "topography";
  const useDepthField = variant === "depth-field" || variant === "starfield";
  const useSonar =
    variant === "sonar" ||
    variant === "orbit" ||
    variant === "wormhole" ||
    variant === "wire-cage";

  if (variant === "atmos") {
    if (!accentReady) return null;

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AtmosLayers
          width={width}
          accent={profileAccent}
          shouldAnimate={shouldAnimate}
          accentReady={accentReady}
        />
      </View>
    );
  }

  if (isScale) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <ScaleLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isBeast) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <BeastLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isCosmos) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <CosmosLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isLab) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LabLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isForm) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <FormLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isNeo) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <NeoLayers
          width={width}
          variant={variant}
          shouldAnimate={shouldAnimate}
        />
      </View>
    );
  }

  if (isFuturistic) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <FuturisticLayers width={width} height={height} variant={variant} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {isMood ? <MoodLayers variant={variant} shouldAnimate={shouldAnimate} /> : null}
      {isHexLayout ? (
        <HexLayoutLayers
          width={width}
          variant={variant as ProfilePlanProHexBgVariant}
          shouldAnimate={shouldAnimate}
        />
      ) : null}
      {isGeo ? (
        <GeoLayers variant={variant} shouldAnimate={shouldAnimate} height={height} />
      ) : null}
      {isNova ? (
        <NovaLayers variant={variant} height={height} shouldAnimate={shouldAnimate} />
      ) : null}
      {useTunnel ? <TunnelLayers shouldAnimate={shouldAnimate} /> : null}
      {useParallax ? <ParallaxLayers shouldAnimate={shouldAnimate} /> : null}
      {useDepthField ? <DepthFieldLayers shouldAnimate={shouldAnimate} /> : null}
      {useSonar ? <SonarLayers shouldAnimate={shouldAnimate} variant={variant} /> : null}
      {(!isDepth && !isMood && !isNova && !isGeo && !isHexLayout) || variant === "cloud-volume" ? (
        <AuroraLayers shouldAnimate={shouldAnimate} />
      ) : null}

      <LinearGradient
        colors={
          useTunnel
            ? ["transparent", "rgba(2,4,8,0.15)", "rgba(2,4,8,0.78)"]
            : variant === "wormhole"
              ? ["transparent", "rgba(2,4,8,0.2)", "rgba(2,4,8,0.82)"]
              : ["transparent", "rgba(3,8,13,0.42)"]
        }
        locations={useTunnel ? [0, 0.35, 1] : [0, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  auroraCyan: {
    position: "absolute",
    top: "-14%",
    left: "-8%",
    width: "82%",
    height: "66%",
    borderRadius: 9999,
    overflow: "hidden",
  },
  auroraPurple: {
    position: "absolute",
    right: "-10%",
    bottom: "-16%",
    width: "76%",
    height: "62%",
    borderRadius: 9999,
    overflow: "hidden",
  },
  layerFar: {
    position: "absolute",
    top: "-22%",
    left: "-18%",
    width: "95%",
    height: "72%",
    borderRadius: 9999,
    overflow: "hidden",
  },
  layerMid: {
    position: "absolute",
    top: "18%",
    right: "-22%",
    width: "72%",
    height: "58%",
    borderRadius: 9999,
    overflow: "hidden",
  },
  layerNear: {
    position: "absolute",
    bottom: "-8%",
    left: "8%",
    width: "48%",
    height: "38%",
    borderRadius: 9999,
    overflow: "hidden",
  },
  tunnelWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  tunnelGrid: {
    position: "absolute",
    bottom: "-6%",
    left: "-28%",
    right: "-28%",
    height: "78%",
    transform: [{ perspective: 240 }, { rotateX: "68deg" }],
  },
  tunnelLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(34,211,238,0.52)",
  },
  tunnelLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(34,211,238,0.34)",
  },
  dotFar: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.45)",
  },
  dotMid: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(124,92,255,0.6)",
  },
  dotNear: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(79,247,244,0.85)",
    shadowColor: "#4ff7f4",
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  sonarRing: {
    position: "absolute",
    left: "50%",
    top: "52%",
    marginLeft: "-50%",
    marginTop: "-50%",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
    borderRadius: 9999,
  },
  sonarSweep: {
    position: "absolute",
    left: "50%",
    top: "52%",
    width: "140%",
    height: "140%",
    marginLeft: "-70%",
    marginTop: "-70%",
    borderRadius: 9999,
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  orbitA: {
    position: "absolute",
    left: "50%",
    top: "48%",
    width: "110%",
    height: "38%",
    marginLeft: "-55%",
    marginTop: "-19%",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    borderRadius: 9999,
  },
  orbitB: {
    position: "absolute",
    left: "50%",
    top: "48%",
    width: "56%",
    height: "18%",
    marginLeft: "-28%",
    marginTop: "-9%",
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.32)",
    borderRadius: 9999,
    opacity: 0.7,
  },
  wormholeCore: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "18%",
    height: "18%",
    marginLeft: "-9%",
    marginTop: "-9%",
    borderRadius: 9999,
    backgroundColor: "rgba(79,247,244,0.45)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  moodBlob: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  moodBlobA: {
    top: "-14%",
    left: "-8%",
    width: "82%",
    height: "66%",
  },
  moodBlobB: {
    top: "22%",
    right: "-14%",
    width: "72%",
    height: "56%",
  },
  moodBlobC: {
    bottom: "-18%",
    left: "6%",
    width: "78%",
    height: "52%",
  },
  novaScanBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "22%",
  },
});
