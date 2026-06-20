import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import {
  getWcPredictedLineup,
  getWcResolvedLineup,
  hasWcSquadData,
} from "../../../../../../lib/wc/squads";
import type { WcSquadPlayer } from "../../../../../../lib/wc/squadTypes";
import type { GamesTexts } from "../gamesI18n";

type Props = {
  teamId: string;
  t: GamesTexts;
};

const CYBER = {
  line: "rgba(92, 248, 255, 0.95)",
  lineGlow: "rgba(48, 220, 255, 0.72)",
  grid: "rgba(72, 210, 255, 0.14)",
  gridFine: "rgba(72, 210, 255, 0.07)",
  base: "#010c18",
  stripeDark: "#021424",
  stripeLight: "#0c2d4f",
} as const;

type LabelLayout = {
  above: boolean;
  align: "start" | "center" | "end";
  offsetX: number;
  offsetY: number;
};

const POS_MARKER: Record<
  WcSquadPlayer["pos"],
  { fill: string; glow: string; ring: string }
> = {
  GK: {
    fill: "#e8fdff",
    glow: "rgba(200, 245, 255, 0.85)",
    ring: "rgba(180, 240, 255, 0.9)",
  },
  DF: {
    fill: "#36e6ff",
    glow: "rgba(54, 230, 255, 0.75)",
    ring: "rgba(120, 240, 255, 0.85)",
  },
  MF: {
    fill: "#7c8cff",
    glow: "rgba(124, 140, 255, 0.7)",
    ring: "rgba(160, 170, 255, 0.8)",
  },
  FW: {
    fill: "#ff9f2f",
    glow: "rgba(255, 159, 47, 0.75)",
    ring: "rgba(255, 190, 100, 0.85)",
  },
};

function buildLabelLayouts(
  players: Array<{
    id: string;
    pos: WcSquadPlayer["pos"];
    left: number;
    top: number;
  }>
): Map<string, LabelLayout> {
  const layouts = new Map<string, LabelLayout>();

  for (const player of players) {
    if (player.pos === "GK") {
      layouts.set(player.id, {
        above: false,
        align: "center",
        offsetX: 0,
        offsetY: 0,
      });
      continue;
    }

    let align: LabelLayout["align"] = "center";
    if (player.left < 15) align = "start";
    else if (player.left > 85) align = "end";

    let above = true;
    if (player.top < 18) above = false;

    layouts.set(player.id, { above, align, offsetX: 0, offsetY: 0 });
  }

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]!;
      const b = players[j]!;
      if (a.pos === "GK" || b.pos === "GK") continue;
      const dLeft = Math.abs(a.left - b.left);
      const dTop = Math.abs(a.top - b.top);
      if (dLeft >= 10 || dTop >= 15) continue;

      const la = { ...layouts.get(a.id)! };
      const lb = { ...layouts.get(b.id)! };

      if (dLeft < 6) {
        la.above = true;
        lb.above = false;
        la.offsetY = -2;
        lb.offsetY = 2;
      } else if (a.left < b.left) {
        la.offsetX = -6;
        lb.offsetX = 6;
      } else {
        la.offsetX = 6;
        lb.offsetX = -6;
      }

      layouts.set(a.id, la);
      layouts.set(b.id, lb);
    }
  }

  return layouts;
}

function toHorizontalCoords(
  x: number,
  y: number,
  pos?: WcSquadPlayer["pos"]
) {
  if (pos === "GK") {
    return { left: 11.5, top: 50 };
  }
  const left = 13 + ((90 - y) / 70) * 78;
  const top = 8 + (x / 100) * 84;
  return { left, top };
}

function formatPlayerLabel(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? full;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${first.charAt(0).toUpperCase()}.${last}`;
}

function PitchSurfaceNative() {
  return (
    <>
      <View style={styles.pitchBase} />
      <View style={styles.pitchStripesWrap} pointerEvents="none">
        {Array.from({ length: 8 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.pitchStripe,
              {
                left: `${i * 12.5}%`,
                backgroundColor: i % 2 === 0 ? CYBER.stripeDark : CYBER.stripeLight,
              },
            ]}
          />
        ))}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(48,220,255,0.05)",
          "rgba(48,220,255,0)",
          "rgba(48,220,255,0)",
          "rgba(1,10,22,0.5)",
        ]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(48,220,255,0.14)", "rgba(48,220,255,0)"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.pitchRadialGlow}
      />
    </>
  );
}
function PitchMarkingsSvg() {
  const stroke = CYBER.line;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 62.5"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Rect
        x="4"
        y="2.5"
        width="92"
        height="57.5"
        stroke={stroke}
        strokeWidth="0.35"
        fill="none"
        rx="0.5"
      />
      <Line x1="50" y1="2.5" x2="50" y2="60" stroke={stroke} strokeWidth="0.3" />
      <Circle cx="50" cy="31.25" r="6.875" stroke={stroke} strokeWidth="0.3" fill="none" />
      <Circle cx="50" cy="31.25" r="0.45" fill={stroke} />
      <Rect x="4" y="13.75" width="9.375" height="35" stroke={stroke} strokeWidth="0.3" fill="none" />
      <Rect x="4" y="20" width="3.75" height="22.5" stroke={stroke} strokeWidth="0.3" fill="none" />
      <Rect x="86.625" y="13.75" width="9.375" height="35" stroke={stroke} strokeWidth="0.3" fill="none" />
      <Rect x="92.25" y="20" width="3.75" height="22.5" stroke={stroke} strokeWidth="0.3" fill="none" />
    </Svg>
  );
}

function PlayerMarkerNative({
  player,
  labelLayout,
}: {
  player: WcSquadPlayer & { x: number; y: number };
  labelLayout: LabelLayout;
}) {
  const label = formatPlayerLabel(player.name);
  const { left, top } = toHorizontalCoords(player.x, player.y, player.pos);
  const colors = POS_MARKER[player.pos];
  const dotSize = 12;

  const labelAlign =
    labelLayout.align === "start"
      ? "flex-start"
      : labelLayout.align === "end"
        ? "flex-end"
        : "center";
  const textAlign =
    labelLayout.align === "start"
      ? "left"
      : labelLayout.align === "end"
        ? "right"
        : "center";

  return (
    <View
      style={[
        styles.marker,
        { left: `${left}%`, top: `${top}%` },
      ]}
      accessibilityLabel={player.name}
    >
      <View
        style={[
          styles.markerColumn,
          labelLayout.above ? styles.markerColumnAbove : styles.markerColumnBelow,
          { alignItems: labelAlign },
        ]}
      >
        <View style={[styles.dotWrap, { width: dotSize, height: dotSize }]}>
          <View
            style={[
              styles.dotGlow,
              {
                backgroundColor: colors.glow,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                backgroundColor: colors.fill,
                borderColor: colors.ring,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.markerLabel,
            {
              textAlign,
              transform: [
                { translateX: labelLayout.offsetX },
                { translateY: labelLayout.offsetY },
              ],
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/** Web `WcFormationPanel` 相当（モバイル） */
export default function WcFormationPanelNative({ teamId, t }: Props) {
  const lineup = useMemo(() => {
    if (!hasWcSquadData(teamId)) return null;
    return getWcResolvedLineup(teamId);
  }, [teamId]);

  const predicted = useMemo(() => getWcPredictedLineup(teamId), [teamId]);

  const labelLayouts = useMemo(() => {
    if (!lineup?.length) return null;
    return buildLabelLayouts(
      lineup.map((player) => ({
        id: player.id,
        pos: player.pos,
        ...toHorizontalCoords(player.x, player.y, player.pos),
      }))
    );
  }, [lineup]);

  if (!lineup?.length || !predicted || !labelLayouts) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerKicker}>{t.predictedLineup}</Text>
        <Text style={styles.headerFormation}>{predicted.formation}</Text>
      </View>

      <View style={styles.pitchFrame}>
        <View style={styles.pitch}>
          <PitchSurfaceNative />
          <PitchMarkingsSvg />
          {lineup.map((player) => (
            <PlayerMarkerNative
              key={player.id}
              player={player}
              labelLayout={labelLayouts.get(player.id)!}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 12,
    gap: 10,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  headerKicker: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  headerFormation: {
    color: "rgba(103,232,249,0.85)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  pitchFrame: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "rgba(48,220,255,0.18)",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  pitch: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: CYBER.base,
    overflow: "hidden",
  },
  pitchBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CYBER.base,
  },
  pitchStripesWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  pitchStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "12.5%",
  },
  pitchRadialGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  marker: {
    position: "absolute",
    zIndex: 10,
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    alignItems: "center",
  },
  markerColumn: {
    gap: 2,
    maxWidth: 68,
  },
  markerColumnAbove: {
    flexDirection: "column-reverse",
  },
  markerColumnBelow: {
    flexDirection: "column",
  },
  dotWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dotGlow: {
    position: "absolute",
    opacity: 0.4,
  },
  dot: {
    borderWidth: 1,
  },
  markerLabel: {
    maxWidth: 68,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    borderRadius: 4,
    backgroundColor: "rgba(3,11,24,0.92)",
    color: "rgba(207,250,254,0.9)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
