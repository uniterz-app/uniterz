import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import type { CyberGlyphGlowLayer } from "../../../../../lib/rankings/cyberGlyphGlowLayers";

type Props = {
  children: string;
  style: StyleProp<TextStyle>;
  layers: CyberGlyphGlowLayer[];
  maxFontSizeMultiplier?: number;
  /** 幅に収めて必ず1行。折り返さない */
  singleLine?: boolean;
};

/**
 * Web `filter: drop-shadow` / 多層 `textShadow` 相当。
 * RN の textShadow は矩形に光るため、字形を重ねてソフトグローにする。
 */
function singleLineProps(singleLine: boolean) {
  if (!singleLine) return {};
  return {
    numberOfLines: 1 as const,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.45,
  };
}

export function CyberGlyphGlowTextNative({
  children,
  style,
  layers,
  maxFontSizeMultiplier = 1.1,
  singleLine = false,
}: Props) {
  const lineProps = singleLineProps(singleLine);
  if (layers.length === 0) {
    return (
      <Text
        style={style}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        {...lineProps}
      >
        {children}
      </Text>
    );
  }

  return (
    <View style={[styles.root, singleLine ? styles.rootSingleLine : null]}>
      {layers.map((layer, index) => (
        <Text
          key={`glow-${index}`}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            style,
            styles.glowLayer,
            {
              color: layer.color,
              opacity: layer.opacity,
              transform: [{ scale: layer.scale }],
            },
          ]}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          {...lineProps}
        >
          {children}
        </Text>
      ))}
      <Text
        style={[style, styles.foreground]}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        {...lineProps}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    alignSelf: "flex-start",
    overflow: "visible",
  },
  rootSingleLine: {
    alignSelf: "stretch",
    width: "100%",
  },
  glowLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  foreground: {
    position: "relative",
  },
});
