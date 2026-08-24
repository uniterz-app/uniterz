/**
 * 試合一覧の線枠シェル。塗りカードではなく、上下ラベルで途切れた直角ストローク。
 */
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { MATCH_CARD_METRIC_FONT } from "./matchCardTypography";
import {
  GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_MS,
  GAMES_LINE_FRAME_DRAW_MS,
} from "./gamesCyberMotion";
import { gamesCyberEaseBezier } from "./gamesPageMotion";
import {
  interruptedRoundedRectStrokeHalves,
  MATCH_LINE_FRAME_STROKE,
  MATCH_LINE_FRAME_TOP_GAP_START_INSET,
  matchLineFrameLabelMaxWidth,
  matchLineFramePaint,
} from "@/lib/games/matchListLineFrame";
import { registerTutorialTarget } from "../tutorial/tutorialMeasureNative";

export {
  MATCH_LINE_FRAME_BLUE,
  MATCH_LINE_FRAME_GOLD,
  MATCH_LINE_FRAME_BLUE_MUTED,
  MATCH_LINE_FRAME_GOLD_MUTED,
  matchLineFramePaint,
  resultOutcomeLineFramePaint,
} from "@/lib/games/matchListLineFrame";

const RADIUS = 0;
const STROKE = MATCH_LINE_FRAME_STROKE;
const LABEL_GAP_PAD = 16;
const MIN_TICK_GAP = 12;
const CTA_WIDTH_PROBE = "REGULAR SEASON";

type Props = {
  children: ReactNode;
  topLabel?: string;
  /** 上辺ラベル位置。プロフィール概要は start */
  topLabelAlign?: "center" | "start";
  /** ピックアップ時の左辺略号（RS / PO） */
  leftLabel?: string;
  /** 省略時は下辺 CTA なし（リザルトカードなど） */
  bottomLabel?: string;
  predicted?: boolean;
  pickup?: boolean;
  /** 指定時は pickup / predicted より優先（HIT / MISS など） */
  paint?: { color: string; glow: string };
  style?: StyleProp<ViewStyle>;
  /**
   * 0→1 で線枠をパスに沿って描く。未指定は最初から全線。
   * ラウンドラベル左右から同時に半周し、下の CTA で合わせる。
   * `animateDraw` 指定時は無視（計測後にこちらで描画する）。
   */
  strokeEnd?: SharedValue<number>;
  /** 左辺ラベルをチュートリアル測定対象にする */
  leftLabelTutorialTarget?: string | null;
  /** 左辺ラベルを強調（チュートリアル用） */
  leftLabelPulse?: boolean;
  /**
   * true: サイズとラベル幅が取れてから、左右パスを 0→1 で描く。
   * 親の SharedValue より先に Canvas が無いと描画が見えないため、枠側で開始する。
   */
  animateDraw?: boolean;
  /** `animateDraw` の追加遅延（ms）。一覧スタッガー用 */
  drawDelayMs?: number;
  /** 上辺ラベル用の外側マージンを付けない（My Rank など） */
  flush?: boolean;
  /** 上辺を閉じる（My Rank。左右から同時に描いて中央で接続） */
  closedTop?: boolean;
  /** Web 相当。枠パスのあと中身をフェードイン */
  fadeContent?: boolean;
};

function makeHalves(
  width: number,
  height: number,
  topGap: number,
  bottomGap: number,
  leftGap: number,
  topGapAlign: "center" | "start"
) {
  const halves = interruptedRoundedRectStrokeHalves({
    width,
    height,
    radius: RADIUS,
    inset: STROKE / 2,
    topGap,
    bottomGap,
    leftGap,
    topGapAlign,
    topGapStartInset: MATCH_LINE_FRAME_TOP_GAP_START_INSET,
  });
  if (!halves) return null;
  const left = Skia.Path.MakeFromSVGString(halves.left);
  const right = Skia.Path.MakeFromSVGString(halves.right);
  if (!left || !right) return null;
  return { left, right };
}

export default function MatchListLineFrameNative({
  children,
  topLabel,
  topLabelAlign = "center",
  leftLabel,
  bottomLabel,
  predicted = false,
  pickup = false,
  paint,
  style,
  strokeEnd,
  leftLabelTutorialTarget = null,
  leftLabelPulse = false,
  animateDraw = false,
  drawDelayMs = 0,
  flush = false,
  closedTop = false,
  fadeContent = false,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [topLabelW, setTopLabelW] = useState(0);
  const [ctaFixedW, setCtaFixedW] = useState(0);
  const [bottomCtaH, setBottomCtaH] = useState(0);
  const [leftLabelH, setLeftLabelH] = useState(0);
  const leftLabelMeasureRef = useRef<View>(null);
  const { color, glow } = paint ?? matchLineFramePaint({ pickup, predicted });

  useEffect(() => {
    if (!leftLabelTutorialTarget || !leftLabel) return;
    return registerTutorialTarget(leftLabelTutorialTarget, () =>
      new Promise((resolve) => {
        const node = leftLabelMeasureRef.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) resolve({ x, y, width, height });
          else resolve(null);
        });
      })
    );
  }, [leftLabel, leftLabelTutorialTarget]);

  const showCta = Boolean(bottomLabel);
  const labelMaxW = matchLineFrameLabelMaxWidth({
    frameWidth: size.w,
    align: topLabelAlign,
  });
  const topGap = closedTop
    ? 0
    : topLabel && topLabelW > 0
      ? topLabelW + LABEL_GAP_PAD
      : MIN_TICK_GAP;
  const bottomGap = !showCta
    ? 0
    : ctaFixedW > 0
      ? ctaFixedW + LABEL_GAP_PAD
      : 88;
  const leftGap =
    leftLabel && leftLabelH > 0 ? leftLabelH + LABEL_GAP_PAD : 0;

  const skiaHalves = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makeHalves(size.w, size.h, topGap, bottomGap, leftGap, topLabelAlign)
        : null,
    [size.w, size.h, topGap, bottomGap, leftGap, topLabelAlign]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) {
      return;
    }
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;
  const labelReady = !topLabel || topLabelW > 0;
  const ctaReady = !showCta || ctaFixedW > 0;
  const ready =
    hasSize &&
    skiaHalves != null &&
    labelReady &&
    (animateDraw ? ctaReady : true);

  const fallbackStrokeEnd = useSharedValue(1);
  const localDrawEnd = useSharedValue(animateDraw ? 0 : 1);
  const canvasReveal = useSharedValue(animateDraw ? 0 : 1);
  const contentOpacity = useSharedValue(animateDraw && fadeContent ? 0 : 1);
  const strokeProgress = animateDraw
    ? localDrawEnd
    : (strokeEnd ?? fallbackStrokeEnd);

  useLayoutEffect(() => {
    if (!animateDraw) {
      localDrawEnd.value = 1;
      canvasReveal.value = 1;
      contentOpacity.value = 1;
      return;
    }
    if (!ready) {
      localDrawEnd.value = 0;
      canvasReveal.value = 0;
      if (fadeContent) contentOpacity.value = 0;
      return;
    }
    /** Skia の初回フレームは不透明黒になりやすい。隠してから枠を描く */
    localDrawEnd.value = 0;
    canvasReveal.value = 0;
    if (fadeContent) contentOpacity.value = 0;
    const delay = Math.max(0, drawDelayMs);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        canvasReveal.value = 1;
        localDrawEnd.value = withDelay(
          delay,
          withTiming(1, {
            duration: GAMES_LINE_FRAME_DRAW_MS,
            easing: gamesCyberEaseBezier,
          })
        );
        if (fadeContent) {
          contentOpacity.value = withDelay(
            delay +
              GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_MS +
              GAMES_LINE_FRAME_DRAW_MS +
              40,
            withTiming(1, {
              duration: 280,
              easing: gamesCyberEaseBezier,
            })
          );
        } else {
          contentOpacity.value = 1;
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimation(contentOpacity);
    };
  }, [
    animateDraw,
    fadeContent,
    ready,
    drawDelayMs,
    localDrawEnd,
    canvasReveal,
    contentOpacity,
  ]);

  const canvasRevealStyle = useAnimatedStyle(() => ({
    opacity: canvasReveal.value,
  }));
  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const topLabelAnim = useAnimatedStyle(() => ({
    opacity: interpolate(
      strokeProgress.value,
      [0, 0.12],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));
  const leftLabelAnim = useAnimatedStyle(() => ({
    opacity: interpolate(
      strokeProgress.value,
      [0.42, 0.58],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));
  const ctaAnim = useAnimatedStyle(() => ({
    opacity: interpolate(
      strokeProgress.value,
      [0.82, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const strokePaths =
    ready && skiaHalves ? (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.canvas,
          { width: size.w, height: size.h },
          canvasRevealStyle,
        ]}
      >
        <Canvas
          opaque={false}
          pointerEvents="none"
          style={{
            width: size.w,
            height: size.h,
            backgroundColor: "transparent",
          }}
        >
        <Path
          path={skiaHalves.right}
          style="stroke"
          strokeWidth={5}
          color={glow}
          strokeCap="round"
          strokeJoin="miter"
          start={0}
          end={strokeProgress as unknown as number}
        />
        <Path
          path={skiaHalves.left}
          style="stroke"
          strokeWidth={5}
          color={glow}
          strokeCap="round"
          strokeJoin="miter"
          start={0}
          end={strokeProgress as unknown as number}
        />
        <Path
          path={skiaHalves.right}
          style="stroke"
          strokeWidth={STROKE}
          color={color}
          strokeCap="round"
          strokeJoin="miter"
          start={0}
          end={strokeProgress as unknown as number}
        />
        <Path
          path={skiaHalves.left}
          style="stroke"
          strokeWidth={STROKE}
          color={color}
          strokeCap="round"
          strokeJoin="miter"
          start={0}
          end={strokeProgress as unknown as number}
        />
        </Canvas>
      </Animated.View>
    ) : null;

  return (
    <View
      collapsable={false}
      pointerEvents="box-none"
      style={[
        styles.root,
        !showCta ? styles.rootNoCta : null,
        flush ? styles.rootFlush : null,
        style,
      ]}
      onLayout={onLayout}
    >
      {showCta ? (
      <View pointerEvents="none" style={styles.ctaWidthProbe}>
        <View
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (Math.abs(w - ctaFixedW) > 0.5) setCtaFixedW(w);
          }}
        >
          <Text style={styles.label}>{CTA_WIDTH_PROBE}</Text>
        </View>
      </View>
      ) : null}

      <Animated.View pointerEvents="auto" style={[styles.content, contentFadeStyle]}>
        {children}
      </Animated.View>

      {strokePaths}

      {leftLabel ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.leftLabelWrap, leftLabelAnim]}
        >
          <View
            ref={leftLabelMeasureRef}
            collapsable={false}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (Math.abs(h - leftLabelH) > 0.5) setLeftLabelH(h);
            }}
            style={styles.leftLabelStack}
          >
            {leftLabel.split("").map((ch, i) =>
              ch === " " ? (
                <View key={`sp-${i}`} style={styles.leftLabelSpace} />
              ) : (
                <Text
                  key={`${ch}-${i}`}
                  style={[
                    styles.leftLabelChar,
                    { color },
                    leftLabelPulse ? styles.leftLabelCharEmphasis : null,
                  ]}
                >
                  {ch}
                </Text>
              )
            )}
          </View>
        </Animated.View>
      ) : null}

      {topLabel ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.topLabelWrap,
            topLabelAlign === "start" ? styles.topLabelWrapStart : null,
            topLabelAnim,
          ]}
        >
          <View
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (Math.abs(w - topLabelW) > 0.5) setTopLabelW(w);
            }}
          >
            <Text
              style={[
                styles.label,
                { color },
                styles.labelSkew,
                topLabelAlign === "start" ? styles.labelStart : null,
                labelMaxW > 0 ? { maxWidth: labelMaxW } : null,
              ]}
              numberOfLines={1}
            >
              {topLabel}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {showCta ? (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bottomCtaWrap,
          ctaAnim,
          bottomCtaH > 0
            ? { transform: [{ translateY: bottomCtaH / 2 - STROKE }] }
            : null,
        ]}
      >
        <View
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            if (Math.abs(height - bottomCtaH) > 0.5) setBottomCtaH(height);
          }}
          style={[
            styles.cta,
            ctaFixedW > 0 ? { width: ctaFixedW, minWidth: ctaFixedW } : null,
            {
              borderColor: color,
              backgroundColor: "transparent",
            },
          ]}
        >
          <Text style={[styles.ctaLabel, { color }]} numberOfLines={1}>
            {bottomLabel ?? ""}
          </Text>
        </View>
      </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
    marginTop: 14,
    marginBottom: 18,
  },
  rootNoCta: {
    marginBottom: 0,
  },
  rootFlush: {
    marginTop: 0,
    marginBottom: 0,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
    zIndex: 2,
    backgroundColor: "transparent",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  leftLabelWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    transform: [{ translateX: -8 }],
  },
  leftLabelStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  leftLabelChar: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 14,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  leftLabelCharEmphasis: {
    fontSize: 14,
    lineHeight: 15,
  },
  leftLabelSpace: {
    height: 5,
  },
  topLabelWrap: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 3,
    transform: [{ translateY: -10 }],
  },
  topLabelWrapStart: {
    left: MATCH_LINE_FRAME_TOP_GAP_START_INSET + LABEL_GAP_PAD / 2,
    alignItems: "flex-start",
  },
  bottomCtaWrap: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 18,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
    maxWidth: "100%",
  },
  labelSkew: {
    transform: [{ skewX: "-10deg" }],
  },
  labelStart: {
    textAlign: "left",
  },
  ctaWidthProbe: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    zIndex: 0,
  },
  cta: {
    borderWidth: 1.5,
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
  },
});
