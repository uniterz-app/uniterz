/**
 * TeamAbbrBadge 見た目案（__DEV__ プレビュー専用）。本番 `TeamAbbrBadgeNative` は未接続。
 */
import { StyleSheet, Text, View } from "react-native";
import { nbaTeamIdFromBracketCode } from "../../../../../lib/nba-bracket-code";
import {
  contrastingInkOnHex,
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "../../../../../lib/team-colors";
import { TEAM_SHORT } from "../../../../../lib/team-short";

const OX = "Oxanium_800ExtraBold";

export type TeamAbbrBadgeVariantId =
  | "current"
  | "outlineGlow"
  | "doubleStroke"
  | "holoTicks"
  | "slashCut"
  | "circuitBracket"
  | "neonCore"
  | "scanEdge";

export const TEAM_ABBR_BADGE_VARIANTS: ReadonlyArray<{
  id: TeamAbbrBadgeVariantId;
  label: string;
  note: string;
}> = [
  {
    id: "current",
    label: "A · CURRENT (= B)",
    note: "本番採用。枠ネオン + 外グロウ + 薄いスキャン（旧 B）",
  },
  {
    id: "outlineGlow",
    label: "B · OUTLINE GLOW",
    note: "＝本番。比較用に残している",
  },
  {
    id: "doubleStroke",
    label: "C · DOUBLE STROKE",
    note: "二重枠。内側に薄い塗り、外側にアクセント線",
  },
  {
    id: "holoTicks",
    label: "D · HOLO TICKS",
    note: "塗り + 四隅のホロティック + 上端ハイライト",
  },
  {
    id: "slashCut",
    label: "E · SLASH CUT",
    note: "枠のみ + 斜めスラッシュ帯が文字を切る",
  },
  {
    id: "circuitBracket",
    label: "F · CIRCUIT BRACKET",
    note: "塗り + 角ブラケット（回路っぽい）",
  },
  {
    id: "neonCore",
    label: "G · NEON CORE",
    note: "暗いインセット + 中央ネオン文字 + 枠発光",
  },
  {
    id: "scanEdge",
    label: "H · SCAN EDGE",
    note: "塗り + 左エッジの縦スキャンバー",
  },
];

export const TEAM_ABBR_BADGE_PREVIEW_SAMPLES: ReadonlyArray<{
  teamId: string;
  abbr: string;
}> = [
  { teamId: "nba-raptors", abbr: "TOR" },
  { teamId: "nba-heat", abbr: "MIA" },
  { teamId: "nba-knicks", abbr: "NYK" },
  { teamId: "nba-spurs", abbr: "SAS" },
  { teamId: "nba-lakers", abbr: "LAL" },
  { teamId: "nba-celtics", abbr: "BOS" },
];

type ResolveInput = {
  abbr?: string | null;
  teamId?: string | null;
  fillColor?: string | null;
};

export function resolveTeamAbbrBadgeColors(input: ResolveInput): {
  abbr: string;
  fill: string;
  ink: string;
} | null {
  const abbr = (
    input.abbr?.trim() ||
    (input.teamId ? TEAM_SHORT[input.teamId] : null) ||
    ""
  )
    .slice(0, 3)
    .toUpperCase();
  if (!abbr) return null;

  const id =
    input.teamId?.startsWith("nba-")
      ? input.teamId
      : nbaTeamIdFromBracketCode(abbr);
  const fill = input.fillColor
    ? softenTeamUiColor(input.fillColor)
    : id
      ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", id))
      : "#5B8CFF";
  return { abbr, fill, ink: contrastingInkOnHex(fill) };
}

type BadgeProps = ResolveInput & {
  size?: "md" | "sm";
};

function ScanLines({
  count,
  step,
  color = "rgba(0,0,0,0.28)",
}: {
  count: number;
  step: number;
  color?: string;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.scanLine,
            { top: 1 + i * step, backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

function CurrentBadge({ abbr, fill, sm }: Resolved) {
  return <OutlineGlowBadge abbr={abbr} fill={fill} sm={sm} />;
}

function OutlineGlowBadge({ abbr, fill, sm }: Resolved) {
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        styles.outlineBase,
        {
          borderColor: fill,
          shadowColor: fill,
        },
      ]}
    >
      <ScanLines
        count={sm ? 5 : 7}
        step={sm ? 2.5 : 3}
        color={`${fill}33`}
      />
      <Text style={[sm ? styles.textSm : styles.text, { color: fill }]}>
        {abbr}
      </Text>
    </View>
  );
}

function DoubleStrokeBadge({ abbr, fill, ink, sm }: Resolved) {
  return (
    <View
      style={[
        sm ? styles.doubleOuterSm : styles.doubleOuter,
        { borderColor: fill, shadowColor: fill },
      ]}
    >
      <View
        style={[
          sm ? styles.doubleInnerSm : styles.doubleInner,
          { backgroundColor: fill },
        ]}
      >
        <ScanLines count={sm ? 5 : 7} step={sm ? 2.4 : 2.8} />
        <Text style={[sm ? styles.textSm : styles.text, { color: ink }]}>
          {abbr}
        </Text>
      </View>
    </View>
  );
}

function HoloTicksBadge({ abbr, fill, ink, sm }: Resolved) {
  const tick = sm ? 5 : 7;
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        { backgroundColor: fill },
      ]}
    >
      <View style={[styles.topHighlight, { backgroundColor: `${ink}33` }]} />
      <ScanLines count={sm ? 6 : 8} step={sm ? 2.5 : 3} />
      <View
        style={[
          styles.tickTL,
          { width: tick, height: tick, borderColor: ink },
        ]}
      />
      <View
        style={[
          styles.tickBR,
          { width: tick, height: tick, borderColor: ink },
        ]}
      />
      <Text style={[sm ? styles.textSm : styles.text, { color: ink }]}>
        {abbr}
      </Text>
    </View>
  );
}

function SlashCutBadge({ abbr, fill, sm }: Resolved) {
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        styles.outlineBase,
        { borderColor: fill, shadowColor: fill },
      ]}
    >
      <View
        style={[
          styles.slashBand,
          { backgroundColor: `${fill}55` },
        ]}
      />
      <Text style={[sm ? styles.textSm : styles.text, { color: fill }]}>
        {abbr}
      </Text>
    </View>
  );
}

function CircuitBracketBadge({ abbr, fill, ink, sm }: Resolved) {
  const arm = sm ? 6 : 8;
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        { backgroundColor: fill },
      ]}
    >
      <ScanLines count={sm ? 6 : 8} step={sm ? 2.5 : 3} />
      <View
        style={[
          styles.bracketTL,
          {
            width: arm,
            height: arm,
            borderColor: ink,
          },
        ]}
      />
      <View
        style={[
          styles.bracketBR,
          {
            width: arm,
            height: arm,
            borderColor: ink,
          },
        ]}
      />
      <Text style={[sm ? styles.textSm : styles.text, { color: ink }]}>
        {abbr}
      </Text>
    </View>
  );
}

function NeonCoreBadge({ abbr, fill, sm }: Resolved) {
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        styles.neonShell,
        { borderColor: fill, shadowColor: fill },
      ]}
    >
      <View style={[styles.neonCore, { backgroundColor: `${fill}22` }]} />
      <ScanLines
        count={sm ? 5 : 7}
        step={sm ? 2.5 : 3}
        color={`${fill}40`}
      />
      <Text
        style={[
          sm ? styles.textSm : styles.text,
          styles.neonText,
          { color: fill, textShadowColor: fill },
        ]}
      >
        {abbr}
      </Text>
    </View>
  );
}

function ScanEdgeBadge({ abbr, fill, ink, sm }: Resolved) {
  return (
    <View
      style={[
        sm ? styles.shellSm : styles.shell,
        { backgroundColor: fill },
      ]}
    >
      <View style={[styles.edgeBar, { backgroundColor: ink }]}>
        <ScanLines
          count={sm ? 6 : 8}
          step={sm ? 2.2 : 2.6}
          color="rgba(0,0,0,0.35)"
        />
      </View>
      <ScanLines count={sm ? 5 : 7} step={sm ? 2.5 : 3} />
      <Text style={[sm ? styles.textSm : styles.text, { color: ink }]}>
        {abbr}
      </Text>
    </View>
  );
}

type Resolved = {
  abbr: string;
  fill: string;
  ink: string;
  sm: boolean;
};

export function TeamAbbrBadgeVariantNative({
  variant,
  abbr,
  teamId,
  fillColor,
  size = "md",
}: BadgeProps & { variant: TeamAbbrBadgeVariantId }) {
  const resolved = resolveTeamAbbrBadgeColors({ abbr, teamId, fillColor });
  if (!resolved) return null;
  const sm = false;
  const props: Resolved = { ...resolved, sm };

  switch (variant) {
    case "current":
      return <CurrentBadge {...props} />;
    case "outlineGlow":
      return <OutlineGlowBadge {...props} />;
    case "doubleStroke":
      return <DoubleStrokeBadge {...props} />;
    case "holoTicks":
      return <HoloTicksBadge {...props} />;
    case "slashCut":
      return <SlashCutBadge {...props} />;
    case "circuitBracket":
      return <CircuitBracketBadge {...props} />;
    case "neonCore":
      return <NeonCoreBadge {...props} />;
    case "scanEdge":
      return <ScanEdgeBadge {...props} />;
    default:
      return <CurrentBadge {...props} />;
  }
}

const styles = StyleSheet.create({
  shell: {
    width: 40,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ skewX: "-14deg" }],
  },
  shellSm: {
    width: 40,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ skewX: "-14deg" }],
  },
  outlineBase: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 4,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  text: {
    fontFamily: OX,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    transform: [{ skewX: "8deg" }],
  },
  textSm: {
    fontFamily: OX,
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    transform: [{ skewX: "8deg" }],
  },
  doubleOuter: {
    width: 44,
    height: 26,
    padding: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ skewX: "-14deg" }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 5,
  },
  doubleOuterSm: {
    width: 44,
    height: 26,
    padding: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ skewX: "-14deg" }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
  },
  doubleInner: {
    width: 36,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  doubleInnerSm: {
    width: 36,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 2,
  },
  tickTL: {
    position: "absolute",
    left: 2,
    top: 2,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  tickBR: {
    position: "absolute",
    right: 2,
    bottom: 2,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  slashBand: {
    position: "absolute",
    width: 10,
    top: -6,
    bottom: -6,
    left: "42%",
    transform: [{ skewX: "28deg" }],
  },
  bracketTL: {
    position: "absolute",
    left: 1,
    top: 1,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bracketBR: {
    position: "absolute",
    right: 1,
    bottom: 1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  neonShell: {
    backgroundColor: "#050508",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 7,
    elevation: 5,
  },
  neonCore: {
    ...StyleSheet.absoluteFillObject,
  },
  neonText: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  edgeBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    overflow: "hidden",
  },
});
