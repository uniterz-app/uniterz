/**
 * Web `ResultGlassShell` + `.result-hit-cyber-clip` 相当。
 * 塗りはモバイル `RESULT_GLASS_FILL_MOBILE`（白半透明グラデ + blur）に準拠。
 * 角切りは Skia clip（ページ色の角マスクは使わない）。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  resultHitCyberClipPathD,
} from "./resultHitCyberClipPath";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";

/**
 * Web `RESULT_GLASS_FILL_MOBILE`
 * `bg-[linear-gradient(172deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.035)_45%,rgba(255,255,255,0.015)_100%)]`
 */
const GLASS_FILL_MOBILE = {
  colors: [
    "rgba(255,255,255,0.08)",
    "rgba(255,255,255,0.035)",
    "rgba(255,255,255,0.015)",
  ],
  locations: [0, 0.45, 1],
} as const;

/** blur が弱い端末向けの下地（日付帯 `resultDayStripPanelNative.panel` と同系） */
const GLASS_UNDERLAY = "rgba(8,11,18,0.48)";

type Props = {
  children: ReactNode;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  overflowVisible?: boolean;
  /** 入場時の枠線フェード */
  strokeOpacityStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** 枠線幅 px（hit / 連勝 / upset / perfect は 3） */
  strokeWidth?: number;
  /** 互換用（Web ガラス面に方眼はないため常に無視） */
  hideGrid?: boolean;
};

function makeSkiaPath(width: number, height: number) {
  const d = resultHitCyberClipPathD(width, height);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

function GlassFillFallback() {
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: GLASS_UNDERLAY }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[...GLASS_FILL_MOBILE.colors]}
        locations={[...GLASS_FILL_MOBILE.locations]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}

export default function ResultGlassShellNative({
  children,
  borderColor = "rgba(255,255,255,0.10)",
  style,
  shellStyle,
  overflowVisible = false,
  strokeOpacityStyle,
  strokeWidth = 1,
  hideGrid: _hideGrid = false,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h) : null),
    [size.w, size.h]
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
        overflowVisible && styles.rootOverflowVisible,
        style,
        shellStyle,
      ]}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.shell,
          overflowVisible && styles.shellOverflowVisible,
          hasSize ? { width: size.w, height: size.h } : styles.shellMeasuring,
        ]}
      >
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            intensity={Platform.OS === "ios" ? 28 : 16}
            tint="dark"
            {...nativeBlurViewExtraProps()}
            style={styles.glassBlur}
          />
        )}

        {hasSize && skiaPath ? (
          <Canvas
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            }}
            pointerEvents="none"
          >
            <Group clip={skiaPath}>
              <Rect
                x={0}
                y={0}
                width={size.w}
                height={size.h}
                color={GLASS_UNDERLAY}
              />
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.1, 0)}
                  end={vec(size.w * 0.9, size.h)}
                  colors={[...GLASS_FILL_MOBILE.colors]}
                  positions={[...GLASS_FILL_MOBILE.locations]}
                />
              </Rect>
            </Group>
          </Canvas>
        ) : (
          <GlassFillFallback />
        )}

        {hasSize ? (
          <View
            pointerEvents="none"
            style={[
              styles.insetTopHighlight,
              {
                width: size.w - RESULT_HIT_CYBER_CLIP_CUT,
                left: 0,
              },
            ]}
          />
        ) : (
          <View pointerEvents="none" style={styles.insetTopHighlight} />
        )}
        <View pointerEvents="none" style={styles.insetBottomShade} />

        {hasSize && skiaPath ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.borderStroke,
              {
                width: size.w,
                height: size.h,
              },
              strokeOpacityStyle,
            ]}
          >
            <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
              <Path
                path={skiaPath}
                style="stroke"
                strokeWidth={strokeWidth}
                color={borderColor}
              />
            </Canvas>
          </Animated.View>
        ) : null}

        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.58,
    shadowRadius: 32,
    elevation: 7,
  },
  rootOverflowVisible: {
    overflow: "visible",
  },
  shell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
  },
  shellMeasuring: {
    width: "100%",
  },
  shellOverflowVisible: {
    overflow: "visible",
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 8,
  },
  /** Web `ResultStreakCyberFrame` 静的枠 z-[4] — 走査光 z-[11] より下 */
  borderStroke: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 4,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    zIndex: 2,
  },
  insetBottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    zIndex: 2,
  },
});
