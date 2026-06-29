/** Web `WcBracketTreeBackground` 相当 */
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { WC_TREE_HUD_HEADER_H } from "@/lib/wc/wc-bracket-tree-layout";
import { fonts } from "../../../../theme/tokens";

export default function WcBracketTreeBackgroundNative() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[
          "#03343f",
          "#044a52",
          "#055a5e",
          "#0d6b42",
          "#3f7f0f",
          "#6faa12",
          "#84cc16",
        ]}
        locations={[0, 0.14, 0.32, 0.58, 0.78, 0.92, 1]}
        style={styles.base}
      />

      <View style={[styles.mist, styles.mistTop]} />
      <View style={[styles.mist, styles.mistCore]} />
      <View style={[styles.mist, styles.mistBottom]} />

      <View style={styles.vignette} />

      <Svg
        style={styles.arcs}
        viewBox="0 0 600 780"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <SvgLinearGradient id="wcTreeArcCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <Stop offset="22%" stopColor="rgba(103,232,249,0.92)" />
            <Stop offset="50%" stopColor="rgba(165,243,252,1)" />
            <Stop offset="78%" stopColor="rgba(103,232,249,0.92)" />
            <Stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </SvgLinearGradient>
          <SvgLinearGradient id="wcTreeArcGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(132,204,22,0)" />
            <Stop offset="22%" stopColor="rgba(163,230,53,0.88)" />
            <Stop offset="50%" stopColor="rgba(190,242,100,1)" />
            <Stop offset="78%" stopColor="rgba(132,204,22,0.88)" />
            <Stop offset="100%" stopColor="rgba(132,204,22,0)" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M 118 248 A 182 182 0 0 1 482 248"
          fill="none"
          stroke="url(#wcTreeArcCyan)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.72}
        />
        <Path
          d="M 132 532 A 168 168 0 0 0 468 532"
          fill="none"
          stroke="url(#wcTreeArcGreen)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.78}
        />
      </Svg>

      <View style={styles.topBar}>
        <View style={styles.topLine} />
        <Text style={styles.title}>KNOCKOUT STAGE</Text>
        <View style={styles.topLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  base: {
    ...StyleSheet.absoluteFillObject,
  },
  mist: {
    position: "absolute",
    pointerEvents: "none",
  },
  mistTop: {
    top: "-8%",
    left: "50%",
    width: "115%",
    height: "42%",
    marginLeft: "-57.5%",
    backgroundColor: "rgba(165,243,252,0.18)",
    borderRadius: 999,
    opacity: 0.85,
  },
  mistCore: {
    top: "28%",
    left: "50%",
    width: "108%",
    height: "52%",
    marginLeft: "-54%",
    marginTop: "-26%",
    backgroundColor: "rgba(217,249,157,0.35)",
    borderRadius: 999,
    opacity: 0.72,
  },
  mistBottom: {
    bottom: "-14%",
    left: "50%",
    width: "120%",
    height: "48%",
    marginLeft: "-60%",
    backgroundColor: "rgba(190,242,100,0.28)",
    borderRadius: 999,
    opacity: 0.8,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,20,22,0.28)",
  },
  arcs: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: WC_TREE_HUD_HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 18,
    zIndex: 15,
  },
  topLine: {
    flex: 1,
    maxWidth: 108,
    height: 1,
    backgroundColor: "rgba(165,243,252,0.55)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: "rgba(236,254,255,0.92)",
    fontFamily: fonts.metric,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    textShadowColor: "rgba(103,232,249,0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
