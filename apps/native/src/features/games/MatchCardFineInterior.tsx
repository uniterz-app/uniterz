import { useCallback, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** `PredictNextGameNativeModal` 中継カードと同一の細方眼 */
export const MATCH_CARD_FINE_GRID_STEP_PX = 9;
export const MATCH_CARD_FINE_GRID_LINE_COLOR = "rgba(255,255,255,0.06)";

function MatchCardFineGrid() {
  const [{ w, h }, setDims] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    if (Math.abs(width - w) < 0.5 && Math.abs(height - h) < 0.5) return;
    setDims({ w: width, h: height });
  }, [w, h]);

  const step = MATCH_CARD_FINE_GRID_STEP_PX;
  const vLines = useMemo(() => {
    const out: number[] = [];
    for (let x = step; x < w; x += step) out.push(x);
    return out;
  }, [w]);
  const hLines = useMemo(() => {
    const out: number[] = [];
    for (let y = step; y < h; y += step) out.push(y);
    return out;
  }, [h]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject} onLayout={onLayout}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(34,211,238,0.08)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
      />
      {vLines.map((left) => (
        <View
          key={`gv-${left}`}
          style={[
            styles.gridV,
            { left, backgroundColor: MATCH_CARD_FINE_GRID_LINE_COLOR },
          ]}
        />
      ))}
      {hLines.map((top) => (
        <View
          key={`gh-${top}`}
          style={[
            styles.gridH,
            { top, backgroundColor: MATCH_CARD_FINE_GRID_LINE_COLOR },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * #080c12・方眼・オーバーレイ。親に `overflow: "hidden"` と角丸を付けて全面に敷く。
 * 試合一覧は `gameCardShell` 直下で CTA 帯まで含めてグリッドを広げる。
 */
export function MatchCardFineBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.innerBg} />
      <MatchCardFineGrid />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.09)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.52 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(34,211,238,0.04)",
          "transparent",
          "transparent",
          "rgba(0,0,0,0.35)",
        ]}
        locations={[0, 0.28, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

export type MatchCardFineInnerPlateProps = {
  children: React.ReactNode;
  /** プレートの角丸 */
  borderRadius: number;
  /** `#080c12` 枠に追加（例: `minHeight`） */
  plateStyle?: ViewStyle;
  /** コンテンツラッパー */
  contentStyle?: ViewStyle;
};

/**
 * モーダル中継など：角丸内に `MatchCardFineBackdrop` ＋コンテンツ。
 * 一覧試合カードはシェル全面に `MatchCardFineBackdrop` を別置きし、ここは使わない。
 */
export function MatchCardFineInnerPlate({
  children,
  borderRadius,
  plateStyle,
  contentStyle,
}: MatchCardFineInnerPlateProps) {
  return (
    <View style={[styles.plate, { borderRadius }, plateStyle]}>
      <MatchCardFineBackdrop />
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    overflow: "hidden",
    minHeight: 0,
  },
  innerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#080c12",
  },
  innerContent: {
    position: "relative",
    zIndex: 3,
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});
