/**
 * Web `TutorialPredictAnnotator` 相当
 * 上から順: 概要 → HOME/AWAY → 市場 → 情報タブ → スコア欄 → ボーナス → 入力 → 投稿
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  TUTORIAL_PREDICT_TOOLS_TAB_LABELS,
  TUTORIAL_PREDICT_TOOLS_TABS,
  tutorialSelectPredictToolsTab,
} from "./tutorialPredictToolsBridgeNative";
import { tutorialFocusPredictScore } from "./tutorialPredictScoreBridgeNative";
import {
  tutorialPredictSubmitLabel,
  tutorialTriggerPredictSubmit,
} from "./tutorialPredictSubmitBridgeNative";
import Svg, { Defs, Line, Marker, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import {
  TUTORIAL_CYAN,
  TUTORIAL_FLOAT_Y_PX,
  TUTORIAL_PREDICT_ANNOT_CALLOUT_MS,
  TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS,
  TUTORIAL_PREDICT_ANNOT_SCRIM_MS,
  TUTORIAL_SCRIM_OPACITY,
} from "../../../../../lib/tutorial/tutorialMotion";
import {
  measureTutorialTarget,
  scrollTutorialTargetIntoViewNative,
  setTutorialScrollEnabledNative,
  subscribeTutorialTargets,
  type TutorialMeasureRect,
} from "./tutorialMeasureNative";
import TutorialRichBodyNative from "./TutorialRichBodyNative";

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
  /** tools ステップでタブ切替を促す */
  toolsWaitHint?: string;
  /** scores ステップで両方の得点が入っているか */
  enterReady?: boolean;
  /** 機能確認用: 前の説明ステップへ */
  backLabel?: string;
  onSkip?: () => void;
};

const PAD = 8;
/** 得点入力欄だけを囲むときの余白 */
const PAD_SCORES = { top: 10, right: 8, bottom: 10, left: 8 } as const;
/** HOME/AWAY + REGULAR SEASON 見出しの枠余白 */
const PAD_SIDES = { top: 8, right: 10, bottom: 16, left: 10 } as const;
const PAD_ROUND = { top: 4, right: 10, bottom: 0, left: 10 } as const;
/** Blur なしでも穴が読めるよう少し濃くする */
const SCRIM_TINT = `rgba(2,6,12,${Math.min(0.52, TUTORIAL_SCRIM_OPACITY + 0.14)})`;
/** 情報タブ行のヒット高さ（tabShell + compact タブ） */
const TOOLS_TAB_HIT_H = 44;

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

function applyHolePad(
  rect: TutorialMeasureRect,
  pad: { top: number; right: number; bottom: number; left: number }
): TutorialMeasureRect {
  return {
    x: rect.x - pad.left,
    y: rect.y - pad.top,
    width: rect.width + pad.left + pad.right,
    height: rect.height + pad.top + pad.bottom,
  };
}

/** REGULAR SEASON 見出し + HOME/AWAY（sides ステップ用） */
async function measureSidesFocusHoleNative(): Promise<TutorialMeasureRect | null> {
  const round = await measureTutorialTarget("predict-round");
  const sides = await measureTutorialTarget("predict-sides");
  let base: TutorialMeasureRect | null = null;
  if (round && sides) base = unionNativeRects(round, sides);
  else base = sides ?? round;
  if (!base) return null;
  return applyHolePad(base, {
    top: PAD_ROUND.top + PAD_SIDES.top,
    right: Math.max(PAD_ROUND.right, PAD_SIDES.right),
    bottom: PAD_SIDES.bottom,
    left: Math.max(PAD_ROUND.left, PAD_SIDES.left),
  });
}

/** HOME/AWAY・見出し・市場の偏りは同一カード → 穴を分けない */
async function measureMatchCardHoleNative(): Promise<TutorialMeasureRect | null> {
  const round = await measureTutorialTarget("predict-round");
  const sides = await measureTutorialTarget("predict-sides");
  const market = await measureTutorialTarget("predict-market");
  let base: TutorialMeasureRect | null = null;
  if (round && sides) base = unionNativeRects(round, sides);
  else base = sides ?? round;
  if (base && market) return unionNativeRects(base, market);
  return base ?? market;
}

/**
 * measureInWindow 座標をオーバーレイルート相対へ変換。
 * Modal 内で窓座標のまま描くと枠がズレる。
 */
function localizeRectToRoot(
  rect: TutorialMeasureRect,
  root: View | null
): Promise<TutorialMeasureRect> {
  return new Promise((resolve) => {
    if (!root) {
      resolve(rect);
      return;
    }
    root.measureInWindow((ox, oy) => {
      resolve({
        x: rect.x - ox,
        y: rect.y - oy,
        width: rect.width,
        height: rect.height,
      });
    });
  });
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
  toolsWaitHint,
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
  const [scoreHits, setScoreHits] = useState<{
    home: TutorialMeasureRect;
    away: TutorialMeasureRect;
  } | null>(null);
  const [toolsTabHit, setToolsTabHit] = useState<TutorialMeasureRect | null>(
    null
  );
  const [submitHit, setSubmitHit] = useState<TutorialMeasureRect | null>(null);
  const rootMeasureRef = useRef<View>(null);
  /** コールアウト高さは ref で持つ（deps に入れると再スクロール→枠チラつきの原因） */
  const calloutHeightRef = useRef(220);
  const ringPlayedStepRef = useRef<Step | null>(null);
  const holeRef = useRef<TutorialMeasureRect | null>(null);
  /** スクロールなしの再測（キーボード／enterReady 用） */
  const remasureOnlyRef = useRef<(() => void) | null>(null);
  const [revealReady, setRevealReady] = useState(false);
  /**
   * ステップ演出の準備完了（スクロール＋測位済み）。
   * false のあいだはモーダル／枠を隠し、完了後に モーダル → 四角 の順で出す。
   */
  const [sceneReady, setSceneReady] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const scrimOp = useSharedValue(0);
  const calloutOp = useSharedValue(0);
  const calloutEnterY = useSharedValue(12);
  /** フォーカス枠の出現（ステップごとに再生） */
  const ringOp = useSharedValue(0);
  /** Web soft/hard ring と同じ初速スケール */
  const ringScale = useSharedValue(1.14);
  const ringGlow = useSharedValue(0);

  /** モーダル出現後に枠を出すまでの段差（意図的） */
  const RING_AFTER_CALLOUT_MS = 200;

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

  const hideStepChrome = () => {
    cancelAnimation(calloutOp);
    cancelAnimation(calloutEnterY);
    cancelAnimation(ringOp);
    cancelAnimation(ringScale);
    cancelAnimation(ringGlow);
    calloutOp.value = 0;
    calloutEnterY.value = 16;
    ringOp.value = 0;
    ringScale.value = 1.14;
    ringGlow.value = 0;
    ringPlayedStepRef.current = null;
  };

  useEffect(() => {
    if (calloutBox?.height && calloutBox.height > 80) {
      calloutHeightRef.current = calloutBox.height;
    }
  }, [calloutBox?.height]);

  /** Predict シートが落ち着いてから注釈レイヤを出す */
  useEffect(() => {
    if (!open) {
      setRevealReady(false);
      setSceneReady(false);
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

  /** 暗幕は reveal 時に一度だけ */
  useEffect(() => {
    if (!open || !revealReady) {
      if (!open) setStep("overview");
      cancelAnimation(scrimOp);
      scrimOp.value = 0;
      hideStepChrome();
      setSceneReady(false);
      return;
    }
    if (reduceMotion) {
      scrimOp.value = 1;
      return;
    }
    scrimOp.value = withTiming(1, {
      duration: TUTORIAL_PREDICT_ANNOT_SCRIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, revealReady, reduceMotion, scrimOp]);

  /**
   * モーダル入場: sceneReady（スクロール完了）のあと。
   * ステップ切替のたびに再生する。
   */
  useEffect(() => {
    if (!open || !revealReady || !sceneReady) {
      if (open && revealReady && !sceneReady) {
        cancelAnimation(calloutOp);
        cancelAnimation(calloutEnterY);
        calloutOp.value = 0;
        calloutEnterY.value = 16;
      }
      return;
    }
    if (reduceMotion) {
      calloutOp.value = 1;
      calloutEnterY.value = 0;
      return;
    }
    cancelAnimation(calloutOp);
    cancelAnimation(calloutEnterY);
    calloutEnterY.value = 18;
    calloutOp.value = 0;
    calloutOp.value = withTiming(1, {
      duration: TUTORIAL_PREDICT_ANNOT_CALLOUT_MS,
      easing: Easing.out(Easing.cubic),
    });
    calloutEnterY.value = withTiming(0, {
      duration: TUTORIAL_PREDICT_ANNOT_CALLOUT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [
    open,
    revealReady,
    sceneReady,
    step,
    reduceMotion,
    calloutOp,
    calloutEnterY,
  ]);

  const targetId = targetIdForStep(step);
  /** 情報タブ・得点入力・投稿は実際に操作させる */
  const allowHoleInteract =
    step === "tools" ||
    step === "scores" ||
    step === "enter" ||
    step === "submit";
  /**
   * RN は穴まわりのスクラム板があるとタッチが通らないことが多い。
   * 操作ステップは薄いディムのみにして背後へ通す。
   */
  const interactBehind =
    step === "tools" ||
    step === "scores" ||
    step === "enter" ||
    step === "submit";
  /** タブは上にあるのでコールアウトを下固定。得点・投稿は上に置いて入力を隠さない */
  const pinCalloutBottom = step === "tools";

  const copy =
    step === "overview"
      ? { title: overviewTitle, body: overviewBody }
      : step === "sides"
        ? { title: sidesTitle, body: sidesBody }
        : step === "market"
          ? { title: marketTitle, body: marketBody }
          : step === "tools"
            ? { title: toolsTitle, body: toolsBody }
            : step === "bonus"
              ? { title: bonusTitle, body: bonusBody }
              : step === "enter" || step === "scores"
                ? { title: enterTitle, body: enterBody }
                : { title: submitTitle, body: submitBody };

  /** 「スコア入力欄」説明は「得点を入力」に統合（二重モーダルをやめる） */
  useEffect(() => {
    if (!open || step !== "scores") return;
    let cancelled = false;
    void (async () => {
      const bonus = await measureTutorialTarget("predict-bonus");
      if (cancelled) return;
      setStep(bonus ? "bonus" : "enter");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  /**
   * 得点入力中は暗幕を掛けない（入力中に画面が暗くなるのを防ぐ）。
   * 投稿誘導だけ soft ディム。
   */
  const softDimBehind = interactBehind && step === "submit";
  /** 枠リングは tools / enter / submit で出す */
  const showSoftHoleRing =
    interactBehind &&
    (step === "tools" ||
      step === "scores" ||
      step === "enter" ||
      step === "submit");

  /** 対象が無いステップはスキップ（オーバーレイ入場直後は少し待つ） */
  useEffect(() => {
    if (!open || !revealReady) return;
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
      if (step === "sides") {
        await new Promise((r) => setTimeout(r, 320));
        if (cancelled) return;
      }
      if (step === "market") {
        const hole = await measureMatchCardHoleNative();
        if (cancelled || hole) return;
        const tools = await measureTutorialTarget("predict-tools");
        if (tools) {
          setStep("tools");
          return;
        }
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
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
        if (tools) {
          setStep("tools");
          return;
        }
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
        return;
      }
      if (step === "tools") {
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
      } else setStep("enter");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, revealReady, step]);

  useEffect(() => {
    /** スクロール → 測位 → sceneReady。その後モーダル → 四角 */
    if (!open || !revealReady) {
      setSceneReady(false);
      if (!open) {
        commitHole(null);
        setFocusRect(null);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(null);
        setTutorialScrollEnabledNative(true);
      }
      return;
    }

    hideStepChrome();
    setSceneReady(false);
    commitHole(null);
    setFocusRect(null);
    setScoreHits(null);

    /** overview: スクロールなしでモーダルのみ */
    if (!targetId) {
      setToolsTabHit(null);
      setSubmitHit(null);
      setSceneReady(true);
      return;
    }

    let cancelled = false;
    let scrollPassDone = false;
    const lockUserScroll = step === "enter" || step === "scores";

    const measureAndCommit = async () => {
      const root = rootMeasureRef.current;

      if (step === "sides") {
        const card = await measureSidesFocusHoleNative();
        if (cancelled) return;
        commitHole(card ? await localizeRectToRoot(card, root) : null);
        setFocusRect(null);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(null);
      } else if (step === "market") {
        const card = await measureMatchCardHoleNative();
        const focus = await measureTutorialTarget("predict-market");
        if (cancelled) return;
        commitHole(card ? await localizeRectToRoot(card, root) : null);
        setFocusRect(focus ? await localizeRectToRoot(focus, root) : null);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(null);
      } else if (step === "scores" || step === "enter") {
        const home = await measureTutorialTarget("predict-score-home");
        const away = await measureTutorialTarget("predict-score-away");
        const block = await measureTutorialTarget("predict-scores");
        if (cancelled) return;
        let scoreHole: TutorialMeasureRect | null = null;
        if (block && home && away) {
          const fieldsBottom = Math.max(
            home.y + home.height,
            away.y + away.height
          );
          scoreHole = {
            x: block.x,
            y: block.y,
            width: block.width,
            height: Math.max(1, fieldsBottom - block.y),
          };
        } else if (home && away) {
          scoreHole = unionNativeRects(home, away);
        } else {
          scoreHole = home ?? away ?? block;
        }
        if (!scoreHole) {
          commitHole(null);
          setFocusRect(null);
          setScoreHits(null);
        } else {
          const local = await localizeRectToRoot(scoreHole, root);
          if (cancelled) return;
          commitHole(local);
          setFocusRect(local);
          if (home && away) {
            const homeL = await localizeRectToRoot(home, root);
            const awayL = await localizeRectToRoot(away, root);
            if (!cancelled) setScoreHits({ home: homeL, away: awayL });
          } else {
            setScoreHits(null);
          }
        }
        setToolsTabHit(null);
        if (step === "enter" && enterReady) {
          const sub = await measureTutorialTarget("predict-submit");
          if (!cancelled) {
            setSubmitHit(sub ? await localizeRectToRoot(sub, root) : null);
          }
        } else if (!cancelled) {
          setSubmitHit(null);
        }
      } else if (step === "tools") {
        const r = await measureTutorialTarget(targetId);
        if (cancelled) return;
        const local = r ? await localizeRectToRoot(r, root) : null;
        commitHole(local);
        setFocusRect(local);
        setScoreHits(null);
        setSubmitHit(null);
        const tabs =
          (await measureTutorialTarget("predict-tools-tabs")) ??
          (await measureTutorialTarget("predict-tools"));
        if (!cancelled) {
          if (!tabs) {
            setToolsTabHit(null);
          } else {
            const tabLocal = await localizeRectToRoot(tabs, root);
            if (!cancelled) {
              setToolsTabHit({
                ...tabLocal,
                height: Math.max(tabLocal.height, TOOLS_TAB_HIT_H),
              });
            }
          }
        }
      } else if (step === "submit") {
        const sub = await measureTutorialTarget("predict-submit");
        if (cancelled) return;
        const local = sub ? await localizeRectToRoot(sub, root) : null;
        commitHole(local);
        setFocusRect(local);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(
          local
            ? {
                ...local,
                height: Math.max(local.height, 48),
              }
            : null
        );
      } else if (step === "bonus") {
        const r = await measureTutorialTarget(targetId);
        if (cancelled) return;
        const local = r ? await localizeRectToRoot(r, root) : null;
        commitHole(local);
        setFocusRect(local);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(null);
      } else {
        const r = await measureTutorialTarget(targetId);
        if (cancelled) return;
        const local = r ? await localizeRectToRoot(r, root) : null;
        commitHole(local);
        setFocusRect(local);
        setScoreHits(null);
        setToolsTabHit(null);
        setSubmitHit(null);
      }

      requestAnimationFrame(() => {
        calloutRef.current?.measureInWindow((x, y, width, height) => {
          if (!cancelled && width > 1) {
            const node = rootMeasureRef.current;
            if (!node) {
              setCalloutBox({ x, y, width, height });
              return;
            }
            node.measureInWindow((ox, oy) => {
              if (!cancelled) {
                setCalloutBox({
                  x: x - ox,
                  y: y - oy,
                  width,
                  height,
                });
              }
            });
          }
        });
      });
    };

    const scrollToTarget = async (animated: boolean) => {
      setTutorialScrollEnabledNative(true);
      if (lockUserScroll) {
        await scrollTutorialTargetIntoViewNative("predict-scores", {
          animated,
          align: "top",
          topPad:
            Math.max(insets.top + 8, 12) + calloutHeightRef.current + 10,
        });
      } else if (step === "sides" || step === "market") {
        await scrollTutorialTargetIntoViewNative("predict-sides", {
          animated,
          idealRatio: step === "sides" ? 0.38 : 0.34,
        });
      } else {
        await scrollTutorialTargetIntoViewNative(targetId, {
          animated,
          idealRatio:
            step === "tools" ? 0.22 : step === "submit" ? 0.62 : 0.36,
        });
      }
      setTutorialScrollEnabledNative(!lockUserScroll);
    };

    const run = async (doScroll: boolean) => {
      if (doScroll) {
        /** 1) スクロール（モーダル／枠は隠したまま） */
        await scrollToTarget(!reduceMotion);
        if (cancelled) return;
        /** 2) 測位してから sceneReady → モーダル → 四角 */
        await measureAndCommit();
        if (cancelled) return;
        scrollPassDone = true;
        setSceneReady(true);
      } else if (!scrollPassDone) {
        return;
      } else {
        await measureAndCommit();
      }
    };
    remasureOnlyRef.current = () => {
      if (!scrollPassDone || cancelled) return;
      void measureAndCommit();
    };
    void run(true);
    const t1 = setTimeout(
      () => void run(false),
      reduceMotion ? 160 : 560
    );
    const unsub = subscribeTutorialTargets(() => void run(false));
    return () => {
      cancelled = true;
      remasureOnlyRef.current = null;
      clearTimeout(t1);
      unsub();
    };
  }, [open, revealReady, targetId, step, reduceMotion, insets.top]);

  /**
   * 得点入力中は KeyboardAvoiding で欄が動く。
   * 入れ終わった瞬間／キーボード開閉で枠が置いていかれるので再測する。
   * （sceneReady は触らず、モーダル再入場はしない）
   */
  useEffect(() => {
    if (!open || !revealReady || !sceneReady) return;
    if (step !== "enter" && step !== "scores" && step !== "submit") return;

    let cancelled = false;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const kick = (delayMs: number) => {
      const t = setTimeout(() => {
        timeouts.delete(t);
        if (!cancelled) remasureOnlyRef.current?.();
      }, delayMs);
      timeouts.add(t);
    };

    /** enterReady 変化（送信ボタン点灯など）でも追従 */
    kick(40);
    kick(220);

    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const subShow = Keyboard.addListener(showEvt, () => {
      kick(80);
      kick(280);
    });
    const subHide = Keyboard.addListener(hideEvt, () => {
      kick(80);
      kick(280);
    });
    const subFrame =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", () => {
            kick(100);
          })
        : null;

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      subShow.remove();
      subHide.remove();
      subFrame?.remove();
    };
  }, [open, revealReady, sceneReady, step, enterReady]);

  const preferBelow = useMemo(() => {
    /** 情報タブ: コールアウト下固定 → 線は下から上 */
    if (pinCalloutBottom) return true;
    /** 得点・投稿: コールアウトを上に置き、入力欄を隠さない */
    if (interactBehind) return false;
    if (!hole) return false;
    const calloutH = calloutBox?.height ?? 280;
    const edge = 16 + TUTORIAL_FLOAT_Y_PX;
    const spaceBelow = winH - (hole.y + hole.height) - edge;
    const spaceAbove = hole.y - edge;
    const need = calloutH + 18;
    return spaceBelow >= need || (spaceBelow >= spaceAbove && spaceBelow > 96);
  }, [hole, winH, calloutBox?.height, interactBehind, pinCalloutBottom]);

  const calloutPos = useMemo(() => {
    const width = Math.min(winW - 32, 360);
    const left = (winW - width) / 2;
    const calloutH = calloutBox?.height ?? 280;
    const edge = 16 + TUTORIAL_FLOAT_Y_PX;
    const gap = 18;
    if (pinCalloutBottom) {
      return {
        left,
        width,
        top: undefined as number | undefined,
        bottom: Math.max(16, insets.bottom + 24),
      };
    }
    /** 得点入力・投稿: 画面上部に固定（入力欄を絶対に隠さない） */
    if (step === "enter" || step === "scores" || step === "submit") {
      return {
        left,
        width,
        top: Math.max(12, insets.top + 8),
        bottom: undefined as number | undefined,
      };
    }
    /** 投稿など: 穴の上側に固定 */
    if (interactBehind && hole) {
      return {
        left,
        width,
        top: Math.max(
          insets.top + 12,
          Math.min(hole.y - calloutH - gap, winH - calloutH - edge)
        ),
        bottom: undefined as number | undefined,
      };
    }
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
  }, [
    hole,
    winW,
    winH,
    insets.top,
    insets.bottom,
    preferBelow,
    calloutBox?.height,
    interactBehind,
    pinCalloutBottom,
    step,
  ]);

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
    focusRect != null && hole != null && step === "market";

  /**
   * 四角（枠）: sceneReady のあと、モーダルより一段遅れて出現。
   * 順序: スクロール → モーダル → 四角
   */
  useEffect(() => {
    if (!open || !revealReady || !sceneReady) {
      cancelAnimation(ringOp);
      cancelAnimation(ringScale);
      cancelAnimation(ringGlow);
      ringOp.value = 0;
      ringScale.value = 1.14;
      ringGlow.value = 0;
      ringPlayedStepRef.current = null;
      return;
    }
    const hasFrame = showFocusNav ? focusRect != null : hole != null;
    if (!hasFrame) {
      cancelAnimation(ringOp);
      cancelAnimation(ringScale);
      cancelAnimation(ringGlow);
      ringOp.value = 0;
      ringScale.value = 1.14;
      ringGlow.value = 0;
      ringPlayedStepRef.current = null;
      return;
    }
    if (ringPlayedStepRef.current === step) {
      ringOp.value = 1;
      ringScale.value = 1;
      return;
    }
    ringPlayedStepRef.current = step;
    if (reduceMotion) {
      ringOp.value = 1;
      ringScale.value = 1;
      ringGlow.value = 1;
      return;
    }
    cancelAnimation(ringOp);
    cancelAnimation(ringScale);
    cancelAnimation(ringGlow);
    ringOp.value = 0;
    ringScale.value = 1.14;
    ringGlow.value = 0;
    const ease = Easing.out(Easing.cubic);
    const delay = RING_AFTER_CALLOUT_MS;
    const dur = 420;
    ringOp.value = withDelay(
      delay,
      withTiming(1, { duration: dur, easing: ease })
    );
    ringScale.value = withDelay(
      delay,
      withTiming(1, { duration: dur, easing: ease })
    );
    ringGlow.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 180, easing: ease }),
        withTiming(0.55, { duration: 320, easing: Easing.inOut(Easing.sin) })
      )
    );
  }, [
    open,
    revealReady,
    sceneReady,
    reduceMotion,
    step,
    hole != null,
    focusRect != null,
    showFocusNav,
    ringOp,
    ringScale,
    ringGlow,
  ]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOp.value,
  }));

  const calloutMotionStyle = useAnimatedStyle(() => ({
    opacity: calloutOp.value,
    transform: [{ translateY: calloutEnterY.value }],
  }));
  /** 誘導線は四角と同時（モーダルより後） */
  const focusRevealStyle = useAnimatedStyle(() => ({
    opacity: ringOp.value,
  }));
  /** フォーカス枠: 外から収束＋発光 */
  const holeRingStyle = useAnimatedStyle(() => ({
    opacity: ringOp.value,
    transform: [{ scale: ringScale.value }],
    shadowOpacity: 0.25 + ringGlow.value * 0.55,
    shadowRadius: 8 + ringGlow.value * 16,
  }));
  const holeRingAuraStyle = useAnimatedStyle(() => ({
    opacity: ringOp.value * ringGlow.value * 0.55,
    transform: [{ scale: 1 + (1.14 - ringScale.value) * 0.9 }],
  }));

  const goNext = () => {
    if (step === "enter" && !enterReady) return;
    void (async () => {
      if (step === "overview") {
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
        if (tools) {
          setStep("tools");
          return;
        }
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
        return;
      }
      if (step === "market") {
        const tools = await measureTutorialTarget("predict-tools");
        if (tools) {
          setStep("tools");
          return;
        }
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
        return;
      }
      if (step === "tools") {
        const bonus = await measureTutorialTarget("predict-bonus");
        setStep(bonus ? "bonus" : "enter");
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
      if (step === "enter") {
        const bonus = await measureTutorialTarget("predict-bonus");
        if (bonus) {
          setStep("bonus");
          return;
        }
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
      if (step === "submit") setStep("enter");
    })();
  };

  if (!open || !revealReady) return null;

  /** スクロール中は穴／枠を出さない（モーダルと揃えてから） */
  const displayHole = sceneReady ? hole : null;
  const displayFocus = sceneReady ? focusRect : null;

  const pad =
    step === "sides" || step === "market"
      ? { top: 0, right: 0, bottom: 0, left: 0 }
      : step === "scores" || step === "enter"
        ? PAD_SCORES
        : { top: PAD, right: PAD, bottom: PAD, left: PAD };
  const hx = displayHole ? displayHole.x - pad.left : 0;
  const hy = displayHole ? displayHole.y - pad.top : 0;
  const hw = displayHole ? displayHole.width + pad.left + pad.right : 0;
  const hh = displayHole ? displayHole.height + pad.top + pad.bottom : 0;
  const showNext = step !== "submit";
  const enterBlocked = step === "enter" && !enterReady;
  const waitHint =
    step === "tools"
      ? toolsWaitHint ?? null
      : step === "enter"
        ? enterBlocked
          ? enterWaitHint
          : null
        : step === "submit"
          ? submitWaitHint
          : null;

  function panel(style: object) {
    /** BlurView はフェード中にカクつくので単色ディムのみ */
    return (
      <View style={[styles.panel, style]} pointerEvents="auto">
        <View style={styles.tint} />
      </View>
    );
  }

  /** タッチは通しつつ、穴以外だけ暗くする（全面 softDim だと誘導箇所まで暗くなる） */
  function softCutoutPanel(style: object) {
    return (
      <View
        pointerEvents="none"
        style={[styles.softCutoutDim, style]}
      />
    );
  }

  return (
    <View
      ref={rootMeasureRef}
      style={styles.root}
      pointerEvents="box-none"
      collapsable={false}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, scrimStyle]}
        pointerEvents="box-none"
      >
        {interactBehind ? (
          <>
            {displayHole ? (
              <>
                {softDimBehind ? (
                  <>
                    {softCutoutPanel({
                      top: 0,
                      left: 0,
                      right: 0,
                      height: Math.max(0, hy),
                    })}
                    {softCutoutPanel({
                      top: hy + hh,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    })}
                    {softCutoutPanel({
                      top: hy,
                      left: 0,
                      width: Math.max(0, hx),
                      height: hh,
                    })}
                    {softCutoutPanel({
                      top: hy,
                      left: hx + hw,
                      right: 0,
                      height: hh,
                    })}
                  </>
                ) : null}
                {showSoftHoleRing ? (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.holeRingAura,
                        holeRingAuraStyle,
                        { top: hy, left: hx, width: hw, height: hh },
                      ]}
                    />
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.holeRing,
                        holeRingStyle,
                        { top: hy, left: hx, width: hw, height: hh },
                      ]}
                    />
                  </>
                ) : null}
              </>
            ) : softDimBehind ? (
              <View
                pointerEvents="none"
                style={[styles.softCutoutDim, StyleSheet.absoluteFillObject]}
              />
            ) : null}
          </>
        ) : displayHole ? (
          <>
            {panel({ top: 0, left: 0, right: 0, height: Math.max(0, hy) })}
            {panel({ top: hy + hh, left: 0, right: 0, bottom: 0 })}
            {panel({ top: hy, left: 0, width: Math.max(0, hx), height: hh })}
            {panel({ top: hy, left: hx + hw, right: 0, height: hh })}
            {/** フォーカス枠があるときは外枠を出さない（二重枠を避ける） */}
            {!showFocusNav ? (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.holeRingAura,
                    holeRingAuraStyle,
                    { top: hy, left: hx, width: hw, height: hh },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.holeRing,
                    holeRingStyle,
                    { top: hy, left: hx, width: hw, height: hh },
                  ]}
                />
              </>
            ) : null}
            {showFocusNav && displayFocus ? (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.holeRingAura,
                    holeRingAuraStyle,
                    {
                      top: displayFocus.y - 2,
                      left: displayFocus.x - 2,
                      width: displayFocus.width + 4,
                      height: displayFocus.height + 4,
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.focusNav,
                    holeRingStyle,
                    {
                      top: displayFocus.y - 2,
                      left: displayFocus.x - 2,
                      width: displayFocus.width + 4,
                      height: displayFocus.height + 4,
                    },
                  ]}
                >
                  <View style={[styles.focusRing, styles.focusRingStatic]} />
                </Animated.View>
              </>
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

      {/* opacity 付き Animated の外に置く（親 opacity だとタップが落ちる） */}
      {step === "tools" && toolsTabHit ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.toolsTabHitRow,
            {
              top: toolsTabHit.y,
              left: toolsTabHit.x,
              width: Math.max(1, toolsTabHit.width),
              height: Math.max(TOOLS_TAB_HIT_H, toolsTabHit.height),
            },
          ]}
        >
          {TUTORIAL_PREDICT_TOOLS_TABS.map((tabId) => (
            <Pressable
              key={tabId}
              accessibilityRole="tab"
              accessibilityLabel={TUTORIAL_PREDICT_TOOLS_TAB_LABELS[tabId]}
              onPress={() => tutorialSelectPredictToolsTab(tabId)}
              collapsable={false}
              style={styles.toolsTabHit}
            />
          ))}
        </View>
      ) : null}
      {step === "enter" && scoreHits ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="HOME score"
            onPress={() => tutorialFocusPredictScore("home")}
            collapsable={false}
            style={[
              styles.scoreHit,
              {
                top: scoreHits.home.y,
                left: scoreHits.home.x,
                width: Math.max(1, scoreHits.home.width),
                height: Math.max(1, scoreHits.home.height),
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="AWAY score"
            onPress={() => tutorialFocusPredictScore("away")}
            collapsable={false}
            style={[
              styles.scoreHit,
              {
                top: scoreHits.away.y,
                left: scoreHits.away.x,
                width: Math.max(1, scoreHits.away.width),
                height: Math.max(1, scoreHits.away.height),
              },
            ]}
          />
        </>
      ) : null}

      {(step === "submit" || (step === "enter" && enterReady)) &&
      submitHit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tutorialPredictSubmitLabel()}
          onPress={() => {
            tutorialTriggerPredictSubmit();
          }}
          collapsable={false}
          style={[
            styles.submitHit,
            {
              top: submitHit.y,
              left: submitHit.x,
              width: Math.max(1, submitHit.width),
              height: Math.max(48, submitHit.height),
            },
          ]}
        />
      ) : null}

      {/** フォーカス枠＋説明カードがあるときは誘導線も省く（四角が重なる） */}
      {line && !showFocusNav ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, focusRevealStyle]}
        >
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
        </Animated.View>
      ) : null}

      <Animated.View
        ref={calloutRef}
        style={[
          styles.calloutShell,
          calloutMotionStyle,
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
        onLayout={() => {
          requestAnimationFrame(() => {
            calloutRef.current?.measureInWindow((x, y, width, height) => {
              if (width > 1 && height > 1) {
                const node = rootMeasureRef.current;
                if (!node) {
                  setCalloutBox({ x, y, width, height });
                  return;
                }
                node.measureInWindow((ox, oy) => {
                  setCalloutBox({
                    x: x - ox,
                    y: y - oy,
                    width,
                    height,
                  });
                });
              }
            });
          });
        }}
      >
        {/*
          Blur を transform 付き Animated 直下に置くと iOS でカクつく。
          枠・塗りは静止 chrome、入場アニメだけ外枠でかける。
        */}
        <View style={styles.calloutChrome}>
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
        <TutorialRichBodyNative text={copy.body} style={styles.body} />
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
  /** tools/enter/submit: 穴以外だけディム（穴は明るく保つ） */
  softCutoutDim: {
    position: "absolute",
    backgroundColor: "rgba(5,5,12,0.52)",
  },
  toolsTabHitRow: {
    position: "absolute",
    zIndex: 400,
    elevation: 400,
    flexDirection: "row",
  },
  toolsTabHit: {
    flex: 1,
    height: "100%",
    backgroundColor: "rgba(0, 245, 255, 0.08)",
  },
  scoreHit: {
    position: "absolute",
    zIndex: 400,
    elevation: 400,
    backgroundColor: "rgba(0, 245, 255, 0.08)",
  },
  submitHit: {
    position: "absolute",
    zIndex: 400,
    elevation: 400,
    backgroundColor: "rgba(0, 245, 255, 0.1)",
  },
  holeRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  holeRingAura: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
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
  focusRingStatic: {
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  calloutShell: {
    position: "absolute",
    // 影は外枠。overflow で切らない
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  calloutChrome: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    /** Native は Blur 無しなので不透明 */
    backgroundColor: "#060E18",
  },
  calloutGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#08121C",
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
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
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
    alignItems: "stretch",
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
    flexShrink: 0,
  },
  backBtnFull: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
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
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
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
