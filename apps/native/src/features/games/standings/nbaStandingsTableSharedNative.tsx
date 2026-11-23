/** STANDINGS / CUP 共通 — セクション見出し・指標列の破線 */
import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const DASH_TICKS = [0, 1, 2, 3, 4, 5, 6, 7];

export function StandingsSectionHeadNative({ label }: { label: string }) {
  return (
    <View style={styles.sectionHead}>
      <CyberLine side="left" />
      <Text style={styles.sectionLabel}>{label}</Text>
      <CyberLine side="right" />
    </View>
  );
}

function CyberLine({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <View
      pointerEvents="none"
      style={[styles.cyberLine, isLeft ? null : styles.cyberLineReverse]}
    >
      <LinearGradient
        colors={["rgba(0,245,255,0)", "rgba(0,245,255,0.7)"]}
        start={{ x: isLeft ? 0 : 1, y: 0 }}
        end={{ x: isLeft ? 1 : 0, y: 0 }}
        style={styles.cyberLineRule}
      />
      <View style={styles.cyberTickSmall} />
      <View style={styles.cyberTick} />
    </View>
  );
}

export function StandingsMetricColNative({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  return (
    <View style={[styles.metricCol, { width }]}>
      <View pointerEvents="none" style={styles.vDash}>
        {DASH_TICKS.map((i) => (
          <View key={i} style={styles.vDashTick} />
        ))}
      </View>
      {children}
    </View>
  );
}

export function standingsTeamWash(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 5,
    paddingLeft: 5,
    textTransform: "uppercase",
    includeFontPadding: false,
    textShadowColor: "rgba(0,245,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    transform: [{ skewX: "-10deg" }],
  },
  cyberLine: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cyberLineReverse: { flexDirection: "row-reverse" },
  cyberLineRule: { flex: 1, height: 1 },
  cyberTickSmall: {
    width: 2,
    height: 7,
    backgroundColor: "rgba(0,245,255,0.6)",
    transform: [{ skewX: "-14deg" }],
  },
  cyberTick: {
    width: 3,
    height: 11,
    backgroundColor: CYBER_TAB_CYAN,
    transform: [{ skewX: "-14deg" }],
  },
  metricCol: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vDash: {
    position: "absolute",
    left: 0,
    top: 5,
    bottom: 5,
    width: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  vDashTick: {
    width: 1,
    height: 3,
    backgroundColor: "rgba(0,245,255,0.28)",
  },
});
