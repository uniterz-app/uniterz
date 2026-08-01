"use client";

/**
 * 予想入力画面のチュートリアル
 * 上から順: 概要 → HOME/AWAY → 市場 → 情報タブ → スコア欄 → ボーナス → 入力 → 投稿
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  TUTORIAL_BG_BLUR_PX,
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CALLOUT_DURATION_S,
  TUTORIAL_CALLOUT_GLASS_BG,
  TUTORIAL_CALLOUT_GLASS_BLUR_PX,
  TUTORIAL_CALLOUT_GLASS_SATURATE,
  TUTORIAL_CYAN,
  TUTORIAL_FLOAT_PERIOD_S,
  TUTORIAL_FLOAT_Y_PX,
  TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS,
  TUTORIAL_PREDICT_ANNOT_Z_INDEX,
  TUTORIAL_PULSE_PERIOD_S,
  TUTORIAL_SCRIM_OPACITY,
} from "@/lib/tutorial/tutorialMotion";
import { scrollTutorialTargetIntoView } from "@/lib/tutorial/scrollTutorialTargetIntoView";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;
const PAD = 8;
/** HOME/AWAY: 上の閉じるに食い込まない（負の top = 内側へ）／戦績用に下を広げる */
const PAD_SIDES = { top: -6, right: 10, bottom: 16, left: 10 } as const;
/** コールアウト見切れ防止（実測前の高さ見積もり） */
const CALLOUT_GAP = 18;
const CALLOUT_EST_H = 280;
const CALLOUT_EDGE = 16 + TUTORIAL_FLOAT_Y_PX;

const SCRIM_BG = `rgba(2,6,12,${TUTORIAL_SCRIM_OPACITY})`;
const SCRIM_BG_SOFT = `rgba(2,6,12,${Math.max(0.2, TUTORIAL_SCRIM_OPACITY - 0.08)})`;
const SCRIM_BLUR = {
  backdropFilter: `blur(${TUTORIAL_BG_BLUR_PX}px)`,
  WebkitBackdropFilter: `blur(${TUTORIAL_BG_BLUR_PX}px)`,
} as const;

type Rect = { top: number; left: number; width: number; height: number };
type HolePad = { top: number; right: number; bottom: number; left: number };
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

function readTargetRaw(
  id: string,
  pad: HolePad = { top: PAD, right: PAD, bottom: PAD, left: PAD }
): Rect | null {
  const el = document.querySelector(
    `[data-tutorial-target="${id}"]`
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: r.top - pad.top,
    left: r.left - pad.left,
    width: r.width + pad.left + pad.right,
    height: r.height + pad.top + pad.bottom,
  };
}

function clampRectToViewport(r: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let { top, left, width, height } = r;
  if (left < 0) {
    width += left;
    left = 0;
  }
  if (top < 0) {
    height += top;
    top = 0;
  }
  if (left + width > vw) width = Math.max(0, vw - left);
  if (top + height > vh) height = Math.max(0, vh - top);
  return { top, left, width, height };
}

function unionRects(a: Rect, b: Rect): Rect {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  const right = Math.max(a.left + a.width, b.left + b.width);
  const bottom = Math.max(a.top + a.height, b.top + b.height);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function readTarget(
  id: string,
  pad: HolePad = { top: PAD, right: PAD, bottom: PAD, left: PAD }
): Rect | null {
  const raw = readTargetRaw(id, pad);
  return raw ? clampRectToViewport(raw) : null;
}

/**
 * HOME/AWAY と市場の偏りは同一カード内。
 * ぼかし穴を分割せず、まとめてくり抜く。
 */
function readMatchCardHole(): Rect | null {
  const sides = readTargetRaw("predict-sides", { ...PAD_SIDES });
  const market = readTargetRaw("predict-market", {
    top: PAD,
    right: PAD,
    bottom: PAD,
    left: PAD,
  });
  if (sides && market) return clampRectToViewport(unionRects(sides, market));
  if (sides) return clampRectToViewport(sides);
  if (market) return clampRectToViewport(market);
  return null;
}

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

export default function TutorialPredictAnnotator({
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
  const [mounted, setMounted] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const [step, setStep] = useState<Step>("overview");
  const [hole, setHole] = useState<Rect | null>(null);
  /** カード内の「今説明している」要素（ナビ用） */
  const [focusRect, setFocusRect] = useState<Rect | null>(null);
  const [calloutBox, setCalloutBox] = useState<Rect | null>(null);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  /** 予想オーバーレイ入場後に出す（同時だと一瞬フォームの裏に回る） */
  useEffect(() => {
    if (!open) {
      setRevealReady(false);
      return;
    }
    if (reduceMotion) {
      setRevealReady(true);
      return;
    }
    const t = window.setTimeout(
      () => setRevealReady(true),
      TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open) setStep("overview");
  }, [open]);

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

  const measure = useCallback(() => {
    if (!targetId) {
      setHole(null);
      setFocusRect(null);
      return;
    }
    // HOME/AWAY と市場は一枚のカード → ぼかし穴は分けない。ナビ枠だけ対象を絞る
    if (step === "sides" || step === "market") {
      setHole(readMatchCardHole());
      const focusId = step === "market" ? "predict-market" : "predict-sides";
      const focusPad: HolePad =
        step === "sides"
          ? { ...PAD_SIDES }
          : { top: 4, right: 6, bottom: 4, left: 6 };
      setFocusRect(readTarget(focusId, focusPad));
      return;
    }
    const rect = readTarget(targetId, {
      top: PAD,
      right: PAD,
      bottom: PAD,
      left: PAD,
    });
    setHole(rect);
    setFocusRect(rect);
  }, [targetId, step]);

  /** 対象が無いステップはスキップ（オーバーレイ入場直後は少し待つ） */
  useEffect(() => {
    if (!open) return;
    if (step === "sides") {
      const t = window.setTimeout(() => {
        if (!readTarget("predict-sides", { ...PAD_SIDES })) {
          if (readTarget("predict-market")) setStep("market");
          else if (readTarget("predict-tools")) setStep("tools");
          else setStep("scores");
        }
      }, 320);
      return () => window.clearTimeout(t);
    }
    if (step === "market") {
      const t = window.setTimeout(() => {
        // sides があればカード全体で案内済み。market 単体も sides も無いときだけスキップ
        if (!readTarget("predict-market") && !readTarget("predict-sides", { ...PAD_SIDES })) {
          setStep(readTarget("predict-tools") ? "tools" : "scores");
        }
      }, 60);
      return () => window.clearTimeout(t);
    }
    if (step === "tools") {
      const t = window.setTimeout(() => {
        if (!readTarget("predict-tools")) setStep("scores");
      }, 60);
      return () => window.clearTimeout(t);
    }
    if (step === "bonus") {
      const t = window.setTimeout(() => {
        if (!readTarget("predict-bonus")) setStep("enter");
      }, 60);
      return () => window.clearTimeout(t);
    }
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open || !targetId) return;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    const idealRatio =
      step === "sides" || step === "market"
        ? 0.18
        : step === "submit"
          ? 0.28
          : 0.32;
    scrollTutorialTargetIntoView(targetId, { behavior, idealRatio });
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(() => {
      scrollTutorialTargetIntoView(targetId, {
        behavior: "auto",
        idealRatio,
      });
      measure();
    }, 280);
    const t3 = window.setTimeout(measure, 600);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [open, measure, step, targetId, reduceMotion]);

  const calloutRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      setCalloutBox(null);
      return;
    }
    const r = node.getBoundingClientRect();
    setCalloutBox({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, []);

  /** 配置後に高さを測り直し、見切れクランプを更新 */
  useLayoutEffect(() => {
    if (!open) return;
    const el = document.getElementById("tutorial-predict-callout");
    if (!el) return;
    const sync = () => {
      const r = el.getBoundingClientRect();
      setCalloutBox({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };
    sync();
    const t = window.setTimeout(sync, 50);
    return () => window.clearTimeout(t);
  }, [open, step, hole?.top, hole?.height]);

  const goNext = useCallback(() => {
    setStep((prev) => {
      if (prev === "enter" && !enterReady) return prev;
      if (prev === "overview") {
        /** 入場直後は測れないことがあるので、まず HOME/AWAY へ進む */
        return "sides";
      }
      if (prev === "sides") {
        if (readTarget("predict-market")) return "market";
        return readTarget("predict-tools") ? "tools" : "scores";
      }
      if (prev === "market") {
        return readTarget("predict-tools") ? "tools" : "scores";
      }
      if (prev === "tools") return "scores";
      if (prev === "scores") {
        return readTarget("predict-bonus") ? "bonus" : "enter";
      }
      if (prev === "bonus") return "enter";
      if (prev === "enter") return "submit";
      return prev;
    });
  }, [enterReady]);

  const goBack = useCallback(() => {
    setStep((prev) => {
      if (prev === "sides") return "overview";
      if (prev === "market") {
        return readTarget("predict-sides") ? "sides" : "overview";
      }
      if (prev === "tools") {
        if (readTarget("predict-market")) return "market";
        return readTarget("predict-sides") ? "sides" : "overview";
      }
      if (prev === "scores") {
        if (readTarget("predict-tools")) return "tools";
        if (readTarget("predict-market")) return "market";
        return readTarget("predict-sides") ? "sides" : "overview";
      }
      if (prev === "bonus") return "scores";
      if (prev === "enter") {
        return readTarget("predict-bonus") ? "bonus" : "scores";
      }
      if (prev === "submit") return "enter";
      return prev;
    });
  }, []);

  if (!mounted || !open) return null;

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const calloutH = calloutBox?.height ?? CALLOUT_EST_H;
  const spaceBelow = hole
    ? vh - (hole.top + hole.height) - CALLOUT_EDGE
    : 0;
  const spaceAbove = hole ? hole.top - CALLOUT_EDGE : 0;
  const need = calloutH + CALLOUT_GAP;
  /** 下に収まるなら下、足りなければ空きの大きい側へ */
  const preferCalloutBelow =
    hole != null &&
    (spaceBelow >= need || (spaceBelow >= spaceAbove && spaceBelow > 96));
  const calloutStyle = preferCalloutBelow && hole
    ? {
        top: Math.max(
          CALLOUT_EDGE,
          Math.min(
            hole.top + hole.height + CALLOUT_GAP,
            vh - calloutH - CALLOUT_EDGE
          )
        ),
        left: "50%" as const,
        transform: "translateX(-50%)",
      }
    : hole
      ? {
          bottom: Math.min(
            Math.max(CALLOUT_EDGE, vh - hole.top + CALLOUT_GAP),
            Math.max(CALLOUT_EDGE, vh - calloutH - CALLOUT_EDGE)
          ),
          left: "50%" as const,
          transform: "translateX(-50%)",
        }
      : {
          top: "50%" as const,
          left: "50%" as const,
          transform: "translate(-50%, -50%)",
        };

  const line =
    (focusRect ?? hole) && calloutBox
      ? (() => {
          const tip = focusRect ?? hole!;
          const hx = tip.left + tip.width / 2;
          const hy = preferCalloutBelow
            ? tip.top + tip.height
            : tip.top;
          const cx = calloutBox.left + calloutBox.width / 2;
          const cy = preferCalloutBelow
            ? calloutBox.top
            : calloutBox.top + calloutBox.height;
          return { x1: cx, y1: cy, x2: hx, y2: hy };
        })()
      : null;

  /** カード内ナビ: 穴より狭いフォーカスがあるときだけ出す */
  const showFocusNav =
    focusRect != null &&
    hole != null &&
    (step === "sides" ||
      step === "market" ||
      Math.abs(focusRect.height - hole.height) > 12 ||
      Math.abs(focusRect.width - hole.width) > 12);

  const focusNavLabel =
    step === "market"
      ? marketTitle
      : step === "sides"
        ? sidesTitle
        : copy.title;

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

  return createPortal(
    <AnimatePresence>
      {open && revealReady ? (
        <motion.div
          key="tutorial-predict-annot"
          className="pointer-events-none fixed inset-0"
          style={{
            zIndex: TUTORIAL_PREDICT_ANNOT_Z_INDEX,
            isolation: "isolate",
          }}
        >
          {hole ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
            >
              <div
                className="pointer-events-auto absolute"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, hole.top),
                  background: SCRIM_BG,
                  ...SCRIM_BLUR,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  top: hole.top + hole.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: SCRIM_BG,
                  ...SCRIM_BLUR,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  top: hole.top,
                  left: 0,
                  width: Math.max(0, hole.left),
                  height: hole.height,
                  background: SCRIM_BG,
                  ...SCRIM_BLUR,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  top: hole.top,
                  left: hole.left + hole.width,
                  right: 0,
                  height: hole.height,
                  background: SCRIM_BG,
                  ...SCRIM_BLUR,
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                  boxShadow: showFocusNav
                    ? `0 0 0 1px ${TUTORIAL_CYAN}55, 0 0 14px ${TUTORIAL_CYAN}22`
                    : `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 22px ${TUTORIAL_CYAN}55`,
                }}
              />
              {showFocusNav && focusRect ? (
                <motion.div
                  key={`focus-${step}`}
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    top: focusRect.top - 2,
                    left: focusRect.left - 2,
                    width: focusRect.width + 4,
                    height: focusRect.height + 4,
                  }}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      clipPath: CYBER_CHAMFER_CLIP,
                      WebkitClipPath: CYBER_CHAMFER_CLIP,
                      boxShadow: `0 0 0 2px ${TUTORIAL_CYAN}`,
                    }}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            boxShadow: [
                              `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 12px ${TUTORIAL_CYAN}66`,
                              `0 0 0 3px ${TUTORIAL_CYAN}, 0 0 26px ${TUTORIAL_CYAN}aa`,
                              `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 12px ${TUTORIAL_CYAN}66`,
                            ],
                          }
                    }
                    transition={{
                      duration: TUTORIAL_PULSE_PERIOD_S,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.span
                    className={cn(
                      nameOxanium.className,
                      "absolute -top-3 left-1/2 max-w-[min(220px,70vw)] -translate-x-1/2 truncate rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                    )}
                    style={{
                      background: TUTORIAL_CYAN,
                      color: "#050508",
                      boxShadow: `0 0 14px ${TUTORIAL_CYAN}99`,
                    }}
                    animate={
                      reduceMotion ? undefined : { y: [0, -3, 0] }
                    }
                    transition={{
                      duration: TUTORIAL_PULSE_PERIOD_S,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {focusNavLabel}
                  </motion.span>
                </motion.div>
              ) : null}
              {/* 説明ステップでは穴も塞ぎ、最後の入力・投稿だけ通す */}
              {!allowHoleInteract ? (
                <div
                  className="pointer-events-auto absolute"
                  style={{
                    top: hole.top,
                    left: hole.left,
                    width: hole.width,
                    height: hole.height,
                  }}
                />
              ) : null}
            </motion.div>
          ) : (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: SCRIM_BG_SOFT,
                ...SCRIM_BLUR,
              }}
            />
          )}

          {line ? (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <marker
                  id="tutorial-predict-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill={TUTORIAL_CYAN} />
                </marker>
              </defs>
              <motion.line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={TUTORIAL_CYAN}
                strokeWidth={2}
                strokeDasharray="5 4"
                markerEnd="url(#tutorial-predict-arrow)"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 0.95 }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </svg>
          ) : null}

          <div
            id="tutorial-predict-callout"
            ref={calloutRef}
            className="pointer-events-auto fixed w-[min(360px,calc(100vw-32px))]"
            style={{
              ...calloutStyle,
              zIndex: TUTORIAL_PREDICT_ANNOT_Z_INDEX + 1,
            }}
          >
            <motion.div
              key={step}
              initial={
                reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: TUTORIAL_CALLOUT_DURATION_S,
                ease: EASE,
              }}
            >
              <motion.div
                className="relative isolate overflow-hidden border border-cyan-400/40 p-4"
                style={{
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                  background: TUTORIAL_CALLOUT_GLASS_BG,
                  backdropFilter: `blur(${TUTORIAL_CALLOUT_GLASS_BLUR_PX}px) saturate(${TUTORIAL_CALLOUT_GLASS_SATURATE})`,
                  WebkitBackdropFilter: `blur(${TUTORIAL_CALLOUT_GLASS_BLUR_PX}px) saturate(${TUTORIAL_CALLOUT_GLASS_SATURATE})`,
                  boxShadow: `0 0 0 1px ${TUTORIAL_CYAN}33, 0 16px 40px rgba(0,0,0,0.45), 0 0 24px ${TUTORIAL_CYAN}18, inset 0 1px 0 rgba(255,255,255,0.14)`,
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -TUTORIAL_FLOAT_Y_PX, 0],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: TUTORIAL_FLOAT_PERIOD_S,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    nameOxanium.className,
                    "text-[9px] font-bold uppercase tracking-[0.2em]"
                  )}
                  style={{ color: TUTORIAL_CYAN }}
                >
                  Tutorial
                </span>
                {onSkip ? (
                  <button
                    type="button"
                    onClick={onSkip}
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold uppercase tracking-wider text-white/45"
                    )}
                  >
                    {skipLabel}
                  </button>
                ) : null}
              </div>
              <h2
                className={cn(
                  jp.className,
                  "mb-1 text-[16px] font-bold text-white"
                )}
              >
                {copy.title}
              </h2>
              <p
                className={cn(
                  nameRajdhani.className,
                  "mb-3 text-[13px] leading-relaxed text-white/65"
                )}
              >
                {copy.body}
              </p>
              {showNext ? (
                <>
                  {waitHint ? (
                    <p
                      className={cn(
                        nameRajdhani.className,
                        "mb-2 text-center text-[12px] text-cyan-200/80"
                      )}
                    >
                      {waitHint}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    {step !== "overview" && backLabel ? (
                      <button
                        type="button"
                        onClick={goBack}
                        className={cn(
                          nameOxanium.className,
                          "shrink-0 border border-white/20 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                        )}
                        style={{
                          clipPath: CYBER_CHAMFER_CLIP,
                          WebkitClipPath: CYBER_CHAMFER_CLIP,
                        }}
                      >
                        {backLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={enterBlocked}
                      className={cn(
                        nameOxanium.className,
                        "min-w-0 flex-1 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] disabled:opacity-35"
                      )}
                      style={{
                        background: TUTORIAL_CYAN,
                        color: "#050508",
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                      }}
                    >
                      {nextLabel}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p
                    className={cn(
                      nameRajdhani.className,
                      "text-center text-[12px] text-cyan-200/80"
                    )}
                  >
                    {waitHint}
                  </p>
                  {backLabel ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className={cn(
                        nameOxanium.className,
                        "w-full border border-white/20 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                      )}
                      style={{
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                      }}
                    >
                      {backLabel}
                    </button>
                  ) : null}
                </div>
              )}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
