import { useCallback, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

/** Web `.match-list-cyber-grid`（16px 方眼・シアン） */
const GRID_STEP_PX = 16;
const GRID_LINE_COLOR = "rgba(0, 245, 255, 0.04)";
const GRID_LAYER_OPACITY = 0.8;

/** 試合一覧カード内の方眼（Web `MATCH_LIST_CYBER_GRID_CLASS` 相当） */
export default function MatchListCyberGridNative() {
  const [{ w, h }, setDims] = useState({ w: 0, h: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    if (Math.abs(width - w) < 0.5 && Math.abs(height - h) < 0.5) return;
    setDims({ w: width, h: height });
  }, [w, h]);

  const vLines = useMemo(() => {
    const out: number[] = [];
    for (let x = GRID_STEP_PX; x < w; x += GRID_STEP_PX) out.push(x);
    return out;
  }, [w]);

  const hLines = useMemo(() => {
    const out: number[] = [];
    for (let y = GRID_STEP_PX; y < h; y += GRID_STEP_PX) out.push(y);
    return out;
  }, [h]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject} onLayout={onLayout}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: GRID_LAYER_OPACITY }]}
      >
        {vLines.map((left) => (
          <View
            key={`gv-${left}`}
            style={[styles.lineV, { left, backgroundColor: GRID_LINE_COLOR }]}
          />
        ))}
        {hLines.map((top) => (
          <View
            key={`gh-${top}`}
            style={[styles.lineH, { top, backgroundColor: GRID_LINE_COLOR }]}
          />
        ))}
      </View>
      {/** Web `mask-image: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 96%)` 相当 */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(4,7,12,0)", "rgba(4,7,12,0.55)", "rgba(4,7,12,0.96)"]}
        locations={[0.72, 0.9, 0.98]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  lineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});
