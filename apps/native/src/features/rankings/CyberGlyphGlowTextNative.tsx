import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import type { CyberGlyphGlowLayer } from "../../../../../lib/rankings/cyberGlyphGlowLayers";

type Props = {
  children: string;
  style: StyleProp<TextStyle>;
  layers: CyberGlyphGlowLayer[];
  maxFontSizeMultiplier?: number;
};

/**
 * Web `filter: drop-shadow` / 多層 `textShadow` 相当。
 * RN の textShadow は矩形に光るため、字形を重ねてソフトグローにする。
 */
export function CyberGlyphGlowTextNative({
  children,
  style,
  layers,
  maxFontSizeMultiplier = 1.1,
}: Props) {
  if (layers.length === 0) {
    return (
      <Text style={style} maxFontSizeMultiplier={maxFontSizeMultiplier}>
        {children}
      </Text>
    );
  }

  return (
    <View style={styles.root}>
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
        >
          {children}
        </Text>
      ))}
      <Text style={[style, styles.foreground]} maxFontSizeMultiplier={maxFontSizeMultiplier}>
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
  glowLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  foreground: {
    position: "relative",
  },
});
