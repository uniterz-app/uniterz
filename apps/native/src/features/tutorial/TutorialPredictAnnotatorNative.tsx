/**
 * Web `TutorialPredictAnnotator` 相当
 * 上から順: 概要 → HOME/AWAY → 市場 → 情報タブ → スコア欄 → ボーナス → 入力 → 投稿
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
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
  TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS,
  TUTORIAL_SCRIM_OPACITY,
} from "../../../../../lib/tutorial/tutorialMotion";
import {
  measureTutorialTarget,
  scrollTutorialTargetIntoViewNative,
  subscribeTutorialTargets,
  type TutorialMeasureRect,
} from "./tutorialMeasureNative";

type Step =
  | "overview"
  | "sides"
  | "market"
  | "tools"
  | "scores"
  | "bonus"
  | "enter"
  | "submit";

type Props = {
  open: boolean;
  overviewTitle: string;
  overviewBody: string;
  sidesTitle: string;
  sidesBody: string;
  marketTitle: string;
  marketBody: string;
  toolsTitle: string;
  toolsBody: string;
  scoresTitle: string;
  scoresBody: string;
  bonusTitle: string;
  bonusBody: string;
  enterTitle: string;
  enterBody: string;
  submitTitle: string;
  submitBody: string;
  nextLabel: string;
  skipLabel: string;
  enterWaitHint: string;
  submitWaitHint: string;
  /** enter ステップで両方の得点が入っているか */
  enterReady?: boolean;
  /** 機能確認用: 前の説明ステップへ */
  backLabel?: string;
  onSkip?: () => void;
};

const PAD = 8;
/** HOME/AWAY: 上の閉じるに食い込まない（負の top = 内側へ）／戦績用に下を広げる */
const PAD_SIDES = { top: -6, right: 10, bottom: 16, left: 10 } as const;
const BLUR_INTENSITY = Math.min(28, Math.round(TUTORIAL_BG_BLUR_PX * 4));
const SCRIM_TINT = `rgba(2,6,12,${TUTORIAL_SCRIM_OPACITY})`;

function targetIdForStep(step: Step): string | null {
  switch (step) {
    case "overview":
      /** 概要は中央。次から画面上の要素を上→下で案内 */
      return null;
    case "sides":
      return "predict-sides";
    case "market":
      /** スクロールはカード上端（sides）。穴は market と結合 */
      return "predict-sides";
    case "tools":
      return "predict-tools";
    case "scores":
    case "enter":
      return "predict-scores";
    case "bonus":
      return "predict-bonus";
    case "submit":
      return "predict-submit";
    default:
      return null;
  }
}

function unionNativeRects(
  a: TutorialMeasureRect,
  b: TutorialMeasureRect
): TutorialMeasureRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: right - x, height: bottom - y };
}

/** HOME/AWAY と市場の偏りは同一カード → 穴を分けない */
async function measureMatchCardHoleNative(): Promise<TutorialMeasureRect | null> {
  const sides = await measureTutorialTarget("predict-sides");
  const market = await measureTutorialTarget("predict-market");
  if (sides && market) return unionNativeRects(sides, market);
  return sides ?? market;
}

export default function TutorialPredictAnnotatorNative({
  open,
  overviewTitle,
  overviewBody,
  sidesTitle,
  sidesBody,
  marketTitle,
  marketBody,
  toolsTitle,
  toolsBody,
  scoresTitle,
  scoresBody,
  bonusTitle,
  bonusBody,
  enterTitle,
  enterBody,
  submitTitle,
  submitBody,
  nextLabel,
  skipLabel,
  enterWaitHint,
  submitWaitHint,
  enterReady = false,
  backLabel,
  onSkip,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [step, setStep] = useState<Step>("overview");
  const [hole, setHole] = useState<TutorialMeasureRect | null>(null);
  const [focusRect, setFocusRect] = useState<TutorialMeasureRect | null>(null);
  const calloutRef = useRef<View>(null);
  const [calloutBox, setCalloutBox] = useState<TutorialMeasureRect | null>(
    null
  );
  const [revealReady, setRevealReady] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const scrimOp = useSharedValue(0);
  const floatY = useSharedValue(0);
  const breathGlow = useSharedValue(0.22);

  /** モーダル入場後に出す（同時だと一瞬シートの裏に回る） */
  useEffect(() => {
    if (!open) {
      setRevealReady(false);
      return;
    }
    if (reduceMotion) {
      setRevealReady(true);
      return;
    }
    const t = setTimeout(
      () => setRevealReady(true),
      TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS
    );
    return () => clearTimeout(t);
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open || !revealReady) {
      if (!open) setStep("overview");
      cancelAnimation(floatY);
      cancelAnimation(breathGlow);
      scrimOp.value = 0;
      floatY.value = 0;
      breathGlow.value = 0.22;
      return;
    }
    scrimOp.value = withTiming(1, {
      duration: reduceMotion ? 0 : TUTORIAL_BG_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    if (reduceMotion) {
      floatY.value = 0;
      breathGlow.value = 0.22;
      return;
    }
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
    breathGlow.value = withDelay(
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
  }, [open, revealReady, reduceMotion, scrimOp, floatY, breathGlow]);

  const targetId = targetIdForStep(step);
  /** 情報タブは実際に切り替えて見せる。入力・投稿も穴から操作させる */
  const allowHoleInteract =
    step === "tools" || step === "enter" || step === "submit";

  const copy =
    step === "overview"
      ? { title: overviewTitle, body: overviewBody }
      : step === "sides"
        ? { title: sidesTitle, body: sidesBody }
        : step === "market"
          ? { title: marketTitle, body: marketBody }
          : step === "tools"
            ? { title: toolsTitle, body: toolsBody }
            : step === "scores"
              ? { title: scoresTitle, body: scoresBody }
              : step === "bonus"
                ? { title: bonusTitle, body: bonusBody }
                : step === "enter"
                  ? { title: enterTitle, body: enterBody }
                  : { title: submitTitle, body: submitBody };

  useEffect(() => {
    if (!open) return;
    if (
      step !== "sides" &&
      step !== "market" &&
      step !== "tools" &&
      step !== "bonus"
    )
      return;
    const id =
      step === "sides"
        ? "predict-sides"
        : step === "market"
          ? "predict-market"
          : step === "tools"
            ? "predict-tools"
            : "predict-bonus";
    let cancelled = false;
    void (async () => {
      /** オーバーレイ入場直後は sides の測位が遅れることがある */
      if (step === "sides") {
        await new Promise((r) => setTimeout(r, 320));
        if (cancelled) return;
      }
      if (step === "market") {
        // 同一カードなので sides があれば market 単体が無くても穴は作れる
        const hole = await measureMatchCardHoleNative();
        if (cancelled || hole) return;
        const tools = await measureTutorialTarget("predict-tools");
        setStep(tools ? "tools" : "scores");
        return;
      }
      const r = await measureTutorialTarget(id);
      if (cancelled || r) return;
      if (step === "sides") {
        const market = await measureTutorialTarget("predict-market");
        if (market) {
          setStep("market");
          return;
        }
        const tools = await measureTutorialTarget("predict-tools");
        setStep(tools ? "tools" : "scores");
        return;
      }
      if (step === "tools") setStep("scores");
      else setStep("enter");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  useEffect(() => {
    if (!open || !targetId) {
      setHole(null);
      setFocusRect(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      await scrollTutorialTargetIntoViewNative(targetId, {
        animated: !reduceMotion,
        idealRatio:
          step === "sides" || step === "market"
            ? 0.18
            : step === "submit"
              ? 0.28
              : 0.32,
      });
      if (cancelled) return;
      if (step === "sides" || step === "market") {
        const card = await measureMatchCardHoleNative();
        const focusId = step === "market" ? "predict-market" : "predict-sides";
        const focus = await measureTutorialTarget(focusId);
        if (!cancelled) {
          setHole(card);
          setFocusRect(focus);
        }
      } else {
        const r = await measureTutorialTarget(targetId);
        if (!cancelled) {
          setHole(r);
          setFocusRect(r);
        }
      }
      requestAnimationFrame(() => {
        calloutRef.current?.measureInWindow((x, y, width, height) => {
          if (!cancelled && width > 1) {
            setCalloutBox({ x, y, width, height });
          }
        });
      });
    };
    void run();
    const t1 = setTimeout(() => void run(), 160);
    const t2 = setTimeout(() => void run(), 420);
    const unsub = subscribeTutorialTargets(() => void run());
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      unsub();
    };
  }, [open, targetId, step, reduceMotion]);

  const preferBelow = useMemo(() => {
    if (!hole) return false;
    const calloutH = calloutBox?.height ?? 280;
    const edge = 16 + TUTORIAL_FLOAT_Y_PX;
    const spaceBelow = winH - (hole.y + hole.height) - edge;
    const spaceAbove = hole.y - edge;
    const need = calloutH + 18;
    return spaceBelow >= need || (spaceBelow >= spaceAbove && spaceBelow > 96);
  }, [hole, winH, calloutBox?.height]);

  const calloutPos = useMemo(() => {
    const width = Math.min(winW - 32, 360);
    const left = (winW - width) / 2;
    const calloutH = calloutBox?.height ?? 280;
    const edge = 16 + TUTORIAL_FLOAT_Y_PX;
    const gap = 18;
    if (!hole) {
      return {
        left,
        width,
        top: Math.max(insets.top + 24, winH * 0.45),
        bottom: undefined as number | undefined,
      };
    }
    if (preferBelow) {
      return {
        left,
        width,
        top: Math.max(
          edge,
          Math.min(hole.y + hole.height + gap, winH - calloutH - edge)
        ),
        bottom: undefined as number | undefined,
      };
    }
    return {
      left,
      width,
      top: undefined as number | undefined,
      bottom: Math.min(
        Math.max(edge, winH - hole.y + gap),
        Math.max(edge, winH - calloutH - edge)
      ),
    };
  }, [hole, winW, winH, insets.top, preferBelow, calloutBox?.height]);

  const line = useMemo(() => {
    const tip = focusRect ?? hole;
    if (!tip || !calloutBox) return null;
    const hx = tip.x + tip.width / 2;
    const hy = preferBelow ? tip.y + tip.height : tip.y;
    const cx = calloutBox.x + calloutBox.width / 2;
    const cy = preferBelow
      ? calloutBox.y
      : calloutBox.y + calloutBox.height;
    return { x1: cx, y1: cy, x2: hx, y2: hy };
  }, [hole, focusRect, calloutBox, preferBelow]);

  const showFocusNav =
    focusRect != null &&
    hole != null &&
    (step === "sides" || step === "market");

  const focusNavLabel =
    step === "market"
      ? marketTitle
      : step === "sides"
        ? sidesTitle
        : copy.title;

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOp.value,
  }));

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    shadowOpacity: breathGlow.value,
  }));
  const focusPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + breathGlow.value,
    shadowOpacity: 0.35 + breathGlow.value,
    shadowRadius: 8 + breathGlow.value * 36,
  }));

  const goNext = () => {
    if (step === "enter" && !enterReady) return;
    void (async () => {
      if (step === "overview") {
        /** 入場直後は測れないことがあるので、まず HOME/AWAY へ進む */
        setStep("sides");
        return;
      }
      if (step === "sides") {
        const market = await measureTutorialTarget("predict-market");
        if (market) {
          setStep("market");
          return;
        }
        const tools = await measureTutorialTarget("predict-tools");
        setStep(tools ? "tools" : "scores");
        return;
      }
      if (step === "market") {
        const tools = await measureTutorialTarget("predict-tools");
        setStep(tools ? "tools" : "scores");
        return;
      }
      if (step === "tools") {
        setStep("scores");
        return;
      }
      if (step === "scores") {
        const r = await measureTutorialTarget("predict-bonus");
        setStep(r ? "bonus" : "enter");
        return;
      }
      if (step === "bonus") setStep("enter");
      else if (step === "enter") setStep("submit");
    })();
  };

  const goBack = () => {
    void (async () => {
      if (step === "sides") {
        setStep("overview");
        return;
      }
      if (step === "market") {
        const sides = await measureTutorialTarget("predict-sides");
        setStep(sides ? "sides" : "overview");
        return;
      }
      if (step === "tools") {
        const market = await measureTutorialTarget("predict-market");
        if (market) {
          setStep("market");
          return;
        }
        const sides = await measureTutorialTarget("predict-sides");
        setStep(sides ? "sides" : "overview");
        return;
      }
      if (step === "scores") {
        const tools = await measureTutorialTarget("predict-tools");
        if (tools) {
          setStep("tools");
          return;
        }
        const market = await measureTutorialTarget("predict-market");
        if (market) {
          setStep("market");
          return;
        }
        const sides = await measureTutorialTarget("predict-sides");
        setStep(sides ? "sides" : "overview");
        return;
      }
      if (step === "bonus") {
        setStep("scores");
        return;
      }
      if (step === "enter") {
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "scores");
        return;
      }
      if (step === "submit") setStep("enter");
    })();
  };

  if (!open || !revealReady) return null;

  const pad =
    step === "sides"
      ? PAD_SIDES
      : { top: PAD, right: PAD, bottom: PAD, left: PAD };
  const hx = hole ? hole.x - pad.left : 0;
  const hy = hole ? hole.y - pad.top : 0;
  const hw = hole ? hole.width + pad.left + pad.right : 0;
  const hh = hole ? hole.height + pad.top + pad.bottom : 0;
  const showNext = step !== "submit";
  const enterBlocked = step === "enter" && !enterReady;
  const waitHint =
    step === "enter"
      ? enterBlocked
        ? enterWaitHint
        : null
      : step === "submit"
        ? submitWaitHint
        : null;

  function panel(style: object) {
    return (
      <View style={[styles.panel, style]} pointerEvents="auto">
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          {...nativeBlurViewExtraProps()}
        />
        <View style={styles.tint} />
      </View>
    );
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        style={[StyleSheet.absoluteFillObject, scrimStyle]}
        pointerEvents="box-none"
      >
        {hole ? (
          <>
            {panel({ top: 0, left: 0, right: 0, height: Math.max(0, hy) })}
            {panel({ top: hy + hh, left: 0, right: 0, bottom: 0 })}
            {panel({ top: hy, left: 0, width: Math.max(0, hx), height: hh })}
            {panel({ top: hy, left: hx + hw, right: 0, height: hh })}
            <View
              pointerEvents="none"
              style={[
                styles.holeRing,
                showFocusNav && styles.holeRingSoft,
                { top: hy, left: hx, width: hw, height: hh },
              ]}
            />
            {showFocusNav && focusRect ? (
              <View
                pointerEvents="none"
                style={[
                  styles.focusNav,
                  {
                    top: focusRect.y - 2,
                    left: focusRect.x - 2,
                    width: focusRect.width + 4,
                    height: focusRect.height + 4,
                  },
                ]}
              >
                <Animated.View
                  style={[styles.focusRing, focusPulseStyle]}
                />
                <View style={styles.focusBadge}>
                  <Text style={styles.focusBadgeText} numberOfLines={1}>
                    {focusNavLabel}
                  </Text>
                </View>
              </View>
            ) : null}
            {!allowHoleInteract ? (
              <View
                pointerEvents="auto"
                style={{
                  position: "absolute",
                  top: hy,
                  left: hx,
                  width: hw,
                  height: hh,
                }}
              />
            ) : null}
          </>
        ) : (
          panel(StyleSheet.absoluteFillObject)
        )}
      </Animated.View>

      {line ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={winW}
          height={winH}
        >
          <Defs>
            <Marker
              id="predictArrow"
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
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={TUTORIAL_CYAN}
            strokeWidth={2}
            strokeDasharray="5 4"
            markerEnd="url(#predictArrow)"
            opacity={0.9}
          />
        </Svg>
      ) : null}

      <Animated.View
        ref={calloutRef}
        style={[
          styles.callout,
          breathStyle,
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
        collapsable={false}
      >
        <BlurView
          intensity={TUTORIAL_CALLOUT_GLASS_BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          {...nativeBlurViewExtraProps()}
        />
        <View pointerEvents="none" style={styles.calloutGlassTint} />
        <View style={styles.calloutInner}>
        <View style={styles.head}>
          <Text style={styles.kicker}>Tutorial</Text>
          {onSkip ? (
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text style={styles.skip}>{skipLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        {showNext ? (
          <>
            {waitHint ? <Text style={styles.wait}>{waitHint}</Text> : null}
            <View style={styles.ctaRow}>
              {step !== "overview" && backLabel ? (
                <Pressable style={styles.backBtn} onPress={goBack}>
                  <Text style={styles.backText}>{backLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.cta, enterBlocked && styles.ctaDisabled]}
                onPress={goNext}
                disabled={enterBlocked}
              >
                <Text style={styles.ctaText}>{nextLabel}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.submitBackWrap}>
            {waitHint ? <Text style={styles.wait}>{waitHint}</Text> : null}
            {backLabel ? (
              <Pressable style={styles.backBtnFull} onPress={goBack}>
                <Text style={styles.backText}>{backLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  panel: {
    position: "absolute",
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_TINT,
  },
  holeRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  holeRingSoft: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  focusNav: {
    position: "absolute",
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOffset: { width: 0, height: 0 },
  },
  focusBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    left: "15%",
    right: "15%",
    alignItems: "center",
  },
  focusBadgeText: {
    overflow: "hidden",
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: TUTORIAL_CYAN,
    color: "#050508",
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
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
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  wait: {
    textAlign: "center",
    color: "rgba(165,243,252,0.85)",
    fontSize: 12,
    marginBottom: 10,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 8,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnFull: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 11,
    alignItems: "center",
  },
  backText: {
    fontFamily: fonts.metric,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  submitBackWrap: {
    gap: 8,
  },
  cta: {
    flex: 1,
    backgroundColor: TUTORIAL_CYAN,
    paddingVertical: 11,
    alignItems: "center",
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
