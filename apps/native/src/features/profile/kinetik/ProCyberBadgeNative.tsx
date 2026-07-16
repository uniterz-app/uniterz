import Svg, { Defs, FeDropShadow, FeMerge, FeMergeNode, Filter, G, LinearGradient, Path, RadialGradient, Stop, Text } from "react-native-svg";

type Props = {
  /** プロフィールカード用 — 一段大 */
  premium?: boolean;
  compact?: boolean;
};

const HEX_D = "M8 10 L48 10 L52 30 L48 50 L8 50 L4 30 Z";

/** Web `ProCyberBadge` 相当 */
export default function ProCyberBadgeNative({
  premium = false,
  compact = false,
}: Props) {
  const w = premium ? 38 : compact ? 31 : 40;
  const h = premium ? 44 : compact ? 36 : 44;
  const fontSize = premium ? 14 : compact ? 11.5 : 13.5;
  const glow1 = premium ? 1.45 : 1.05;
  const glow2 = premium ? 2.85 : 2.1;

  return (
    <Svg width={w} height={h} viewBox="0 0 56 60" accessibilityLabel="PRO">
      <Defs>
        <LinearGradient id="proHexMetal" x1="4" y1="4" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#e2e8f0" />
          <Stop offset="0.22" stopColor="#94a3b8" />
          <Stop offset="0.5" stopColor="#475569" />
          <Stop offset="0.78" stopColor="#cbd5e1" />
          <Stop offset="1" stopColor="#64748b" />
        </LinearGradient>
        <RadialGradient id="proHexInner" cx="0.5" cy="0.42" r="0.72" gradientUnits="objectBoundingBox">
          <Stop offset="0%" stopColor="#0f172a" />
          <Stop offset="55%" stopColor="#050a12" />
          <Stop offset="100%" stopColor="#020308" />
        </RadialGradient>
        <Filter id="proHexGlow" x="-25%" y="-22%" width="145%" height="140%">
          <FeDropShadow dx="0" dy="0" stdDeviation={glow1} floodColor="#22d3ee" floodOpacity={premium ? 0.62 : 0.5} />
          <FeDropShadow dx="0" dy="0" stdDeviation={glow2} floodColor="#a78bfa" floodOpacity={premium ? 0.28 : 0.2} />
          <FeMerge>
            <FeMergeNode />
            <FeMergeNode />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <G filter="url(#proHexGlow)">
        <Path
          d={HEX_D}
          fill="url(#proHexInner)"
          stroke="url(#proHexMetal)"
          strokeWidth={2.15}
          strokeLinejoin="miter"
        />
        <Path
          d={HEX_D}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={0.55}
          strokeOpacity={0.75}
          transform="translate(28, 30) scale(0.9) translate(-28, -30)"
        />
      </G>
      <Text
        x={28}
        y={29}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill="#ecfeff"
        stroke="#0c4a6e"
        strokeWidth={0.2}
        fontFamily="monospace"
        fontSize={fontSize}
        fontWeight="800"
        letterSpacing={1.4}
      >
        PRO
      </Text>
    </Svg>
  );
}
