/**
 * Web `TutorialLiveCoach` 相当 — 本番画面上のコーチマーク
 * 対象なし・ナビ誘導は中央。カード等は穴の近く。
 * 開始時に背景をフェードイン。nav-* 時は Modal でタブバーより前面。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable as RNPressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
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
import { LinearGradient } from "expo-linear-gradient";
import {
  TUTORIAL_CYAN,
  TUTORIAL_COACH_CALLOUT_DELAY_MS,
  TUTORIAL_COACH_CALLOUT_MS,
  TUTORIAL_COACH_SCRIM_MS,
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
import TutorialRichBodyNative from "./TutorialRichBodyNative";
import { chamferedRectPathD, PREDICT_OVERLAY_CYBER_CUT } from "../games/matchListCyberClipPath";
import { resultHitCyberClipPathD } from "../results/resultHitCyberClipPath";

/** 再測の微小差で枠が跳ねないようにする */
function rectNearlyEqual(
  a: TutorialMeasureRect,
  b: TutorialMeasureRect,
  eps = 2.5
): boolean {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.width - b.width) < eps &&
    Math.abs(a.height - b.height) < eps
  );
}

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
  /** 主要フェーズ進捗（例: 3 / 11） */
  progressLabel?: string | null;
};

const CALLOUT_GAP = 14;
/** 穴付近配置の目安高さ（中央配置は flex で実高さ中央に合わせる） */
const CALLOUT_EST_H = 320;
/** Web の blur px より控えめに（背後が読める程度） */
/** Blur なしでも穴が読めるよう少し濃くする */
const SCRIM_TINT = `rgba(2,6,12,${Math.min(0.52, TUTORIAL_SCRIM_OPACITY + 0.14)})`;

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
  progressLabel = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const [hole, setHole] = useState<TutorialMeasureRect | null>(null);
  const holeRef = useRef<TutorialMeasureRect | null>(null);
  /**
   * スクロール／測位が終わるまで吹き出しを出さない。
   * （モーダルだけ先に出て、枠が後から動くズレを防ぐ）
   */
  const [spotlightReady, setSpotlightReady] = useState(false);
  const aboveTabBar = !!target?.startsWith("nav-");
  const reduceMotion = useReducedMotion() ?? false;
  /**
   * 試合カードは Modal にすると背面に隠れて穴座標もずれやすい。
   * 同一ツリー上で弱いディム + 穴 Pressable で onTargetPress を拾う。
   */
  /** 試合カード・リザルトカードは穴 Pressable で誘導（Modal だとズレやすい） */
  const cardTapTarget =
    !!onTargetPress &&
    (target === "match-card" || target === "result-card");
  const isResultDetailTarget =
    target === "result-detail-score" ||
    target === "result-detail-stats" ||
    target === "result-detail-more" ||
    target === "result-detail-card";
  /**
   * ソフト背景（ぼかしなし）:
   * - allowInteractBehind / ターゲットなし
   * - 試合・リザルト一覧カード（角切りシェルに矩形くり抜きを当てると枠ずれに見える）
   * リザルト詳細は穴あきぼかしでフォーカスを強くする
   */
  const softBackdrop =
    allowInteractBehind ||
    !target ||
    (cardTapTarget &&
      (target === "match-card" || target === "result-card"));
  /** カード誘導・UNIT コインはコールアウトを下固定し、穴／自己紹介と重ねない */
  const calloutPinnedBottom =
    allowInteractBehind || cardTapTarget || target === "profile-unit-coin";
  const preferCenterCallout =
    !calloutPinnedBottom && (!target || aboveTabBar || !hole);
  /** 最初の briefing は背後を落として競技 HUD 感を出す */
  const isWelcomeBriefing = visual === "welcome" && !target;

  const scrimOp = useSharedValue(0);
  const calloutOp = useSharedValue(0);
  const calloutY = useSharedValue(14);
  const floatY = useSharedValue(0);
  /** 最初の welcome モーダルだけ浮遊 */
  const enableFloat = visual === "welcome";

  useEffect(() => {
    if (!open) {
      cancelAnimation(floatY);
      scrimOp.value = 0;
      calloutOp.value = 0;
      calloutY.value = 0;
      floatY.value = 0;
      setSpotlightReady(false);
      return;
    }
    /**
     * 対象あり: 枠の測位完了まで吹き出しを隠す。
     * 対象なし（welcome）: すぐ出す。
     */
    if (target && !spotlightReady) {
      cancelAnimation(calloutOp);
      cancelAnimation(calloutY);
      cancelAnimation(floatY);
      calloutOp.value = 0;
      calloutY.value = 14;
      floatY.value = 0;
      if (reduceMotion) {
        scrimOp.value = 1;
      } else {
        scrimOp.value = withTiming(1, {
          duration: TUTORIAL_COACH_SCRIM_MS,
          easing: Easing.out(Easing.cubic),
        });
      }
      return;
    }
    if (reduceMotion) {
      scrimOp.value = 1;
      calloutOp.value = 1;
      calloutY.value = 0;
      floatY.value = 0;
      return;
    }
    /** 暗幕 → 一拍 → 吹き出し（枠と同時タイミング） */
    calloutY.value = 16;
    scrimOp.value = withTiming(1, {
      duration: TUTORIAL_COACH_SCRIM_MS,
      easing: Easing.out(Easing.cubic),
    });
    calloutOp.value = withDelay(
      target ? 40 : TUTORIAL_COACH_CALLOUT_DELAY_MS,
      withTiming(1, {
        duration: TUTORIAL_COACH_CALLOUT_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
    calloutY.value = withDelay(
      target ? 40 : TUTORIAL_COACH_CALLOUT_DELAY_MS,
      withTiming(0, {
        duration: TUTORIAL_COACH_CALLOUT_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
    cancelAnimation(floatY);
    floatY.value = 0;
    if (!enableFloat) return;
    const half = Math.round(TUTORIAL_FLOAT_PERIOD_MS / 2);
    const floatDelay = target
      ? TUTORIAL_COACH_CALLOUT_MS + 160
      : TUTORIAL_COACH_CALLOUT_DELAY_MS + TUTORIAL_COACH_CALLOUT_MS + 120;
    floatY.value = withDelay(
      floatDelay,
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
  }, [
    open,
    target,
    spotlightReady,
    reduceMotion,
    enableFloat,
    scrimOp,
    calloutOp,
    calloutY,
    floatY,
  ]);

  useEffect(() => {
    if (!open) {
      setHole(null);
      holeRef.current = null;
      setSpotlightReady(false);
      return;
    }
    if (!target) {
      setHole(null);
      holeRef.current = null;
      setSpotlightReady(true);
      return;
    }
    let cancelled = false;
    const isResultDetailTarget =
      target === "result-detail-score" ||
      target === "result-detail-stats" ||
      target === "result-detail-more" ||
      target === "result-detail-card";

    /** スクロール中に旧枠が残るとモーダルとズレて見えるので一旦消す */
    setSpotlightReady(false);
    setHole(null);
    holeRef.current = null;

    const commitHole = (next: TutorialMeasureRect | null) => {
      if (next == null) {
        holeRef.current = null;
        setHole(null);
        return;
      }
      if (holeRef.current && rectNearlyEqual(holeRef.current, next)) return;
      holeRef.current = next;
      setHole(next);
    };

    const run = async (doScroll: boolean) => {
      /** 詳細オーバーレイ上の対象は一覧 ScrollHost を動かさない（枠ずれの元） */
      if (doScroll && !target.startsWith("nav-") && !isResultDetailTarget) {
        /**
         * カード誘導は Web 同様に即時寄せ。
         * クロール中に下固定モーダルだけ先に出ると「枠の動きと合わない」。
         */
        const snapCard =
          target === "result-card" || target === "match-card";
        if (target === "result-card") {
          await scrollTutorialTargetIntoViewNative(target, {
            animated: false,
            align: "top",
            topPad: Math.max(insets.top + 128, 152),
          });
        } else {
          await scrollTutorialTargetIntoViewNative(target, {
            animated: snapCard ? false : !reduceMotion,
            idealRatio: 0.28,
          });
        }
      }
      if (cancelled) return;

      let r = await measureTutorialTarget(target);
      if (
        target === "result-detail-score" ||
        target === "result-detail-stats"
      ) {
        /** カード全体の登録があればそれを優先（union 測位のズレを避ける） */
        const card = await measureTutorialTarget("result-detail-card");
        if (card) {
          r = card;
        } else if (r) {
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
      }
      if (cancelled || !r) {
        if (!cancelled) commitHole(null);
        return;
      }
      await new Promise<void>((resolve) => {
        const node = rootRef.current;
        if (!node) {
          if (!cancelled) {
            commitHole(r);
            setSpotlightReady(true);
          }
          resolve();
          return;
        }
        node.measureInWindow((ox, oy) => {
          if (!cancelled) {
            commitHole({
              x: r!.x - ox,
              y: r!.y - oy,
              width: r!.width,
              height: r!.height,
            });
            setSpotlightReady(true);
          }
          resolve();
        });
      });
    };
    void run(true);
    /** スクロール定着後の再測は1回だけ（多重再測はカクつきの元） */
    const t1 = setTimeout(
      () => void run(false),
      target === "result-card" || isResultDetailTarget
        ? 720
        : reduceMotion
          ? 280
          : 620
    );
    const unsub = subscribeTutorialTargets(() => void run(false));
    return () => {
      cancelled = true;
      clearTimeout(t1);
      unsub();
    };
  }, [open, target, reduceMotion, insets.top]);

  const calloutPos = useMemo(() => {
    const width = Math.min(winW - 32, 360);
    const left = (winW - width) / 2;

    if (calloutPinnedBottom) {
      return {
        left,
        width,
        top: undefined as number | undefined,
        bottom: Math.max(16, insets.bottom + 72),
        center: false as const,
      };
    }

    if (preferCenterCallout) {
      /** Web の `top:50%; translate(-50%,-50%)` 相当。配置は flex 中央で行う */
      return {
        left,
        width,
        top: undefined as number | undefined,
        bottom: undefined as number | undefined,
        center: true as const,
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
        center: false as const,
      };
    }

    return {
      left,
      width,
      top: hy + hh + (target === "match-card" ? CALLOUT_GAP + 10 : CALLOUT_GAP),
      bottom: undefined as number | undefined,
      center: false as const,
    };
  }, [
    hole,
    winW,
    winH,
    insets.bottom,
    calloutPinnedBottom,
    preferCenterCallout,
    target,
  ]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOp.value,
  }));

  const calloutFadeStyle = useAnimatedStyle(() => ({
    opacity: calloutOp.value,
    transform: [{ translateY: calloutY.value + floatY.value }],
  }));

  if (!open) return null;

  /** リザルト系は角切りシェル。余白なし＋chamfer 枠で実カードに合わせる */
  const pad =
    target === "result-card" || isResultDetailTarget
      ? 0
      : target === "match-card"
        ? 2
        : target === "profile-unit-coin"
          ? 8
          : 6;
  const hx = hole ? hole.x - pad : 0;
  const hy = hole ? hole.y - pad : 0;
  const hw = hole ? hole.width + pad * 2 : 0;
  const hh = hole ? hole.height + pad * 2 : 0;

  function renderHoleRing(top: number, left: number, width: number, height: number) {
    if (!showHoleRing || width < 2 || height < 2) return null;
    if (target === "result-card" || isResultDetailTarget) {
      const d =
        target === "result-card"
          ? resultHitCyberClipPathD(width, height)
          : chamferedRectPathD(width, height, PREDICT_OVERLAY_CYBER_CUT);
      if (!d) return null;
      return (
        <Svg
          pointerEvents="none"
          style={{ position: "absolute", top, left }}
          width={width}
          height={height}
        >
          <Path
            d={d}
            stroke={TUTORIAL_CYAN}
            strokeWidth={2}
            fill="none"
            opacity={0.95}
          />
        </Svg>
      );
    }
    /** UNIT 残高はコイン＋数字のカプセルに合わせて完全な丸端 */
    const roundPill = target === "profile-unit-coin";
    return (
      <View
        pointerEvents="none"
        style={[
          styles.holeRing,
          roundPill ? styles.holeRingPill : null,
          {
            top,
            left,
            width,
            height,
            ...(roundPill
              ? { borderRadius: Math.min(width, height) / 2 }
              : null),
          },
        ]}
      />
    );
  }

  function renderScrimPanel(style: object) {
    /** BlurView はフェード中にカクつくので単色ディムのみ */
    return (
      <View style={[styles.scrimPanel, style]} pointerEvents="auto">
        <View style={styles.scrimTint} pointerEvents="none" />
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
      {/* absoluteFill のラッパは穴のタッチを吸うことがあるので、板だけ置く */}
      {softBackdrop ? (
        <>
          {isWelcomeBriefing ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.welcomeDim, scrimStyle]}
            />
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bottomFade,
              scrimStyle,
              {
                height: Math.min(
                  winH * (isWelcomeBriefing ? 0.55 : 0.38),
                  isWelcomeBriefing ? 420 : 300
                ),
              },
            ]}
          />
          {/* 試合/リザルトカード: 背面は見せたまま、穴だけ押せる */}
          {hole && onTargetPress ? (
            <RNPressable
              accessibilityRole="button"
              accessibilityLabel={waitHint ?? title}
              onPress={onTargetPress}
              collapsable={false}
              style={[
                styles.holeHit,
                {
                  top: hy,
                  left: hx,
                  width: Math.max(1, hw),
                  height: Math.max(1, hh),
                },
              ]}
            />
          ) : null}
          {hole && showHoleRing ? renderHoleRing(hy, hx, hw, hh) : null}
        </>
      ) : hole ? (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, scrimStyle]}
          pointerEvents="box-none"
        >
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
              accessibilityRole="button"
              accessibilityLabel={waitHint ?? title}
              onPress={onTargetPress}
              collapsable={false}
              style={[
                styles.holeHit,
                {
                  top: hy,
                  left: hx,
                  width: Math.max(1, hw),
                  height: Math.max(1, hh),
                },
              ]}
            />
          ) : null}
          {showHoleRing ? renderHoleRing(hy, hx, hw, hh) : null}
        </Animated.View>
      ) : (
        /** 穴未測でも全面ディム（半透明モーダル＋プロフィール文字の透けを防ぐ） */
        <Animated.View
          style={[StyleSheet.absoluteFillObject, scrimStyle]}
          pointerEvents="box-none"
        >
          {renderScrimPanel(StyleSheet.absoluteFillObject)}
        </Animated.View>
      )}

      {(() => {
        const calloutBody = (
          <View
            style={[
              styles.calloutChrome,
              isWelcomeBriefing ? styles.calloutChromeWelcome : null,
            ]}
          >
            {isWelcomeBriefing ? (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    "rgba(0,245,255,0.22)",
                    "rgba(0,245,255,0.04)",
                    "transparent",
                  ]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.welcomeChromeWash}
                />
                <View pointerEvents="none" style={styles.welcomeEdgeTop} />
                <View
                  pointerEvents="none"
                  style={[styles.welcomeTick, styles.welcomeTickTL]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.welcomeTick, styles.welcomeTickTR]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.welcomeTick, styles.welcomeTickBL]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.welcomeTick, styles.welcomeTickBR]}
                />
              </>
            ) : (
              <View pointerEvents="none" style={styles.calloutGlassTint} />
            )}
            <View style={styles.calloutInner}>
              <View style={styles.calloutHead}>
                <Text style={styles.kicker}>
                  {progressLabel
                    ? isWelcomeBriefing
                      ? `MISSION · ${progressLabel}`
                      : `Tutorial · ${progressLabel}`
                    : "Tutorial"}
                </Text>
                <Pressable onPress={onSkip} hitSlop={8}>
                  <Text style={styles.skip}>{skipLabel}</Text>
                </Pressable>
              </View>
              {visual ? (
                <View style={styles.visualWrap}>
                  <TutorialCoachVisualNative visual={visual} />
                </View>
              ) : null}
              <Text
                style={[
                  styles.title,
                  isWelcomeBriefing ? styles.titleWelcome : null,
                ]}
              >
                {title}
              </Text>
              <TutorialRichBodyNative text={body} style={styles.body} />
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
                    <Pressable
                      style={[
                        styles.cta,
                        isWelcomeBriefing ? styles.ctaWelcome : null,
                      ]}
                      onPress={onNext}
                    >
                      {isWelcomeBriefing ? (
                        <LinearGradient
                          colors={["#5CFFF8", TUTORIAL_CYAN, "#00D4E8"]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.ctaText,
                          isWelcomeBriefing ? styles.ctaTextWelcome : null,
                        ]}
                      >
                        {nextLabel}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );

        if (calloutPos.center) {
          return (
            <View
              style={[
                styles.centerSlot,
                {
                  paddingTop: insets.top + 16,
                  paddingBottom: Math.max(16, insets.bottom + 16),
                },
              ]}
              pointerEvents="box-none"
            >
              <Animated.View
                collapsable={false}
                style={[calloutFadeStyle, { width: calloutPos.width }]}
                pointerEvents="auto"
              >
                {calloutBody}
              </Animated.View>
            </View>
          );
        }

        return (
          <Animated.View
            collapsable={false}
            style={[
              styles.calloutShell,
              calloutFadeStyle,
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
            {calloutBody}
          </Animated.View>
        );
      })()}
    </View>
  );

  /** ナビ誘導のみ Modal（タブバーより前面）。試合カードは同一ツリーでヒット */
  if (aboveTabBar) {
    return (
      <Modal visible transparent animationType="none" statusBarTranslucent>
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
  welcomeDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,12,0.58)",
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
    zIndex: 50,
    // シミュレータで透明だとクリックが落ちることがある
    backgroundColor: "rgba(0, 245, 255, 0.06)",
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
  holeRingPill: {
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  calloutShell: {
    position: "absolute",
  },
  /** Web の translate(-50%, -50%) 相当 */
  centerSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  calloutChrome: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    /** Native は Blur 無しなので不透明（背後の bio 等がタイトルに被らない） */
    backgroundColor: "#060E18",
  },
  calloutChromeWelcome: {
    borderColor: "rgba(0,245,255,0.55)",
    backgroundColor: "#040C14",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeChromeWash: {
    ...StyleSheet.absoluteFillObject,
  },
  welcomeEdgeTop: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeTick: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: TUTORIAL_CYAN,
  },
  welcomeTickTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  welcomeTickTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  welcomeTickBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  welcomeTickBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  calloutGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#08121C",
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
  titleWelcome: {
    fontSize: 19,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,245,255,0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
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
    justifyContent: "center",
  },
  ctaWelcome: {
    overflow: "hidden",
    backgroundColor: "transparent",
    paddingVertical: 14,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  ctaTextWelcome: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "800",
  },
});
