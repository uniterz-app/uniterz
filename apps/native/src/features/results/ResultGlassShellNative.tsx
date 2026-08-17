/**
 * Web `ResultGlassShell` + リザルト外枠相当。
 * 塗りはモバイル `RESULT_GLASS_FILL_MOBILE` に準拠。
 * 四隅すべて斜め切り（左上・右下の直角は出さない）。
 * 枠は外枠−内枠の塗りリング。Canvas は透明クリア。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  PathOp,
  Rect,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import {
  chamferedRectPathD,
  insetChamferedRectPathD,
} from "../games/matchListCyberClipPath";
import { RESULT_HIT_CYBER_CLIP_CUT } from "./resultHitCyberClipPath";

/** 枠ブルームが Canvas 端で切れないよう外側余白 */
const BORDER_BLOOM_PAD = 12;

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
  const d = chamferedRectPathD(width, height, RESULT_HIT_CYBER_CLIP_CUT);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** 外枠 − 内枠 = 隙間のない枠リング */
function makeBorderRingPath(
  width: number,
  height: number,
  strokeWidth: number
): SkPath | null {
  const cut = RESULT_HIT_CYBER_CLIP_CUT;
  const outerD = chamferedRectPathD(width, height, cut);
  const innerD = insetChamferedRectPathD(width, height, cut, strokeWidth);
  if (!outerD || !innerD) return null;
  const outer = Skia.Path.MakeFromSVGString(outerD);
  const inner = Skia.Path.MakeFromSVGString(innerD);
  if (!outer || !inner) return null;
  return Skia.Path.MakeFromOp(outer, inner, PathOp.Difference);
}

function GlassFillFallback() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...GLASS_FILL_MOBILE.colors]}
      locations={[...GLASS_FILL_MOBILE.locations]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

/** rgba の alpha だけ差し替えてブルーム色を作る */
function borderGlowColor(color: string, alpha: number): string {
  const m = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (!m) return `rgba(251,191,36,${alpha})`;
  return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
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

  const borderRingPath = useMemo(
    () =>
      strokeWidth > 0 && size.w > 0 && size.h > 0
        ? makeBorderRingPath(size.w, size.h, strokeWidth)
        : null,
    [size.w, size.h, strokeWidth]
  );

  /** ブルーム用 — コア枠より太いリング（外側へ広がる分は Canvas 余白内） */
  const bloomRingPath = useMemo(() => {
    if (size.w <= 0 || size.h <= 0 || strokeWidth <= 1) return null;
    return makeBorderRingPath(size.w, size.h, strokeWidth + 4);
  }, [size.w, size.h, strokeWidth]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;
  const canvasW = size.w + BORDER_BLOOM_PAD * 2;
  const canvasH = size.h + BORDER_BLOOM_PAD * 2;
  const topLineLeft = RESULT_HIT_CYBER_CLIP_CUT;
  const topLineWidth = hasSize
    ? Math.max(0, size.w - RESULT_HIT_CYBER_CLIP_CUT * 2)
    : 0;

  return (
    <View
      style={[
        styles.root,
        style,
        shellStyle,
        /** 親の shadow* / overflow:hidden を打ち消し — 角切り外の黒い三角・クリップを防ぐ */
        styles.noRectShadow,
        styles.forceClipSafe,
        overflowVisible && styles.rootOverflowVisible,
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
        {hasSize && skiaPath ? (
          <Canvas
            opaque={false}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
              zIndex: 1,
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

        {hasSize && topLineWidth > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.insetTopHighlight,
              {
                width: topLineWidth,
                left: topLineLeft,
              },
            ]}
          />
        ) : null}
        <View pointerEvents="none" style={styles.insetBottomShade} />

        {hasSize && borderRingPath ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.borderStroke,
              {
                left: -BORDER_BLOOM_PAD,
                top: -BORDER_BLOOM_PAD,
                width: canvasW,
                height: canvasH,
              },
              strokeOpacityStyle,
            ]}
          >
            <Canvas
              opaque={false}
              style={{ width: canvasW, height: canvasH }}
              pointerEvents="none"
            >
              <Group
                transform={[
                  { translateX: BORDER_BLOOM_PAD },
                  { translateY: BORDER_BLOOM_PAD },
                ]}
              >
                {bloomRingPath ? (
                  <Path
                    path={bloomRingPath}
                    style="fill"
                    color={borderGlowColor(borderColor, 0.38)}
                  >
                    <BlurMask blur={4.5} style="normal" />
                  </Path>
                ) : null}
                <Path
                  path={borderRingPath}
                  style="fill"
                  color={borderColor}
                />
              </Group>
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
    backgroundColor: "transparent",
  },
  /** 角切り外へ矩形の黒い影を出さない */
  noRectShadow: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    backgroundColor: "transparent",
  },
  forceClipSafe: {
    overflow: "visible",
  },
  rootOverflowVisible: {
    overflow: "visible",
  },
  shell: {
    position: "relative",
    overflow: "visible",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  shellMeasuring: {
    width: "100%",
  },
  shellOverflowVisible: {
    overflow: "visible",
  },
  content: {
    position: "relative",
    zIndex: 8,
  },
  borderStroke: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 5,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    zIndex: 2,
  },
  insetBottomShade: {
    position: "absolute",
    bottom: 0,
    left: RESULT_HIT_CYBER_CLIP_CUT,
    right: RESULT_HIT_CYBER_CLIP_CUT,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    zIndex: 2,
  },
});
