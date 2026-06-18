import { useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { resultHitCyberClipPathD } from "./resultHitCyberClipPath";

/** Web `ResultHitCyberFrame`（一覧は showSweep=false） */
export default function ResultHitCyberFrameNative() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return null;
    const d = resultHitCyberClipPathD(size.w, size.h);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [size.w, size.h]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View
      pointerEvents="none"
      style={styles.overlay}
      onLayout={onLayout}
    >
      {skiaPath ? (
        <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={1}
            color="rgba(250,204,21,0.76)"
          />
        </Canvas>
      ) : null}
      <View pointerEvents="none" style={[styles.corner, styles.cornerTL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTR]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBR]} />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(253,224,71,0.92)",
          "rgba(253,224,71,0.55)",
          "transparent",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topLine}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(252,211,77,0.18)",
          "rgba(251,191,36,0.09)",
          "transparent",
        ]}
        locations={[0, 0.42, 0.7]}
        style={styles.topGlow}
      />
    </View>
  );
}

const CORNER = "rgba(253,224,71,0.88)";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    shadowColor: "rgba(251,191,36,0.36)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 11,
  },
  corner: {
    position: "absolute",
    zIndex: 5,
    width: 10,
    height: 10,
  },
  cornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: CORNER,
  },
  cornerTR: {
    right: 0,
    top: 0,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: CORNER,
  },
  cornerBL: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: CORNER,
  },
  cornerBR: {
    right: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: CORNER,
  },
  topLine: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    height: 2,
    zIndex: 3,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "42%",
    zIndex: 1,
  },
});
