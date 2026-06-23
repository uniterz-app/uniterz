import { useMemo, useState, type ReactNode } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
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

/** Web `WcFormationPanel` CYBER と同一 */
const CYBER = {
  line: "rgba(92, 248, 255, 0.95)",
  lineGlow: "rgba(48, 220, 255, 0.72)",
  grid: "rgba(72, 210, 255, 0.14)",
  gridFine: "rgba(72, 210, 255, 0.07)",
  base: "#010c18",
  stripeDark: "#021424",
  stripeLight: "#0c2d4f",
  circuit: "rgba(56, 200, 255, 0.22)",
  circuitNode: "rgba(100, 240, 255, 0.45)",
} as const;

const PITCH_W = 100;
const PITCH_H = 62.5;

type LabelLayout = {
  above: boolean;
  align: "start" | "center" | "end";
  offsetX: number;
  offsetY: number;
};

type PitchSize = { width: number; height: number };

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

/** Web と同一の横ピッチ座標変換 */
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

function GlowStroke({
  stroke,
  strokeWidth,
  glowWidth,
  ...rest
}: {
  stroke: string;
  strokeWidth: number;
  glowWidth?: number;
} & React.ComponentProps<typeof Line>) {
  const glow = glowWidth ?? strokeWidth * 2.8;
  return (
    <G>
      <Line
        {...rest}
        stroke={CYBER.lineGlow}
        strokeWidth={glow}
        opacity={0.35}
      />
      <Line {...rest} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  );
}

function GlowRect({
  stroke,
  strokeWidth,
  glowWidth,
  ...rest
}: {
  stroke: string;
  strokeWidth: number;
  glowWidth?: number;
} & React.ComponentProps<typeof Rect>) {
  const glow = glowWidth ?? strokeWidth * 2.8;
  return (
    <G>
      <Rect {...rest} stroke={CYBER.lineGlow} strokeWidth={glow} opacity={0.35} />
      <Rect {...rest} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  );
}

function GlowCircle({
  stroke,
  strokeWidth,
  glowWidth,
  fill,
  ...rest
}: {
  stroke?: string;
  strokeWidth?: number;
  glowWidth?: number;
  fill?: string;
} & React.ComponentProps<typeof Circle>) {
  const sw = strokeWidth ?? 0.3;
  const glow = glowWidth ?? sw * 2.8;
  return (
    <G>
      {stroke ? (
        <>
          <Circle
            {...rest}
            stroke={CYBER.lineGlow}
            strokeWidth={glow}
            fill="none"
            opacity={0.35}
          />
          <Circle {...rest} stroke={stroke} strokeWidth={sw} fill={fill ?? "none"} />
        </>
      ) : (
        <Circle {...rest} fill={fill} />
      )}
    </G>
  );
}

/** Web モバイル `PitchSurface` + `PitchMarkings` を 1 枚 SVG に統合 */
function PitchCanvasSvg({
  width,
  height,
  surfaceId,
}: {
  width: number;
  height: number;
  surfaceId: string;
}) {
  const centerGlowId = `${surfaceId}-centerGlow`;
  const vignetteId = `${surfaceId}-vignette`;

  const inset = 4;
  const fieldW = PITCH_W - inset * 2;
  const fieldH = PITCH_H - inset * 2;
  const midY = inset + fieldH / 2;
  const centerR = fieldW * 0.22 * 0.5;
  const paW = fieldW * 0.15;
  const paH = fieldH * 0.44;
  const gaW = fieldW * 0.06;
  const gaH = fieldH * 0.24;

  const stripeNodes: ReactNode[] = [];
  for (let x = 0; x < PITCH_W; x += 25) {
    stripeNodes.push(
      <Rect key={`sd-${x}`} x={x} y={0} width={12.5} height={PITCH_H} fill={CYBER.stripeDark} />,
      <Rect key={`sl-${x}`} x={x + 12.5} y={0} width={12.5} height={PITCH_H} fill={CYBER.stripeLight} />
    );
  }

  const fineStep = 1.5625;
  const mainStep = 3.125;
  const gridNodes: ReactNode[] = [];
  for (let x = fineStep; x < PITCH_W; x += fineStep) {
    gridNodes.push(
      <Line key={`fx-${x}`} x1={x} y1={0} x2={x} y2={PITCH_H} stroke={CYBER.gridFine} strokeWidth={0.08} />
    );
  }
  for (let y = fineStep; y < PITCH_H; y += fineStep) {
    gridNodes.push(
      <Line key={`fy-${y}`} x1={0} y1={y} x2={PITCH_W} y2={y} stroke={CYBER.gridFine} strokeWidth={0.08} />
    );
  }
  for (let x = mainStep; x < PITCH_W; x += mainStep) {
    gridNodes.push(
      <Line key={`mx-${x}`} x1={x} y1={0} x2={x} y2={PITCH_H} stroke={CYBER.grid} strokeWidth={0.12} />
    );
  }
  for (let y = mainStep; y < PITCH_H; y += mainStep) {
    gridNodes.push(
      <Line key={`my-${y}`} x1={0} y1={y} x2={PITCH_W} y2={y} stroke={CYBER.grid} strokeWidth={0.12} />
    );
  }

  const circuitNodes: Array<[number, number]> = [
    [8, 12], [42, 28], [68, 18], [96, 34], [128, 22], [14, 78], [58, 74], [88, 58],
    [22, 42], [52, 52], [108, 56], [46, 50], [114, 68], [62, 24], [84, 88], [100, 72],
  ];

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
      preserveAspectRatio="none"
      style={styles.pitchCanvas}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id={centerGlowId} cx="50%" cy="50%" rx="39%" ry="29%">
          <Stop offset="0%" stopColor="rgb(48,220,255)" stopOpacity={0.14} />
          <Stop offset="62%" stopColor="rgb(48,220,255)" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id={vignetteId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="rgb(48,220,255)" stopOpacity={0.05} />
          <Stop offset="35%" stopColor="rgb(48,220,255)" stopOpacity={0} />
          <Stop offset="65%" stopColor="rgb(48,220,255)" stopOpacity={0} />
          <Stop offset="100%" stopColor="rgb(1,10,22)" stopOpacity={0.5} />
        </SvgLinearGradient>
      </Defs>

      <Rect x={0} y={0} width={PITCH_W} height={PITCH_H} fill={CYBER.base} />
      {stripeNodes}

      <G stroke={CYBER.circuit} strokeWidth={0.18} fill="none" opacity={0.85} transform="scale(0.625)">
        <Path d="M 8 12 H 42 V 28 H 68 V 18 H 96 V 34 H 128 V 22 H 152" />
        <Path d="M 14 78 H 38 V 62 H 58 V 74 H 88 V 58 H 118 V 70 H 148" />
        <Path d="M 22 42 H 52 V 52 H 78 V 44 H 108 V 56 H 138" />
        <Path d="M 6 50 H 26 V 38 H 46 V 50 H 66" />
        <Path d="M 94 82 H 114 V 68 H 134 V 84 H 154" />
        <Path d="M 48 8 V 24 H 62 V 8 H 82 V 20" />
        <Path d="M 100 88 V 72 H 84 V 88 H 64 V 76" />
      </G>
      <G fill={CYBER.circuitNode} opacity={0.7} transform="scale(0.625)">
        {circuitNodes.map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={0.55} />
        ))}
      </G>

      {gridNodes}

      <Rect x={0} y={0} width={PITCH_W} height={PITCH_H} fill={`url(#${centerGlowId})`} />
      <Rect x={0} y={0} width={PITCH_W} height={PITCH_H} fill={`url(#${vignetteId})`} />

      <GlowRect
        x={inset}
        y={inset}
        width={fieldW}
        height={fieldH}
        stroke={CYBER.line}
        strokeWidth={0.35}
        fill="none"
        rx={0.5}
      />
      <GlowStroke
        x1={50}
        y1={inset}
        x2={50}
        y2={inset + fieldH}
        stroke={CYBER.line}
        strokeWidth={0.3}
      />
      <GlowCircle
        cx={50}
        cy={midY}
        r={centerR}
        stroke={CYBER.line}
        strokeWidth={0.3}
      />
      <Circle cx={50} cy={midY} r={0.45} fill={CYBER.line} />
      <Circle
        cx={50}
        cy={midY}
        r={1.2}
        fill={CYBER.line}
        opacity={0.35}
      />

      <GlowRect x={inset} y={midY - paH / 2} width={paW} height={paH} stroke={CYBER.line} strokeWidth={0.3} fill="none" />
      <GlowRect x={inset} y={midY - gaH / 2} width={gaW} height={gaH} stroke={CYBER.line} strokeWidth={0.3} fill="none" />
      <Circle cx={inset + fieldW * 0.08} cy={midY} r={0.55} fill={CYBER.lineGlow} opacity={0.45} />
      <Circle cx={inset + fieldW * 0.08} cy={midY} r={0.35} fill={CYBER.line} />

      <GlowRect
        x={inset + fieldW - paW}
        y={midY - paH / 2}
        width={paW}
        height={paH}
        stroke={CYBER.line}
        strokeWidth={0.3}
        fill="none"
      />
      <GlowRect
        x={inset + fieldW - gaW}
        y={midY - gaH / 2}
        width={gaW}
        height={gaH}
        stroke={CYBER.line}
        strokeWidth={0.3}
        fill="none"
      />
      <Circle cx={inset + fieldW * 0.92} cy={midY} r={0.55} fill={CYBER.lineGlow} opacity={0.45} />
      <Circle cx={inset + fieldW * 0.92} cy={midY} r={0.35} fill={CYBER.line} />

      <Path
        d={`M ${inset} ${inset + 1.875} Q ${inset} ${inset} ${inset + 1.25} ${inset}`}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="none"
      />
      <Path
        d={`M ${inset + fieldW - 1.25} ${inset} Q ${inset + fieldW} ${inset} ${inset + fieldW} ${inset + 1.875}`}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="none"
      />
      <Path
        d={`M ${inset} ${inset + fieldH - 1.875} Q ${inset} ${inset + fieldH} ${inset + 1.25} ${inset + fieldH}`}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="none"
      />
      <Path
        d={`M ${inset + fieldW - 1.25} ${inset + fieldH} Q ${inset + fieldW} ${inset + fieldH} ${inset + fieldW} ${inset + fieldH - 1.875}`}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="none"
      />

      <Rect
        x={inset - 0.35}
        y={midY - gaH / 2 + gaH * 0.08}
        width={0.75}
        height={gaH * 0.84}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="rgba(34,211,238,0.12)"
      />
      <Rect
        x={inset + fieldW - 0.4}
        y={midY - gaH / 2 + gaH * 0.08}
        width={0.75}
        height={gaH * 0.84}
        stroke={CYBER.line}
        strokeWidth={0.25}
        fill="rgba(34,211,238,0.12)"
      />
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

  const alignItems =
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
      style={[styles.markerRoot, { left: `${left}%`, top: `${top}%` }]}
      accessibilityLabel={player.name}
    >
      <View
        style={[
          styles.markerColumn,
          labelLayout.above ? styles.markerColumnAbove : styles.markerColumnBelow,
          { alignItems },
        ]}
      >
        <View style={{ width: dotSize, height: dotSize }}>
          <View
            style={[
              styles.dotGlow,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: colors.glow,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: colors.fill,
                borderColor: colors.ring,
                shadowColor: colors.glow,
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

/** Web `WcFormationPanel` 相当（モバイル `isMobile`） */
export default function WcFormationPanelNative({ teamId, t }: Props) {
  const [pitchSize, setPitchSize] = useState<PitchSize>({ width: 0, height: 0 });
  const surfaceId = `wc-pitch-${teamId}`;

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

  const handlePitchLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setPitchSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  };

  if (!lineup?.length || !predicted || !labelLayouts) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerKicker}>{t.predictedLineup}</Text>
        <Text style={styles.headerFormation}>{predicted.formation}</Text>
      </View>

      <View style={styles.pitchFrame}>
        <View style={styles.pitch} onLayout={handlePitchLayout}>
          {pitchSize.width > 0 && pitchSize.height > 0 ? (
            <PitchCanvasSvg
              width={pitchSize.width}
              height={pitchSize.height}
              surfaceId={surfaceId}
            />
          ) : (
            <View style={styles.pitchFallback} />
          )}
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
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  headerKicker: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.92,
    textTransform: "uppercase",
  },
  headerFormation: {
    marginTop: 4,
    color: "rgba(103,232,249,0.85)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.7,
    fontVariant: ["tabular-nums"],
  },
  pitchFrame: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: CYBER.base,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(48,220,255,0.18)",
        shadowOpacity: 1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  pitch: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: CYBER.base,
    overflow: "hidden",
    position: "relative",
  },
  pitchFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CYBER.base,
  },
  pitchCanvas: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  markerRoot: {
    position: "absolute",
    zIndex: 10,
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
  },
  markerColumn: {
    gap: 2,
    maxWidth: 68,
    flexShrink: 0,
  },
  markerColumnAbove: {
    flexDirection: "column-reverse",
  },
  markerColumnBelow: {
    flexDirection: "column",
  },
  dotGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0.65,
    transform: [{ scale: 1.35 }],
  },
  dot: {
    position: "absolute",
    left: 0,
    top: 0,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  markerLabel: {
    maxWidth: 68,
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    borderRadius: 2,
    backgroundColor: "rgba(3,11,24,0.92)",
    color: "rgba(207,250,254,0.9)",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.8,
    lineHeight: 12,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
});
