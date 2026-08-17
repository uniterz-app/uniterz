/**
 * Web `RankingListProSkinFx` 相当 — ランキング行用 Pro Skin（cover + wash）
 */
import { useMemo, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import {
  getProfilePlanProAtmosHexSvg,
  getProfilePlanProAtmosHudSvg,
  PROFILE_PLAN_PRO_ATMOS_CANVAS,
} from "../../../../../lib/profile/profilePlanProAtmosBg";
import {
  getProfilePlanProBeastHudSvg,
  getProfilePlanProBeastSkinSvg,
  PROFILE_PLAN_PRO_BEAST_CANVAS,
} from "../../../../../lib/profile/profilePlanProBeastPattern";
import { isProfilePlanProBeastBgVariant } from "../../../../../lib/profile/profilePlanProBeastBgVariants";
import {
  getProfilePlanProFormHudSvg,
  getProfilePlanProFormSkinSvg,
  PROFILE_PLAN_PRO_FORM_CANVAS,
} from "../../../../../lib/profile/profilePlanProFormPattern";
import { isProfilePlanProFormBgVariant } from "../../../../../lib/profile/profilePlanProFormBgVariants";
import {
  getProfilePlanProScaleHudSvg,
  getProfilePlanProScaleSkinSvg,
  PROFILE_PLAN_PRO_SCALE_CANVAS,
} from "../../../../../lib/profile/profilePlanProScalePattern";
import { isProfilePlanProScaleBgVariant } from "../../../../../lib/profile/profilePlanProScaleBgVariants";
import {
  getProfilePlanProWaveHudSvg,
  getProfilePlanProWaveSkinSvg,
  PROFILE_PLAN_PRO_WAVE_CANVAS,
} from "../../../../../lib/profile/profilePlanProWavePattern";
import { isProfilePlanProWaveBgVariant } from "../../../../../lib/profile/profilePlanProWaveBgVariants";
import { UNITERZ_LOGO_ASSET } from "../../../../../lib/units/uniterzLogoAsset";
import { RANKING_UNITERZ_LOGO_SCATTER } from "../../../../../lib/profile/profilePlanProUniterzLogoScatter";

const UNITERZ_LOGO_PNG = require("../../../assets/brand/uniterz-logo.png");

export type RankingListProSkinIntensity = "subtle" | "medium";

type Props = {
  variant: ProfilePlanProBgVariant;
  intensity?: RankingListProSkinIntensity;
};

type CoverFocus = { x: number; y: number };

function CoverSvgLayer({
  xml,
  canvasW,
  canvasH,
  width,
  height,
  opacity,
  focus,
}: {
  xml: string;
  canvasW: number;
  canvasH: number;
  width: number;
  height: number;
  opacity: number;
  focus: CoverFocus;
}) {
  if (width <= 0 || height <= 0 || !xml) return null;
  const scale = Math.max(width / canvasW, height / canvasH);
  const drawW = canvasW * scale;
  const drawH = canvasH * scale;
  const left = (width - drawW) * focus.x;
  const top = (height - drawH) * focus.y;
  return (
    <View
      pointerEvents="none"
      style={[styles.layer, { opacity, left, top, width: drawW, height: drawH }]}
    >
      <SvgXml
        xml={xml}
        width={drawW}
        height={drawH}
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        preserveAspectRatio="none"
      />
    </View>
  );
}

function Wash({ intensity }: { intensity: RankingListProSkinIntensity }) {
  const colors =
    intensity === "medium"
      ? ([
          "rgba(5,10,16,0.58)",
          "rgba(5,10,16,0.32)",
          "rgba(5,10,16,0.14)",
        ] as const)
      : ([
          "rgba(5,10,16,0.8)",
          "rgba(5,10,16,0.58)",
          "rgba(5,10,16,0.4)",
        ] as const);
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...colors]}
      locations={[0, intensity === "medium" ? 0.5 : 0.48, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

function SkinHudPair({
  skinXml,
  hudXml,
  canvasW,
  canvasH,
  width,
  height,
  intensity,
  focus,
  skinOpacityBoost = 0,
}: {
  skinXml: string;
  hudXml: string;
  canvasW: number;
  canvasH: number;
  width: number;
  height: number;
  intensity: RankingListProSkinIntensity;
  focus: CoverFocus;
  skinOpacityBoost?: number;
}) {
  const skinOp =
    (intensity === "medium" ? 0.9 : 0.58) + skinOpacityBoost;
  const hudOp = intensity === "medium" ? 0.42 : 0.32;
  return (
    <>
      <CoverSvgLayer
        xml={skinXml}
        canvasW={canvasW}
        canvasH={canvasH}
        width={width}
        height={height}
        opacity={Math.min(1, skinOp)}
        focus={focus}
      />
      <CoverSvgLayer
        xml={hudXml}
        canvasW={canvasW}
        canvasH={canvasH}
        width={width}
        height={height}
        opacity={hudOp}
        focus={{ x: Math.min(1, focus.x + 0.06), y: Math.max(0, focus.y - 0.05) }}
      />
      <Wash intensity={intensity} />
    </>
  );
}

/** Web `RankingListProSkinFx` 相当 */
export default function RankingListProSkinFxNative({
  variant,
  intensity = "medium",
}: Props) {
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setSize({ w: width, h: height });
  };

  const layers = useMemo(() => {
    if (w <= 0 || h <= 0) return null;

    if (isProfilePlanProScaleBgVariant(variant)) {
      return (
        <SkinHudPair
          skinXml={getProfilePlanProScaleSkinSvg(variant)}
          hudXml={getProfilePlanProScaleHudSvg(variant)}
          canvasW={PROFILE_PLAN_PRO_SCALE_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_SCALE_CANVAS.height}
          width={w}
          height={h}
          intensity={intensity}
          focus={{ x: 0.68, y: 0.38 }}
        />
      );
    }

    if (isProfilePlanProBeastBgVariant(variant)) {
      const kintsugiBoost = variant === "beast-kintsugi" ? 0.08 : 0.05;
      return (
        <SkinHudPair
          skinXml={getProfilePlanProBeastSkinSvg(variant)}
          hudXml={getProfilePlanProBeastHudSvg(variant)}
          canvasW={PROFILE_PLAN_PRO_BEAST_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_BEAST_CANVAS.height}
          width={w}
          height={h}
          intensity={intensity}
          focus={{ x: 0.7, y: 0.42 }}
          skinOpacityBoost={
            intensity === "medium"
              ? kintsugiBoost
              : variant === "beast-facet"
                ? 0.18
                : 0
          }
        />
      );
    }

    if (isProfilePlanProFormBgVariant(variant)) {
      return (
        <SkinHudPair
          skinXml={getProfilePlanProFormSkinSvg(variant)}
          hudXml={getProfilePlanProFormHudSvg(variant)}
          canvasW={PROFILE_PLAN_PRO_FORM_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_FORM_CANVAS.height}
          width={w}
          height={h}
          intensity={intensity}
          focus={{ x: 0.65, y: 0.4 }}
          skinOpacityBoost={variant === "form-isocubes" ? 0.08 : 0}
        />
      );
    }

    if (isProfilePlanProWaveBgVariant(variant)) {
      const softWave =
        variant === "wave-gold-monogram" || variant === "wave-ember-hex";
      if (variant === "wave-uniterz-logo") {
        const intensityScale = intensity === "medium" ? 1 : 0.78;
        return (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={["#000000", "#050b10", "#000408"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}
            >
              {RANKING_UNITERZ_LOGO_SCATTER.map((mark) => {
                const markW = w * mark.widthPct;
                const markH = markW / UNITERZ_LOGO_ASSET.aspectRatio;
                return (
                  <Image
                    key={mark.id}
                    source={UNITERZ_LOGO_PNG}
                    blurRadius={mark.blurPx}
                    style={{
                      position: "absolute",
                      width: markW,
                      height: markH,
                      left: w * mark.cxPct - markW / 2,
                      top: h * mark.cyPct - markH / 2,
                      opacity: mark.opacity * intensityScale,
                      transform: [{ rotate: `${mark.rotateDeg}deg` }],
                    }}
                    resizeMode="contain"
                  />
                );
              })}
            </View>
            <CoverSvgLayer
              xml={getProfilePlanProWaveHudSvg(variant)}
              canvasW={PROFILE_PLAN_PRO_WAVE_CANVAS.width}
              canvasH={PROFILE_PLAN_PRO_WAVE_CANVAS.height}
              width={w}
              height={h}
              opacity={intensity === "medium" ? 0.42 : 0.32}
              focus={{ x: 0.78, y: 0.4 }}
            />
            <Wash intensity={intensity} />
          </>
        );
      }
      return (
        <SkinHudPair
          skinXml={getProfilePlanProWaveSkinSvg(variant)}
          hudXml={getProfilePlanProWaveHudSvg(variant)}
          canvasW={PROFILE_PLAN_PRO_WAVE_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_WAVE_CANVAS.height}
          width={w}
          height={h}
          intensity={intensity}
          focus={{ x: 0.7, y: 0.42 }}
          skinOpacityBoost={softWave ? -0.08 : -0.02}
        />
      );
    }

    return (
      <>
        <CoverSvgLayer
          xml={getProfilePlanProAtmosHexSvg("default")}
          canvasW={PROFILE_PLAN_PRO_ATMOS_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_ATMOS_CANVAS.height}
          width={w}
          height={h}
          opacity={intensity === "medium" ? 0.9 : 0.58}
          focus={{ x: 0.72, y: 0.45 }}
        />
        <CoverSvgLayer
          xml={getProfilePlanProAtmosHudSvg("default")}
          canvasW={PROFILE_PLAN_PRO_ATMOS_CANVAS.width}
          canvasH={PROFILE_PLAN_PRO_ATMOS_CANVAS.height}
          width={w}
          height={h}
          opacity={0.28}
          focus={{ x: 0.78, y: 0.4 }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={
            variant === "parallax"
              ? (["transparent", "transparent", "rgba(99,102,241,0.14)"] as const)
              : (["transparent", "transparent", "rgba(34,211,238,0.12)"] as const)
          }
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Wash intensity={intensity} />
      </>
    );
  }, [variant, intensity, w, h]);

  return (
    <View pointerEvents="none" style={styles.root} onLayout={onLayout}>
      {layers}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  layer: {
    position: "absolute",
  },
});
