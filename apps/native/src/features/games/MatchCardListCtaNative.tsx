import { useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { chamferedRectPathD } from "./matchListCyberClipPath";
import { GAMES_PAGE_BG_MASK } from "./gamesPageBackgroundTokens";

/** Web `.match-list-cyber-cta` の角切り（6px） */
const CTA_CUT = 6;

export type MatchCardListCtaVariant = "normal" | "predicted" | "live" | "final";

type MatchCardListCtaNativeProps = {
  label: string;
  variant: MatchCardListCtaVariant;
  style?: ViewStyle;
};

const VARIANT_FILL: Record<
  MatchCardListCtaVariant,
  { colors: [string, string, string]; locations: [number, number, number] }
> = {
  normal: {
    colors: [
      "rgba(0,245,255,0.34)",
      "rgba(0,190,230,0.44)",
      "rgba(0,110,155,0.54)",
    ],
    locations: [0, 0.46, 1],
  },
  predicted: {
    colors: [
      "rgba(148,163,184,0.18)",
      "rgba(71,85,105,0.32)",
      "rgba(51,65,85,0.4)",
    ],
    locations: [0, 0.55, 1],
  },
  live: {
    colors: [
      "rgba(34,197,94,0.22)",
      "rgba(22,163,74,0.34)",
      "rgba(21,128,61,0.42)",
    ],
    locations: [0, 0.55, 1],
  },
  final: {
    colors: [
      "rgba(251,191,36,0.16)",
      "rgba(180,130,20,0.28)",
      "rgba(120,90,15,0.36)",
    ],
    locations: [0, 0.55, 1],
  },
};

const VARIANT_BORDER: Record<MatchCardListCtaVariant, string> = {
  normal: "rgba(0,245,255,0.52)",
  predicted: "rgba(148,163,184,0.42)",
  live: "rgba(34,197,94,0.45)",
  final: "rgba(251,191,36,0.4)",
};

const VARIANT_SHELL_SHADOW: Record<
  MatchCardListCtaVariant,
  Pick<ViewStyle, "shadowColor" | "shadowOpacity" | "shadowRadius">
> = {
  normal: {
    shadowColor: "#00f5ff",
    shadowOpacity: 0.28,
    shadowRadius: 11,
  },
  predicted: {
    shadowColor: "rgba(148,163,184,0.35)",
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  live: {
    shadowColor: "rgba(34,197,94,0.45)",
    shadowOpacity: 0.2,
    shadowRadius: 9,
  },
  final: {
    shadowColor: "rgba(251,191,36,0.4)",
    shadowOpacity: 0.14,
    shadowRadius: 7,
  },
};

const VARIANT_TEXT_SHADOW: Record<MatchCardListCtaVariant, TextStyle> = {
  normal: {
    textShadowColor: "rgba(0,245,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  predicted: {
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
  live: {
    textShadowColor: "rgba(34,197,94,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  final: {
    textShadowColor: "rgba(251,191,36,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
};

/** カード内 CTA の角切りマスク（ページ背景と同色） */
const CTA_CORNER_MASK = GAMES_PAGE_BG_MASK;

function CornerCut({ style }: { style: ViewStyle }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.cornerCut, { backgroundColor: CTA_CORNER_MASK }, style]}
    />
  );
}

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** Web `.match-list-cyber-cta` 相当の下部 CTA */
export default function MatchCardListCtaNative({
  label,
  variant,
  style,
}: MatchCardListCtaNativeProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const fill = VARIANT_FILL[variant];
  const borderColor = VARIANT_BORDER[variant];
  const textShadow = VARIANT_TEXT_SHADOW[variant];

  const skiaPath = useMemo(
    () =>
      size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h, CTA_CUT) : null,
    [size.w, size.h]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View
      style={[
        styles.root,
        VARIANT_SHELL_SHADOW[variant],
        { shadowOffset: { width: 0, height: 0 } },
        style,
      ]}
      onLayout={onLayout}
    >
      <View style={styles.shell}>
        <LinearGradient
          pointerEvents="none"
          colors={fill.colors}
          locations={fill.locations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.insetTop} />
        <Text style={[styles.label, textShadow]}>{label}</Text>
        <CornerCut style={{ top: -1, left: -1 }} />
        <CornerCut style={{ top: -1, right: -1 }} />
        <CornerCut style={{ bottom: -1, left: -1 }} />
        <CornerCut style={{ bottom: -1, right: -1 }} />
      </View>
      {skiaPath ? (
        <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={1}
            color={borderColor}
          />
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    minHeight: 32,
    position: "relative",
    marginBottom: 2,
  },
  shell: {
    minHeight: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    elevation: 2,
  },
  insetTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  label: {
    color: "rgba(224,255,255,0.98)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 15,
    includeFontPadding: false,
    zIndex: 1,
  },
  cornerCut: {
    position: "absolute",
    width: CTA_CUT * 1.45,
    height: CTA_CUT * 1.45,
    transform: [{ rotate: "45deg" }],
    zIndex: 3,
  },
});
