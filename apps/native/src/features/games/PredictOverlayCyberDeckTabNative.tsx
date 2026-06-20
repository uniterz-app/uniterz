import { useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import {
  PREDICT_OVERLAY_CYBER_DECK_CUT,
  predictOverlayDeckTabActivePathD,
  type PredictOverlayDeckTabEdge,
} from "./matchListCyberClipPath";

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  edge: PredictOverlayDeckTabEdge;
  /** 右端タブ — 区切り線なし */
  isLast?: boolean;
};

const CYBER_TAB_CYAN = "#00F5FF";

/** Web `.predict-overlay-cyber-deck` 内タブ — active も deck の角切りを維持 */
export default function PredictOverlayCyberDeckTabNative({
  label,
  active,
  onPress,
  edge,
  isLast = false,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const fillPath = useMemo(() => {
    if (!active || size.w <= 0 || size.h <= 0) return null;
    const d = predictOverlayDeckTabActivePathD(
      size.w,
      size.h,
      PREDICT_OVERLAY_CYBER_DECK_CUT,
      edge
    );
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [active, size.w, size.h, edge]);

  const highlightInset = useMemo(() => {
    const cut = PREDICT_OVERLAY_CYBER_DECK_CUT;
    return {
      left: edge === "first" || edge === "only" ? cut : 0,
      right: edge === "last" || edge === "only" ? cut : 0,
    };
  }, [edge]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <Pressable
      style={[styles.tab, isLast && styles.tabLast, active && styles.tabActiveShell]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.tabInner} onLayout={onLayout}>
        {fillPath ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Path path={fillPath} color={CYBER_TAB_CYAN} />
            </Canvas>
            <View
              pointerEvents="none"
              style={[styles.activeTopHighlight, highlightInset]}
            />
          </View>
        ) : null}
        <Text
          style={[styles.text, active ? styles.textActive : styles.textIdle]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,245,255,0.14)",
  },
  tabLast: {
    borderRightWidth: 0,
  },
  tabActiveShell: {
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 4,
  },
  tabInner: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  activeTopHighlight: {
    position: "absolute",
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  text: {
    position: "relative",
    zIndex: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  textIdle: {
    color: CYBER_TAB_CYAN,
    textShadowColor: "rgba(0,245,255,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  textActive: {
    color: "#050508",
  },
});
