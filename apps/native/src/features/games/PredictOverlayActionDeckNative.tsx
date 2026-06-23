/**
 * Web `.predict-overlay-cyber-deck` 相当 — × / 共有 / バー�ger を1枚の角切り枠にまとめる。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Canvas,
  Group,
  Path,
  Rect,
  Skia,
} from "@shopify/react-native-skia";
import {
  chamferedRectPathD,
  PREDICT_OVERLAY_CYBER_DECK_CUT,
} from "./matchListCyberClipPath";

export const PREDICT_OVERLAY_ACTION_DECK_SEGMENT = 28;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function PredictOverlayActionDeckNative({ children, style }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const cut = PREDICT_OVERLAY_CYBER_DECK_CUT;

  const skiaPath = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return null;
    const d = chamferedRectPathD(size.w, size.h, cut);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [size.w, size.h, cut]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {hasSize && skiaPath ? (
        <>
          <Canvas
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            }}
          >
            <Group clip={skiaPath}>
              <Rect
                x={0}
                y={0}
                width={size.w}
                height={size.h}
                color="rgba(4,8,14,0.9)"
              />
            </Group>
          </Canvas>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            }}
          >
            <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
              <Path
                path={skiaPath}
                style="stroke"
                strokeWidth={1}
                color="rgba(0,245,255,0.28)"
              />
            </Canvas>
          </View>
        </>
      ) : null}
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    minHeight: PREDICT_OVERLAY_ACTION_DECK_SEGMENT,
    shadowColor: "#00f5ff",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: PREDICT_OVERLAY_ACTION_DECK_SEGMENT,
  },
});
