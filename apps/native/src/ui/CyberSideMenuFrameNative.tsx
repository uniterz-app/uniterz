import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import { useId } from "react";
import { CYBER_TAB_CYAN } from "./cyberSideMenuNative";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "../features/profile/profileShellGridNative";

const CORNER = {
  position: "absolute" as const,
  width: 12,
  height: 12,
  borderColor: "rgba(103, 232, 249, 0.7)",
  pointerEvents: "none" as const,
};

/** Web `CyberSideMenuFrame` — 角ブラケット・グリッド・走査線 */
export default function CyberSideMenuFrameNative() {
  const gridPatternId = useId().replace(/[^a-zA-Z0-9_]/g, "_");

  return (
    <>
      <View style={styles.innerRing} pointerEvents="none" />

      <View style={[CORNER, styles.cornerTL]} pointerEvents="none" />
      <View style={[CORNER, styles.cornerTR]} pointerEvents="none" />
      <View style={[CORNER, styles.cornerBL]} pointerEvents="none" />
      <View style={[CORNER, styles.cornerBR]} pointerEvents="none" />

      <View style={styles.railLeft} pointerEvents="none" />
      <View style={styles.railRight} pointerEvents="none" />
      <View style={styles.beamBottom} pointerEvents="none" />
      <View style={styles.beamTop} pointerEvents="none" />

      <Svg width="100%" height="100%" style={styles.grid} pointerEvents="none">
        <Defs>
          <Pattern
            id={`cyber_side_menu_grid_${gridPatternId}`}
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <SvgPath
              d={profileShellGridPathD(20)}
              fill="none"
              stroke="rgba(0, 245, 255, 0.055)"
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#cyber_side_menu_grid_${gridPatternId})`} />
      </Svg>

      <View style={styles.scanlines} pointerEvents="none" />

      <LinearGradient
        colors={["rgba(0, 245, 255, 0.08)", "transparent"]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <View style={styles.topBeam} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  innerRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.1)",
  },
  cornerTL: {
    left: 8,
    top: 8,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  cornerTR: {
    right: 8,
    top: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
  },
  cornerBL: {
    left: 8,
    bottom: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
  },
  cornerBR: {
    right: 8,
    bottom: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  railLeft: {
    position: "absolute",
    left: 4,
    top: 28,
    width: 1,
    height: 48,
    backgroundColor: "rgba(0, 245, 255, 0.35)",
  },
  railRight: {
    position: "absolute",
    right: 4,
    top: 28,
    width: 1,
    height: 48,
    backgroundColor: "rgba(0, 245, 255, 0.35)",
  },
  beamBottom: {
    position: "absolute",
    bottom: 4,
    left: 36,
    width: 48,
    height: 1,
    backgroundColor: "rgba(0, 245, 255, 0.4)",
  },
  beamTop: {
    position: "absolute",
    top: 4,
    right: 36,
    width: 48,
    height: 1,
    backgroundColor: "rgba(0, 245, 255, 0.4)",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    backgroundColor: "transparent",
    // subtle horizontal banding via semi-transparent overlay stripes
    borderTopWidth: 0,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
  topBeam: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 0,
    height: 1,
    backgroundColor: CYBER_TAB_CYAN,
    opacity: 0.55,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
});
