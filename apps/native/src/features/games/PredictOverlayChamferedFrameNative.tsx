/**
 * Web `predict-overlay-*` の clip-path + 塗り + 枠線を Skia で再現。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { chamferedRectPathD } from "./matchListCyberClipPath";
import PredictOverlayChamferCornerFillNative from "./PredictOverlayChamferCornerFillNative";

type Props = {
  cut: number;
  gradientColors: readonly string[];
  gradientLocations?: readonly number[];
  borderColor: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  flex?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** 角の矩形はみ出しをマスク（Web clip-path 相当） */
  maskCorners?: boolean;
  cornerMaskColor?: string;
  children: ReactNode;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

export default function PredictOverlayChamferedFrameNative({
  cut,
  gradientColors,
  gradientLocations = [0, 1],
  borderColor,
  borderWidth = 1,
  shadowColor,
  shadowOpacity = 0,
  shadowRadius = 0,
  flex,
  style,
  contentStyle,
  maskCorners = true,
  cornerMaskColor = "rgba(10,14,22,1)",
  children,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h, cut) : null),
    [size.w, size.h, cut]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View
      style={[
        styles.root,
        flex != null ? { flex } : null,
        shadowColor
          ? {
              shadowColor,
              shadowOpacity,
              shadowRadius,
              shadowOffset: { width: 0, height: 0 },
              elevation: shadowOpacity > 0 ? 3 : 0,
            }
          : null,
        style,
      ]}
      onLayout={onLayout}
    >
      {hasSize && skiaPath ? (
        <>
          <Canvas
            style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
            pointerEvents="none"
          >
            <Group clip={skiaPath}>
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.5, 0)}
                  end={vec(size.w * 0.5, size.h)}
                  colors={[...gradientColors]}
                  positions={[...gradientLocations]}
                />
              </Rect>
            </Group>
          </Canvas>
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
          >
            <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
              <Path
                path={skiaPath}
                style="stroke"
                strokeWidth={borderWidth}
                color={borderColor}
              />
            </Canvas>
          </View>
        </>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {hasSize && maskCorners ? (
        <View pointerEvents="none" style={styles.cornerMaskLayer}>
          <PredictOverlayChamferCornerFillNative
            width={size.w}
            height={size.h}
            cut={cut}
            fillColor={cornerMaskColor}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    minWidth: 0,
    overflow: "visible",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  cornerMaskLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 4,
  },
});
