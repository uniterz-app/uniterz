/**
 * Web `TutorialLiveCoach` 相当 — 本番画面上のコーチマーク
 * 対象なし・ナビ誘導は中央。カード等は穴の近く。
 * 開始時に背景をフェードイン。nav-* 時は Modal でタブバーより前面。
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable as RNPressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
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
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import {
  TUTORIAL_CYAN,
  TUTORIAL_FEATURE_ACCENT,
  TUTORIAL_FEATURE_ACCENT_DEEP,
  TUTORIAL_FEATURE_ACCENT_SOFT,
  TUTORIAL_WELCOME_CTA_CYAN_EXTRUDE,
  TUTORIAL_WELCOME_CTA_CYAN_FACE,
  TUTORIAL_WELCOME_CTA_MAGENTA_EXTRUDE,
  TUTORIAL_WELCOME_CTA_MAGENTA_FACE,
  TUTORIAL_COACH_CALLOUT_DELAY_MS,
  TUTORIAL_COACH_CALLOUT_MS,
  TUTORIAL_COACH_SCRIM_MS,
  TUTORIAL_FLOAT_PERIOD_MS,
  TUTORIAL_FLOAT_Y_PX,
  TUTORIAL_SCRIM_OPACITY,
  TUTORIAL_WELCOME_AUTO_FLY_DELAY_MS,
  TUTORIAL_WELCOME_PART_MS,
} from "../../../../../lib/tutorial/tutorialMotion";
import {
  measureTutorialTarget,
  scrollTutorialTargetIntoViewNative,
  setTutorialScrollEnabledNative,
  subscribeTutorialTargets,
  type TutorialMeasureRect,
} from "./tutorialMeasureNative";
import type { TutorialVisualId } from "../../../../../lib/tutorial/tutorialCopy";
import TutorialCoachVisualNative from "./TutorialCoachVisualNative";
import TutorialRichBodyNative from "./TutorialRichBodyNative";
import { chamferedRectPathD, PREDICT_OVERLAY_CYBER_CUT } from "../games/matchListCyberClipPath";

/** welcome 各項目をカードなしで集合入場させる */
function WelcomeFloatNative({
  active = true,
  delayMs = 0,
  fromY = 28,
  fade = true,
  style,
  children,
}: {
  active?: boolean;
  delayMs?: number;
  fromY?: number;
  fade?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(active && fade ? fromY : 0);
  const op = useSharedValue(active && fade ? 0 : 1);

  useEffect(() => {
    cancelAnimation(y);
    cancelAnimation(op);
    if (!active || reduceMotion || !fade) {
      y.value = 0;
      op.value = 1;
      return;
    }
    y.value = fromY;
    op.value = 0;
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    y.value = withDelay(
      delayMs,
      withTiming(0, { duration: TUTORIAL_WELCOME_PART_MS, easing: ease })
    );
    op.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: Math.round(TUTORIAL_WELCOME_PART_MS * 0.75),
        easing: Easing.out(Easing.cubic),
      })
    );
    return () => {
      cancelAnimation(y);
      cancelAnimation(op);
    };
  }, [active, delayMs, fade, fromY, op, reduceMotion, y]);

  const anim = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: y.value }],
  }));

  if (!active) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** welcome CTA — 面グラデ + 下側押し出しで厚みを出す */
function WelcomeCtaPlateNative({
  variant,
  label,
  disabled,
  onPress,
}: {
  variant: "primary" | "alt";
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const isPrimary = variant === "primary";
  return (
    <RNPressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.welcomeBtnHit,
        pressed && styles.welcomeBtnHitPressed,
      ]}
    >
      <LinearGradient
        colors={
          isPrimary
            ? [...TUTORIAL_WELCOME_CTA_CYAN_EXTRUDE]
            : [...TUTORIAL_WELCOME_CTA_MAGENTA_EXTRUDE]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.welcomePlinth}
      />
      <View
        style={[
          styles.welcomeFace,
          isPrimary ? styles.welcomeFacePrimary : styles.welcomeFaceAlt,
        ]}
      >
        <LinearGradient
          colors={
            isPrimary
              ? [...TUTORIAL_WELCOME_CTA_CYAN_FACE]
              : [...TUTORIAL_WELCOME_CTA_MAGENTA_FACE]
          }
          locations={isPrimary ? [0, 0.42, 1] : [0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          pointerEvents="none"
          style={isPrimary ? styles.welcomeSheen : styles.welcomeSheenAlt}
        />
        <View
          pointerEvents="none"
          style={isPrimary ? styles.welcomeShadePrimary : styles.welcomeShadeAlt}
        />
        <Text
          style={isPrimary ? styles.welcomePrimaryText : styles.welcomeAltText}
        >
          {label}
        </Text>
      </View>
    </RNPressable>
  );
}

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

export type TutorialCoachAccentTone = "cyan" | "feature";

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
  /** welcome の二択など */
  altNextLabel?: string;
  onAltNext?: () => void;
  /** welcome「画面を案内」/「新機能だけ」: カメラ前進の開始 */
  onWelcomeFlyStart?: (dest: "full" | "features") => void;
  /**
   * welcome を試合ページと同じカメラに載せる。
   * true のとき独自暗幕 / 独自 fly をしない。
   */
  embedInCamera?: boolean;
  /** プロフィール引き渡し時など、マウント後に自動でカメラ前進 */
  autoWelcomeFly?: "full" | "features";
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
  /** スキップ前の確認（未指定なら即スキップ） */
  skipConfirmTitle?: string | null;
  skipConfirmBody?: string | null;
  skipConfirmStay?: string | null;
  skipConfirmLeave?: string | null;
  /** 新機能（horizon）はマゼンタ系で通常と差別化 */
  accentTone?: TutorialCoachAccentTone;
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
  altNextLabel,
  onAltNext,
  onWelcomeFlyStart,
  embedInCamera = false,
  autoWelcomeFly,
  onTargetPress,
  showHoleRing = true,
  allowInteractBehind = false,
  visual = null,
  progressLabel = null,
  skipConfirmTitle = null,
  skipConfirmBody = null,
  skipConfirmStay = null,
  skipConfirmLeave = null,
  accentTone = "cyan",
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const [hole, setHole] = useState<TutorialMeasureRect | null>(null);
  const holeRef = useRef<TutorialMeasureRect | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [welcomeFlying, setWelcomeFlying] = useState(false);
  const welcomeFlyingRef = useRef(false);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onAltNextRef = useRef(onAltNext);
  onAltNextRef.current = onAltNext;
  const onWelcomeFlyStartRef = useRef(onWelcomeFlyStart);
  onWelcomeFlyStartRef.current = onWelcomeFlyStart;
  const isFeatureTone = accentTone === "feature";
  const accent = isFeatureTone ? TUTORIAL_FEATURE_ACCENT : TUTORIAL_CYAN;
  const accentSoft = isFeatureTone ? TUTORIAL_FEATURE_ACCENT_SOFT : "#5CFFF8";
  const accentDeep = isFeatureTone ? TUTORIAL_FEATURE_ACCENT_DEEP : "#00D4E8";
  const requestSkip = () => {
    if (skipConfirmTitle && skipConfirmBody) {
      setSkipConfirmOpen(true);
      return;
    }
    onSkip();
  };
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
    target === "result-detail-card" ||
    target === "result-detail-metrics";
  /** 最初の briefing — 背面を落として競技導入の場にする */
  const isWelcomeBriefing = visual === "welcome" && !target;
  /**
   * リザルト詳細は RN Modal 上にあるため、コーチも Modal に載せる。
   * welcome は Modal にすると expo-gl（3D ロゴ）が描画されないので同一ツリー＋全面ディム。
   */
  const useOverlayModal = aboveTabBar || isResultDetailTarget;
  /**
   * ソフト背景（ぼかしなし）:
   * - allowInteractBehind
   * - 試合・リザルト一覧カード
   * welcome は全面ディム（soft にしない）
   */
  const softBackdrop =
    allowInteractBehind ||
    (cardTapTarget &&
      (target === "match-card" || target === "result-card"));
  /** カード誘導・UNIT コインはコールアウトを下固定し、穴／自己紹介と重ねない */
  const calloutPinnedBottom =
    allowInteractBehind || cardTapTarget || target === "profile-unit-coin";
  /** welcome / 詳細は中央。他は穴の近く */
  const preferCenterCallout =
    isWelcomeBriefing ||
    isResultDetailTarget ||
    target === "profile-career-tab" ||
    (!calloutPinnedBottom && (!target || aboveTabBar || !hole));

  useEffect(() => {
    if (!open) {
      setSkipConfirmOpen(false);
      setWelcomeFlying(false);
      welcomeFlyingRef.current = false;
    }
  }, [open, title, target]);

  const scrimOp = useSharedValue(0);
  const calloutOp = useSharedValue(0);
  const calloutY = useSharedValue(14);
  const floatY = useSharedValue(0);
  /** welcome は expo-gl を載せるため、親の transform 浮遊は使わない */
  const enableFloat = false;

  const beginWelcomeGuide = useCallback((dest: "full" | "features") => {
    if (welcomeFlyingRef.current) return;
    const finish =
      dest === "features" ? onAltNextRef.current : onNextRef.current;
    if (!finish) return;
    if (reduceMotion || !onWelcomeFlyStartRef.current) {
      finish();
      return;
    }
    welcomeFlyingRef.current = true;
    setWelcomeFlying(true);
    onWelcomeFlyStartRef.current(dest);
  }, [reduceMotion]);

  const didAutoFly = useRef(false);
  useEffect(() => {
    if (!autoWelcomeFly || !open || didAutoFly.current) return;
    const id = setTimeout(() => {
      didAutoFly.current = true;
      beginWelcomeGuide(autoWelcomeFly);
    }, TUTORIAL_WELCOME_AUTO_FLY_DELAY_MS);
    return () => clearTimeout(id);
  }, [autoWelcomeFly, beginWelcomeGuide, open]);

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
    /** 追い抜き中は入場アニメで上書きしない */
    if (welcomeFlyingRef.current) return;
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
      setTutorialScrollEnabledNative(true);
      return;
    }
    if (!target) {
      setHole(null);
      holeRef.current = null;
      setSpotlightReady(true);
      /** welcome 静止中は試合リストを動かさない */
      setTutorialScrollEnabledNative(visual !== "welcome");
      return;
    }
    let cancelled = false;
    const isResultDetailTarget =
      target === "result-detail-score" ||
      target === "result-detail-stats" ||
      target === "result-detail-more" ||
      target === "result-detail-card" ||
      target === "result-detail-metrics";

    /** カード枠合わせ中にユーザーがスクロールすると枠がズレる */
    const lockListScroll =
      target === "result-card" || target === "match-card";
    if (lockListScroll) {
      setTutorialScrollEnabledNative(false);
    } else {
      setTutorialScrollEnabledNative(true);
    }

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
          ? 160
          : 240
    );
    /**
     * 詳細ターゲットは Modal 内で遅れて mount する。
     * 測位が取れなくても吹き出し（次へ）は出す。
     */
    const readyFallback = setTimeout(
      () => {
        if (!cancelled) setSpotlightReady(true);
      },
      isResultDetailTarget ? 480 : 360
    );
    const unsub = subscribeTutorialTargets(() => void run(false));
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(readyFallback);
      unsub();
      if (lockListScroll) {
        setTutorialScrollEnabledNative(true);
      }
    };
  }, [open, target, visual, reduceMotion, insets.top]);

  const calloutPos = useMemo(() => {
    const width = Math.min(
      winW - (isWelcomeBriefing ? 16 : 32),
      isWelcomeBriefing ? 440 : 360
    );
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
    isWelcomeBriefing,
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

  /** 新カード面は直角枠。穴パッドはカード枠線に重ねるため 0 */
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
    /** 本番リザルト新カード面は自身がシアン枠を持つ。二重枠がズレて見えるのでリングは出さない */
    if (target === "result-card") {
      return null;
    }
    if (isResultDetailTarget) {
      const d = chamferedRectPathD(width, height, PREDICT_OVERLAY_CYBER_CUT);
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
            stroke={accent}
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
          { borderColor: accent, shadowColor: accent },
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
        <View
          style={[
            styles.scrimTint,
            isWelcomeBriefing ? styles.scrimTintWelcome : null,
          ]}
          pointerEvents="none"
        />
      </View>
    );
  }

  const content = (
    <View
      ref={rootRef}
      style={[
        styles.root,
        softBackdrop ? styles.rootAboveDetail : null,
        isWelcomeBriefing ? styles.rootWelcome : null,
      ]}
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
      ) : isWelcomeBriefing && embedInCamera ? (
        welcomeFlying ? null : (
          <View pointerEvents="auto" style={styles.welcomeEmbedScrim} />
        )
      ) : isWelcomeBriefing && !embedInCamera ? (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, scrimStyle]}
          pointerEvents={welcomeFlying ? "none" : "auto"}
        >
          <BlurView
            intensity={48}
            tint="dark"
            {...nativeBlurViewExtraProps()}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={styles.welcomeBlurDim} />
        </Animated.View>
      ) : isWelcomeBriefing ? null : (
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
              !isWelcomeBriefing && isFeatureTone
                ? {
                    borderColor: "rgba(255,78,200,0.55)",
                    backgroundColor: "#140810",
                    shadowColor: TUTORIAL_FEATURE_ACCENT,
                    shadowOpacity: 0.32,
                    shadowRadius: 18,
                  }
                : null,
            ]}
          >
            {isWelcomeBriefing ? null : (
              <View pointerEvents="none" style={styles.calloutGlassTint} />
            )}
            <View
              style={[
                styles.calloutInner,
                isWelcomeBriefing ? styles.calloutInnerWelcome : null,
              ]}
            >
              <WelcomeFloatNative
                active={isWelcomeBriefing}
                delayMs={40}
                fromY={-22}
                style={isWelcomeBriefing ? styles.welcomeLayerHead : undefined}
              >
                <View
                  style={[
                    styles.calloutHead,
                    isWelcomeBriefing ? styles.calloutHeadWelcome : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.kicker,
                      { color: accent },
                      isWelcomeBriefing ? styles.kickerWelcome : null,
                    ]}
                  >
                    {skipConfirmOpen
                      ? "Confirm"
                      : progressLabel
                        ? isWelcomeBriefing
                          ? `MISSION · ${progressLabel}`
                          : isFeatureTone
                            ? `New · ${progressLabel}`
                            : `Tutorial · ${progressLabel}`
                        : isFeatureTone
                          ? "New"
                          : "Tutorial"}
                  </Text>
                  {skipConfirmOpen ? (
                    <View />
                  ) : (
                    <Pressable onPress={requestSkip} hitSlop={8}>
                      <Text
                        style={[
                          styles.skip,
                          isWelcomeBriefing ? styles.kickerWelcome : null,
                        ]}
                      >
                        {skipLabel}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </WelcomeFloatNative>
              {skipConfirmOpen ? (
                <>
                  <WelcomeFloatNative
                    active={isWelcomeBriefing}
                    delayMs={120}
                    style={isWelcomeBriefing ? styles.welcomeLayerTitle : undefined}
                  >
                    <Text
                      style={[
                        styles.title,
                        isWelcomeBriefing ? styles.titleWelcome : null,
                      ]}
                    >
                      {skipConfirmTitle}
                    </Text>
                  </WelcomeFloatNative>
                  <WelcomeFloatNative
                    active={isWelcomeBriefing}
                    delayMs={220}
                    style={isWelcomeBriefing ? styles.welcomeLayerBody : undefined}
                  >
                    <TutorialRichBodyNative
                      text={skipConfirmBody ?? ""}
                      style={[
                        styles.body,
                        isWelcomeBriefing ? styles.bodyWelcome : null,
                      ]}
                    />
                  </WelcomeFloatNative>
                  <WelcomeFloatNative active={isWelcomeBriefing} delayMs={360}>
                    <View style={styles.ctaRow}>
                      <Pressable
                        style={[styles.backBtn, styles.backBtnAlone]}
                        onPress={() => setSkipConfirmOpen(false)}
                      >
                        <Text style={styles.backText}>
                          {skipConfirmStay ?? "OK"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.cta,
                          styles.ctaSkipConfirm,
                          isWelcomeBriefing ? styles.ctaSkipConfirmFloat : null,
                        ]}
                        onPress={() => {
                          setSkipConfirmOpen(false);
                          onSkip();
                        }}
                      >
                        <Text style={styles.ctaText}>
                          {skipConfirmLeave ?? skipLabel}
                        </Text>
                      </Pressable>
                    </View>
                  </WelcomeFloatNative>
                </>
              ) : (
                <>
                  {visual ? (
                    <WelcomeFloatNative
                      active={isWelcomeBriefing}
                      delayMs={0}
                      fromY={0}
                      fade={false}
                      style={
                        isWelcomeBriefing
                          ? styles.welcomeLayerVisual
                          : styles.visualWrap
                      }
                    >
                      <TutorialCoachVisualNative visual={visual} />
                    </WelcomeFloatNative>
                  ) : null}
                  {!isWelcomeBriefing ? (
                  <WelcomeFloatNative
                    active={isWelcomeBriefing}
                    delayMs={620}
                    fromY={26}
                    style={isWelcomeBriefing ? styles.welcomeLayerTitle : undefined}
                  >
                    <Text
                      style={[
                        styles.title,
                        isWelcomeBriefing ? styles.titleWelcome : null,
                      ]}
                    >
                      {title}
                    </Text>
                  </WelcomeFloatNative>
                  ) : null}
                  <WelcomeFloatNative
                    active={isWelcomeBriefing}
                    delayMs={isWelcomeBriefing ? 620 : 780}
                    fromY={22}
                    style={isWelcomeBriefing ? styles.welcomeLayerBody : undefined}
                  >
                    <TutorialRichBodyNative
                      text={body}
                      style={[
                        styles.body,
                        isWelcomeBriefing ? styles.bodyWelcome : null,
                      ]}
                    />
                  </WelcomeFloatNative>
                  {waitHint ? <Text style={styles.wait}>{waitHint}</Text> : null}
                  {isWelcomeBriefing && onNext && nextLabel && !autoWelcomeFly ? (
                    <View style={styles.welcomeCtaCol}>
                      <WelcomeFloatNative delayMs={940} fromY={36}>
                        <WelcomeCtaPlateNative
                          variant="primary"
                          label={nextLabel}
                          disabled={welcomeFlying}
                          onPress={() => beginWelcomeGuide("full")}
                        />
                      </WelcomeFloatNative>
                      {onAltNext && altNextLabel ? (
                        <WelcomeFloatNative delayMs={1080} fromY={40}>
                          <WelcomeCtaPlateNative
                            variant="alt"
                            label={altNextLabel}
                            disabled={welcomeFlying}
                            onPress={() => beginWelcomeGuide("features")}
                          />
                        </WelcomeFloatNative>
                      ) : null}
                    </View>
                  ) : onBack || (onNext && nextLabel) ? (
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
                            isFeatureTone ? styles.ctaWelcome : null,
                          ]}
                          onPress={onNext}
                        >
                          {isFeatureTone ? (
                            <LinearGradient
                              colors={[accentSoft, accent, accentDeep]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={StyleSheet.absoluteFillObject}
                            />
                          ) : null}
                          <Text
                            style={[
                              styles.ctaText,
                              isFeatureTone ? styles.ctaTextWelcome : null,
                            ]}
                          >
                            {nextLabel}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );

        if (calloutPos.center) {
          /**
           * welcome はカード無しの浮遊レイヤー。
           * 親の opacity アニメは残さず、項目ごとの浮遊だけ使う。
           */
          if (isWelcomeBriefing) {
            return (
              <View
                style={[
                  styles.centerSlot,
                  {
                    /** 画面はブランド棚の下。上 inset を重ねず、下はタブピル分を空ける */
                    paddingTop: 32,
                    paddingBottom: Math.max(16, insets.bottom + 72),
                  },
                ]}
                pointerEvents="box-none"
              >
                <Animated.View
                  collapsable={false}
                  style={{ width: calloutPos.width }}
                  pointerEvents={welcomeFlying ? "none" : "auto"}
                >
                  {calloutBody}
                </Animated.View>
              </View>
            );
          }
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

  /** ナビ／リザルト詳細は Modal（詳細 Modal より前面）。試合カードは同一ツリーでヒット */
  if (useOverlayModal) {
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
  /** welcome ブリーフィングを STATS 端タブより前面に */
  rootWelcome: {
    zIndex: 520,
    elevation: 520,
    overflow: "visible",
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
    backgroundColor: "rgba(2,6,12,0.2)",
  },
  welcomeBlurDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 12, 0.16)",
  },
  /** CTA と同じ面。カメラ暗幕は transform された試合面より背面に抜ける */
  welcomeEmbedScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 12, 0.28)",
  },
  scrimPanel: {
    position: "absolute",
    overflow: "hidden",
  },
  scrimTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_TINT,
  },
  /** welcome ブリーフィング — 背面 UI をほぼ落とす */
  scrimTintWelcome: {
    backgroundColor: "rgba(1,4,10,0.88)",
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
    overflow: "visible",
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
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    overflow: "visible",
    shadowOpacity: 0,
    elevation: 0,
  },
  calloutGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#08121C",
  },
  calloutInner: {
    position: "relative",
    padding: 16,
  },
  calloutInnerWelcome: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    overflow: "visible",
  },
  calloutHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calloutHeadWelcome: {
    marginBottom: 0,
  },
  welcomeLayerHead: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  welcomeLayerVisual: {
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.72,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },
  welcomeLayerTitle: {
    marginBottom: 8,
  },
  welcomeLayerBody: {
    marginBottom: 28,
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
  kickerWelcome: {
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 10,
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
    fontSize: 22,
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 0,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 16,
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  bodyWelcome: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 0,
    lineHeight: 22,
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
  ctaCol: {
    flexDirection: "column",
  },
  welcomeCtaCol: {
    marginTop: 8,
    gap: 24,
  },
  welcomeBtnHit: {
    position: "relative",
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  welcomeBtnHitPressed: {
    paddingBottom: 2,
    transform: [{ translateY: 5 }],
  },
  welcomePlinth: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    bottom: 0,
  },
  welcomeFace: {
    zIndex: 1,
    overflow: "hidden",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeFacePrimary: {
    backgroundColor: TUTORIAL_CYAN,
  },
  welcomeFaceAlt: {
    borderWidth: 1,
    borderColor: TUTORIAL_FEATURE_ACCENT,
    backgroundColor: "rgba(10,4,14,0.9)",
  },
  welcomeSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  welcomeSheenAlt: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,180,230,0.42)",
  },
  welcomeShadePrimary: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: "rgba(0,50,70,0.28)",
  },
  welcomeShadeAlt: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  welcomePrimaryText: {
    color: "#050508",
    fontSize: 15,
    fontWeight: "700",
  },
  welcomeAltText: {
    color: TUTORIAL_FEATURE_ACCENT,
    fontSize: 15,
    fontWeight: "700",
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
  ctaSkipConfirm: {
    backgroundColor: "rgba(248,113,113,0.92)",
  },
  ctaSkipConfirmFloat: {
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  ctaWelcome: {
    overflow: "hidden",
    backgroundColor: "transparent",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
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
