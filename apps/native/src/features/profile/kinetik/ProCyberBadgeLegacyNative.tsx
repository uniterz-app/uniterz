/**
 * Web `ProCyberBadgeLegacy` 相当 — 旧ダイヤモンド + PRO。比較プレビュー専用。
 */
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  FeDropShadow,
  FeMerge,
  FeMergeNode,
  Filter,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from "react-native-svg";

type Props = {
  /** プロフィールカード用 — 一段大 */
  premium?: boolean;
  /** マイランクカード — compact より少しだけ大きく */
  emphasized?: boolean;
  compact?: boolean;
};

const PRO_GOLD = {
  bright: "#f4df9a",
  mid: "#d4af5a",
  deep: "#a67c28",
};

/** Web `ProLuxuryDiamondMark` の viewBox 64 菱形 */
function ProLuxuryDiamondMarkNative({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="proGold" x1="0.08" y1="0.06" x2="0.92" y2="0.94">
          <Stop offset="0%" stopColor="#fff8e8" />
          <Stop offset="18%" stopColor="#f3d98a" />
          <Stop offset="42%" stopColor="#c89a3a" />
          <Stop offset="68%" stopColor="#f0cc72" />
          <Stop offset="88%" stopColor="#9a7128" />
          <Stop offset="100%" stopColor="#6f5218" />
        </LinearGradient>
        <LinearGradient id="proGoldDim" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#e8c66e" />
          <Stop offset="100%" stopColor="#7a5a1c" />
        </LinearGradient>
        <RadialGradient id="proFrameFill" cx="0.28" cy="0.22" rx="0.78" ry="0.78">
          <Stop offset="0%" stopColor="#565660" />
          <Stop offset="38%" stopColor="#2a2a32" />
          <Stop offset="72%" stopColor="#121218" />
          <Stop offset="100%" stopColor="#060608" />
        </RadialGradient>
        <LinearGradient id="proFacetHi" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#fff9ee" />
          <Stop offset="28%" stopColor="#efd080" />
          <Stop offset="72%" stopColor="#c4933c" />
          <Stop offset="100%" stopColor="#8f6820" />
        </LinearGradient>
        <LinearGradient id="proFacetMid" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#3a3a44" />
          <Stop offset="55%" stopColor="#1c1c22" />
          <Stop offset="100%" stopColor="#0a0a0e" />
        </LinearGradient>
        <LinearGradient id="proFacetDark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#242428" />
          <Stop offset="45%" stopColor="#101014" />
          <Stop offset="100%" stopColor="#000000" />
        </LinearGradient>
        <Filter id="proMarkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <FeDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#000000" floodOpacity={0.55} />
          <FeDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#d4af5a" floodOpacity={0.12} />
          <FeMerge>
            <FeMergeNode />
            <FeMergeNode />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <G filter="url(#proMarkGlow)">
        <Path
          d="M32,5 L59,32 L32,59 L5,32 Z M32,11.5 L52.5,32 L32,52.5 L11.5,32 Z"
          fill="url(#proFrameFill)"
          fillRule="evenodd"
        />
        <Path
          d="M32,5 L59,32 L32,59 L5,32 Z"
          fill="none"
          stroke="url(#proGold)"
          strokeWidth={1.65}
          strokeLinejoin="miter"
        />
        <Path
          d="M32,11.5 L52.5,32 L32,52.5 L11.5,32 Z"
          fill="none"
          stroke="url(#proGoldDim)"
          strokeWidth={1.15}
          strokeLinejoin="miter"
        />
        <Polygon points="32,14.5 14,32 32,32" fill="url(#proFacetHi)" />
        <Polygon points="32,14.5 32,32 50,32" fill="url(#proFacetMid)" />
        <Polygon points="50,32 32,32 32,49.5" fill="url(#proFacetDark)" />
        <Polygon points="32,49.5 32,32 14,32" fill="url(#proFacetMid)" />
        <Path d="M32,14.5 L36.5,18.5 L32,22.5 L27.5,18.5 Z" fill="#fffdf6" opacity={0.22} />
      </G>
    </Svg>
  );
}

/** Web `ProCornerBracketFrame` 相当 */
function ProCornerBracketFrameNative() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 62 18"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="proBracketGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#fff4d4" />
          <Stop offset="22%" stopColor="#e8c66a" />
          <Stop offset="55%" stopColor="#c89a3a" />
          <Stop offset="82%" stopColor="#f0cc72" />
          <Stop offset="100%" stopColor="#8f6820" />
        </LinearGradient>
      </Defs>
      <Path
        d="M 46 0.5 L 1 0.5 L 1 12.5"
        fill="none"
        stroke="url(#proBracketGold)"
        strokeWidth={0.95}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <Path
        d="M 16 17.5 L 61 17.5 L 61 5.5"
        fill="none"
        stroke="url(#proBracketGold)"
        strokeWidth={0.95}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </Svg>
  );
}

export default function ProCyberBadgeLegacyNative({
  premium = false,
  emphasized = false,
  compact = false,
}: Props) {
  // premium: プロフィール名横 / emphasized: マイランク / compact: 一覧
  const markSize = premium ? 12 : emphasized ? 10 : 9;
  const wordSize = premium ? 9 : emphasized ? 8 : compact ? 7.5 : 7;
  const height = premium ? 22 : emphasized ? 19 : compact ? 17 : 18;

  return (
    <View
      style={[
        styles.tag,
        { height },
        premium
          ? styles.tagPremium
          : emphasized
            ? styles.tagEmphasized
            : compact
              ? styles.tagCompact
              : null,
      ]}
      accessibilityLabel="PRO"
    >
      <View style={styles.bracketLayer} pointerEvents="none">
        <ProCornerBracketFrameNative />
      </View>
      <ProLuxuryDiamondMarkNative size={markSize} />
      <Text
        style={[styles.word, { fontSize: wordSize }]}
        maxFontSizeMultiplier={1.1}
      >
        PRO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexShrink: 0,
    overflow: "visible",
  },
  tagPremium: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagEmphasized: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagCompact: {
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  /** 親サイズ確定後に枠を載せる（% SVG の初期レイアウトジャンプを防ぐ） */
  bracketLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  word: {
    fontFamily: "Oxanium_700Bold",
    fontWeight: "400",
    letterSpacing: 0.8,
    color: PRO_GOLD.mid,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 1, height: 0 },
    textShadowRadius: 0,
  },
});
