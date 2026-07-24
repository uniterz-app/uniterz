/**
 * Web `TutorialLiveCoach` 相当 — 本番画面上のコーチマーク
 * 対象なし・ナビ誘導は中央 + 誘導線。カード等は穴の近く。
 * 開始時に背景ぼかしをフェードイン。nav-* 時は Modal でタブバーより前面。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, Line, Marker, Path } from "react-native-svg";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import {
  TUTORIAL_BG_BLUR_PX,
  TUTORIAL_BG_FADE_MS,
  TUTORIAL_CALLOUT_DURATION_MS,
  TUTORIAL_CALLOUT_GLASS_BG,
  TUTORIAL_CALLOUT_GLASS_BLUR_INTENSITY,
  TUTORIAL_CYAN,
  TUTORIAL_FLOAT_PERIOD_MS,
  TUTORIAL_FLOAT_Y_PX,
  TUTORIAL_SCRIM_OPACITY,
} from "../../../../../lib/tutorial/tutorialMotion";
import {
  measureTutorialTarget,
  scrollTutorialTargetIntoViewNative,
  subscribeTutorialTargets,
  type TutorialMeasureRect,
} from "./tutorialMeasureNative";
import type { TutorialVisualId } from "../../../../../lib/tutorial/tutorialCopy";
import TutorialCoachVisualNative from "./TutorialCoachVisualNative";

type Props = {
  open: boolean;
  title: string;
  body: string;
  skipLabel: string;
  nextLabel?: string;
  target?: string | null;
  waitHint?: string | null;
  onSkip: () => void;
  onNext?: () => void;
  /** 機能確認用: 前のステップへ戻る */
  onBack?: () => void;
  backLabel?: string;
  /** 穴をタップしたとき（ナビ誘導など） */
  onTargetPress?: () => void;
  /** false で穴の枠線を出さない（PulseHint と二重になるとき） */
  showHoleRing?: boolean;
  /** 詳細確認用: 背後を操作でき、ぼかしを弱くする */
  allowInteractBehind?: boolean;
  /** 図解（文字だけのモーダルを避ける） */
  visual?: TutorialVisualId | null;
};

const CALLOUT_GAP = 14;
const CALLOUT_EST_H = 320;
/** Web の blur px より控えめに（背後が読める程度） */
const BLUR_INTENSITY = Math.min(28, Math.round(TUTORIAL_BG_BLUR_PX * 4));
const SCRIM_TINT = `rgba(2,6,12,${TUTORIAL_SCRIM_OPACITY})`;

export default function TutorialLiveCoachNative({
  open,
  title,
  body,
  skipLabel,
  nextLabel,
  target = null,
  waitHint = null,
  onSkip,
  onNext,
  onBack,
  backLabel,
  onTargetPress,
  showHoleRing = true,
  allowInteractBehind = false,
  visual = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const [hole, setHole] = useState<TutorialMeasureRect | null>(null);
  const calloutMeasureRef = useRef<View>(null);
  const [calloutBox, setCalloutBox] = useState<TutorialMeasureRect | null>(
    null
  );
  const aboveTabBar = !!target?.startsWith("nav-");
  const reduceMotion = useReducedMotion() ?? false;
  /** ターゲットなし／画面全体説明は全面ぼかし禁止 */
  const softBackdrop = allowInteractBehind || !target;
  /** 画面全体説明は下。ナビ・対象なしは中央。カード等は穴の近く */
  const calloutPinnedBottom = allowInteractBehind;
  const preferCenterCallout =
    !calloutPinnedBottom && (!target || aboveTabBar || !hole);

  const scrimOp = useSharedValue(0);
  const calloutOp = useSharedValue(0);
  const calloutY = useSharedValue(14);
  const floatY = useSharedValue(0);
  const calloutGlow = useSharedValue(0.22);

  useEffect(() => {
    if (!open) {
      cancelAnimation(floatY);
      cancelAnimation(calloutGlow);
      scrimOp.value = 0;
      calloutOp.value = 0;
      calloutY.value = 14;
      floatY.value = 0;
      calloutGlow.value = 0.22;
      return;
    }
    if (reduceMotion) {
      scrimOp.value = 1;
      calloutOp.value = 1;
      calloutY.value = 0;
      floatY.value = 0;
      calloutGlow.value = 0.22;
      return;
    }
    scrimOp.value = withTiming(1, {
      duration: TUTORIAL_BG_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    calloutOp.value = withTiming(1, {
      duration: TUTORIAL_CALLOUT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
    calloutY.value = withTiming(0, {
      duration: TUTORIAL_CALLOUT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
    const half = Math.round(TUTORIAL_FLOAT_PERIOD_MS / 2);
    floatY.value = withDelay(
      TUTORIAL_CALLOUT_DURATION_MS,
      withRepeat(
        withSequence(
          withTiming(-TUTORIAL_FLOAT_Y_PX, {
            duration: half,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: half,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );
    calloutGlow.value = withDelay(
      TUTORIAL_CALLOUT_DURATION_MS,
      withRepeat(
        withSequence(
          withTiming(0.32, {
            duration: half,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.2, {
            duration: half,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );
  }, [
    open,
    reduceMotion,
    scrimOp,
    calloutOp,
    calloutY,
    floatY,
    calloutGlow,
  ]);

  useEffect(() => {
    if (!open || !target) {
      setHole(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (!target.startsWith("nav-")) {
        const scrollId =
          (target === "result-detail-score" ||
            target === "result-detail-stats") &&
          (await measureTutorialTarget("predict-sides"))
            ? "predict-sides"
            : target;
        await scrollTutorialTargetIntoViewNative(scrollId, {
          animated: !reduceMotion,
          idealRatio:
            target === "result-detail-score" ||
            target === "result-detail-stats"
              ? 0.16
              : 0.28,
        });
      }
      if (cancelled) return;

      let r = await measureTutorialTarget(target);
      if (
        r &&
        (target === "result-detail-score" || target === "result-detail-stats")
      ) {
        const sides = await measureTutorialTarget("predict-sides");
        const score =
          target === "result-detail-stats"
            ? await measureTutorialTarget("result-detail-score")
            : null;
        const parts = [r, sides, score].filter(
          (x): x is TutorialMeasureRect => x != null
        );
        if (parts.length > 1) {
          const x = Math.min(...parts.map((p) => p.x));
          const y = Math.min(...parts.map((p) => p.y));
          const right = Math.max(...parts.map((p) => p.x + p.width));
          const bottom = Math.max(...parts.map((p) => p.y + p.height));
          r = { x, y, width: right - x, height: bottom - y };
        }
      }
      if (cancelled || !r) {
        if (!cancelled) setHole(null);
        return;
      }
      await new Promise<void>((resolve) => {
        const node = rootRef.current;
        if (!node) {
          if (!cancelled) setHole(r);
          resolve();
          return;
        }
        node.measureInWindow((ox, oy) => {
          if (!cancelled) {
            setHole({
              x: r!.x - ox,
              y: r!.y - oy,
              width: r!.width,
              height: r!.height,
            });
          }
          resolve();
        });
      });
    };
    void run();
    const t1 = setTimeout(() => void run(), 120);
    const t2 = setTimeout(() => void run(), 400);
    const unsub = subscribeTutorialTargets(() => void run());
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      unsub();
    };
  }, [open, target, reduceMotion]);

  const calloutPos = useMemo(() => {
    const width = Math.min(winW - 32, 360);
    const left = (winW - width) / 2;

    if (calloutPinnedBottom) {
      return {
        left,
        width,
        top: undefined as number | undefined,
        bottom: Math.max(16, insets.bottom + 72),
      };
    }

    if (preferCenterCallout) {
      return {
        left,
        width,
        top: Math.max(insets.top + 24, winH * 0.5 - CALLOUT_EST_H / 2),
        bottom: undefined as number | undefined,
      };
    }

    const pad = 6;
    const hy = hole!.y - pad;
    const hh = hole!.height + pad * 2;
    const holeMidY = hy + hh / 2;
    const preferAbove =
      holeMidY > winH * 0.55 || winH - (hy + hh) < CALLOUT_EST_H;

    if (preferAbove) {
      return {
        left,
        width,
        top: undefined as number | undefined,
        bottom: Math.max(16, winH - hy + CALLOUT_GAP),
      };
    }

    return {
      left,
      width,
      top: hy + hh + CALLOUT_GAP,
      bottom: undefined as number | undefined,
    };
  }, [
    hole,
    winW,
    winH,
    insets.top,
    insets.bottom,
    calloutPinnedBottom,
    preferCenterCallout,
  ]);

  useEffect(() => {
    if (!open) {
      setCalloutBox(null);
      return;
    }
    let cancelled = false;
    const measureCallout = () => {
      const node = calloutMeasureRef.current;
      const root = rootRef.current;
      if (!node || !root) return;
      root.measureInWindow((ox, oy) => {
        node.measureInWindow((x, y, width, height) => {
          if (cancelled || width < 1) return;
          setCalloutBox({
            x: x - ox,
            y: y - oy,
            width,
            height,
          });
        });
      });
    };
    const t1 = setTimeout(measureCallout, 80);
    const t2 = setTimeout(measureCallout, 320);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    open,
    target,
    calloutPos.top,
    calloutPos.bottom,
    calloutPos.width,
    title,
    body,
  ]);

  const guideLine = useMemo(() => {
    if (!hole || !calloutBox) return null;
    const holeMidY = hole.y + hole.height / 2;
    const calloutMidY = calloutBox.y + calloutBox.height / 2;
    const holeIsAbove = holeMidY < calloutMidY;
    const cx = calloutBox.x + calloutBox.width / 2;
    const cy = holeIsAbove ? calloutBox.y : calloutBox.y + calloutBox.height;
    const hx = hole.x + hole.width / 2;
    const hy = holeIsAbove ? hole.y + hole.height : hole.y;
    return { x1: cx, y1: cy, x2: hx, y2: hy };
  }, [hole, calloutBox]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOp.value,
  }));

  const calloutAnimStyle = useAnimatedStyle(() => ({
    opacity: calloutOp.value,
    transform: [
      { translateY: calloutY.value + floatY.value },
    ],
    shadowOpacity: calloutGlow.value,
  }));

  if (!open) return null;

  const pad = target === "match-card" ? 14 : 6;
  const hx = hole ? hole.x - pad : 0;
  const hy = hole ? hole.y - pad : 0;
  const hw = hole ? hole.width + pad * 2 : 0;
  const hh = hole ? hole.height + pad * 2 : 0;

  function renderScrimPanel(style: object) {
    return (
      <View style={[styles.scrimPanel, style]} pointerEvents="auto">
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          {...nativeBlurViewExtraProps()}
        />
        <View style={styles.scrimTint} />
      </View>
    );
  }

  const content = (
    <View
      ref={rootRef}
      style={[styles.root, softBackdrop ? styles.rootAboveDetail : null]}
      pointerEvents="box-none"
      collapsable={false}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, scrimStyle]}
        pointerEvents="box-none"
      >
        {softBackdrop ? (
          <View
            pointerEvents="none"
            style={[
              styles.bottomFade,
              { height: Math.min(winH * 0.38, 300) },
            ]}
          />
        ) : hole ? (
          <>
            {renderScrimPanel({
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, hy),
            })}
            {renderScrimPanel({
              top: hy + hh,
              left: 0,
              right: 0,
              bottom: 0,
            })}
            {renderScrimPanel({
              top: hy,
              left: 0,
              width: Math.max(0, hx),
              height: hh,
            })}
            {renderScrimPanel({
              top: hy,
              left: hx + hw,
              right: 0,
              height: hh,
            })}
            {onTargetPress ? (
              <Pressable
                onPress={onTargetPress}
                style={[
                  styles.holeHit,
                  { top: hy, left: hx, width: hw, height: hh },
                ]}
              />
            ) : null}
            {showHoleRing ? (
              <View
                pointerEvents="none"
                style={[
                  styles.holeRing,
                  { top: hy, left: hx, width: hw, height: hh },
                ]}
              />
            ) : null}
          </>
        ) : null}
      </Animated.View>

      {guideLine ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          width={winW}
          height={winH}
        >
          <Defs>
            <Marker
              id="tutorialLiveCoachArrow"
              markerWidth={8}
              markerHeight={8}
              refX={6}
              refY={3}
              orient="auto"
            >
              <Path d="M0,0 L6,3 L0,6 Z" fill={TUTORIAL_CYAN} />
            </Marker>
          </Defs>
          <Line
            x1={guideLine.x1}
            y1={guideLine.y1}
            x2={guideLine.x2}
            y2={guideLine.y2}
            stroke={TUTORIAL_CYAN}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            markerEnd="url(#tutorialLiveCoachArrow)"
            opacity={0.92}
          />
        </Svg>
      ) : null}

      <Animated.View
        ref={calloutMeasureRef}
        collapsable={false}
        style={[
          styles.callout,
          calloutAnimStyle,
          {
            left: calloutPos.left,
            width: calloutPos.width,
            ...(calloutPos.top != null ? { top: calloutPos.top } : {}),
            ...(calloutPos.bottom != null
              ? { bottom: calloutPos.bottom }
              : {}),
          },
        ]}
        pointerEvents="auto"
      >
        <BlurView
          intensity={TUTORIAL_CALLOUT_GLASS_BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          {...nativeBlurViewExtraProps()}
        />
        <View pointerEvents="none" style={styles.calloutGlassTint} />
        <View style={styles.calloutInner}>
        <View style={styles.calloutHead}>
          <Text style={styles.kicker}>Tutorial</Text>
          <Pressable onPress={onSkip} hitSlop={8}>
            <Text style={styles.skip}>{skipLabel}</Text>
          </Pressable>
        </View>
        {visual ? (
          <View style={styles.visualWrap}>
            <TutorialCoachVisualNative visual={visual} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {waitHint ? <Text style={styles.wait}>{waitHint}</Text> : null}
        {onBack || (onNext && nextLabel) ? (
          <View style={styles.ctaRow}>
            {onBack && backLabel ? (
              <Pressable
                style={[
                  styles.backBtn,
                  !(onNext && nextLabel) && styles.backBtnAlone,
                ]}
                onPress={onBack}
              >
                <Text style={styles.backText}>{backLabel}</Text>
              </Pressable>
            ) : null}
            {onNext && nextLabel ? (
              <Pressable style={styles.cta} onPress={onNext}>
                <Text style={styles.ctaText}>{nextLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        </View>
      </Animated.View>
    </View>
  );

  if (aboveTabBar) {
    return (
      <Modal visible transparent animationType="fade" statusBarTranslucent>
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  rootAboveDetail: {
    zIndex: 240,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(2,6,12,0.32)",
  },
  scrimPanel: {
    position: "absolute",
    overflow: "hidden",
  },
  scrimTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_TINT,
  },
  holeHit: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  holeRing: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  callout: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "transparent",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  calloutGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TUTORIAL_CALLOUT_GLASS_BG,
  },
  calloutInner: {
    position: "relative",
    padding: 16,
  },
  calloutHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  visualWrap: {
    marginBottom: 10,
  },
  kicker: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 2,
    color: TUTORIAL_CYAN,
    textTransform: "uppercase",
  },
  skip: {
    fontFamily: fonts.metric,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  wait: {
    textAlign: "center",
    color: "rgba(165,243,252,0.75)",
    fontSize: 12,
    marginBottom: 8,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnAlone: {
    flex: 1,
  },
  backText: {
    fontFamily: fonts.metric,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cta: {
    flex: 1,
    backgroundColor: TUTORIAL_CYAN,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
