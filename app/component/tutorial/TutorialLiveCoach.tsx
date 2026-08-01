"use client";

/**
 * 本番画面の上に載せるコーチマーク（画面自体は差し替えない）。
 * data-tutorial-target をくり抜きハイライト + 中央コールアウト。
 * 対象があるときは中央モーダルから誘導線で指す（ナビ誘導など）。
 * 開始時に背景ぼかしをアニメーションで入れる。
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
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
  TUTORIAL_PULSE_PERIOD_S,
  TUTORIAL_SCRIM_OPACITY,
  TUTORIAL_SPOTLIGHT_DURATION_S,
} from "@/lib/tutorial/tutorialMotion";
import { scrollTutorialTargetIntoView } from "@/lib/tutorial/scrollTutorialTargetIntoView";
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";
import TutorialSlideVisual from "@/app/component/tutorial/TutorialSlideVisual";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;
const PAD = 6;
/** 試合カードはパルスバッジ分も穴に含める */
const PAD_MATCH_CARD = 14;
const PAD_SIDES = 10;

const SCRIM_STYLE: CSSProperties = {
  background: `rgba(2, 6, 12, ${TUTORIAL_SCRIM_OPACITY})`,
  backdropFilter: `blur(${TUTORIAL_BG_BLUR_PX}px)`,
  WebkitBackdropFilter: `blur(${TUTORIAL_BG_BLUR_PX}px)`,
};

type Rect = { top: number; left: number; width: number; height: number };

type Props = {
  open: boolean;
  title: string;
  body: string;
  skipLabel: string;
  nextLabel?: string;
  /** ハイライト対象。null なら暗幕のみ */
  target?: string | null;
  onSkip: () => void;
  onNext?: () => void;
  /** 機能確認用: 前のステップへ戻る */
  onBack?: () => void;
  backLabel?: string;
  /** 次へボタンを出さず、ユーザー操作待ちのとき */
  waitHint?: string | null;
  /** false で穴の枠線を出さない（PulseHint と二重になるとき） */
  showHoleRing?: boolean;
  /**
   * 詳細確認用: 背後を操作でき、ぼかしを弱くする（スクロールして中身を見る）
   */
  allowInteractBehind?: boolean;
  /** 穴（ハイライト対象）をタップしたとき */
  onTargetPress?: () => void;
  /** 図解（文字だけのモーダルを避ける） */
  visual?: TutorialVisualId | null;
  children?: ReactNode;
};

function readRawRect(target: string, pad = PAD): Rect | null {
  const el = document.querySelector(
    `[data-tutorial-target="${target}"]`
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
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

function unionRects(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * リザルト詳細はスコア帯だけだと狭いので、
 * 同一カード内のチーム／指標まで穴を広げて見せる。
 */
function readRect(target: string): Rect | null {
  const primary =
    target === "match-card"
      ? readRawRect(target, PAD_MATCH_CARD)
      : readRawRect(target);
  if (!primary) return null;

  if (target === "result-detail-score") {
    const sides = readRawRect("predict-sides", PAD_SIDES);
    return clampRectToViewport(
      sides ? unionRects([primary, sides]) : primary
    );
  }
  if (target === "result-detail-stats") {
    const parts = [
      primary,
      readRawRect("result-detail-score"),
      readRawRect("predict-sides", PAD_SIDES),
    ].filter((r): r is Rect => r != null);
    return clampRectToViewport(unionRects(parts));
  }
  return clampRectToViewport(primary);
}

/** 誘導線・フォーカス枠用の狭い対象 */
function readFocusRect(target: string): Rect | null {
  const r = readRawRect(target);
  return r ? clampRectToViewport(r) : null;
}

/** 被らないときの中央コールアウト */
const CENTER_CALLOUT_STYLE: CSSProperties = {
  position: "fixed",
  left: "50%",
  top: "50%",
  width: "min(360px, calc(100vw - 32px))",
  maxWidth: 360,
  zIndex: 1000061,
  transform: "translate(-50%, -50%)",
};

const CALLOUT_GAP = 14;
const CALLOUT_EST_H = 280;
const CALLOUT_EDGE = 16 + TUTORIAL_FLOAT_Y_PX;

/** 中央に置くと穴を塞ぐ対象（試合カード等）は近くに寄せる */
function buildNearTargetCalloutStyle(
  hole: Rect,
  calloutH = CALLOUT_EST_H
): CSSProperties {
  const width = "min(360px, calc(100vw - 32px))";
  const base: CSSProperties = {
    position: "fixed",
    left: "50%",
    width,
    maxWidth: 360,
    zIndex: 1000061,
    transform: "translateX(-50%)",
  };
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const h = Math.max(120, calloutH);
  const spaceBelow = vh - (hole.top + hole.height) - CALLOUT_EDGE;
  const spaceAbove = hole.top - CALLOUT_EDGE;
  const preferAbove =
    spaceBelow < h + CALLOUT_GAP && spaceAbove >= spaceBelow;
  if (preferAbove) {
    return {
      ...base,
      bottom: Math.min(
        Math.max(CALLOUT_EDGE, vh - hole.top + CALLOUT_GAP),
        Math.max(CALLOUT_EDGE, vh - h - CALLOUT_EDGE)
      ),
    };
  }
  return {
    ...base,
    top: Math.max(
      CALLOUT_EDGE,
      Math.min(hole.top + hole.height + CALLOUT_GAP, vh - h - CALLOUT_EDGE)
    ),
  };
}

export default function TutorialLiveCoach({
  open,
  title,
  body,
  skipLabel,
  nextLabel,
  target = null,
  onSkip,
  onNext,
  onBack,
  backLabel,
  waitHint = null,
  showHoleRing = true,
  allowInteractBehind = false,
  onTargetPress,
  visual = null,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [hole, setHole] = useState<Rect | null>(null);
  const [focusRect, setFocusRect] = useState<Rect | null>(null);
  const [calloutBox, setCalloutBox] = useState<Rect | null>(null);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  const measure = useCallback(() => {
    if (!target) {
      setHole(null);
      setFocusRect(null);
      return;
    }
    setHole(readRect(target));
    setFocusRect(
      target.startsWith("result-detail-") ? readFocusRect(target) : null
    );
  }, [target]);

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

  useLayoutEffect(() => {
    if (!open) return;
    /** 固定ナビはスクロール不要。リザルト詳細はカード上端（sides）へ */
    if (target && !target.startsWith("nav-")) {
      const scrollId =
        (target === "result-detail-score" ||
          target === "result-detail-stats") &&
        document.querySelector('[data-tutorial-target="predict-sides"]')
          ? "predict-sides"
          : target;
      scrollTutorialTargetIntoView(scrollId, {
        behavior: reduceMotion ? "auto" : "smooth",
        idealRatio:
          target === "result-detail-score" || target === "result-detail-stats"
            ? 0.16
            : 0.28,
      });
    }
    measure();
    const onResize = () => {
      measure();
      /** コールアウトも測り直し（誘導線用） */
      const el = document.getElementById("tutorial-live-coach-callout");
      if (el) {
        const r = el.getBoundingClientRect();
        setCalloutBox({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const t = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(() => {
      if (target && !target.startsWith("nav-")) {
        const scrollId =
          (target === "result-detail-score" ||
            target === "result-detail-stats") &&
          document.querySelector('[data-tutorial-target="predict-sides"]')
            ? "predict-sides"
            : target;
        scrollTutorialTargetIntoView(scrollId, {
          behavior: "auto",
          idealRatio:
            target === "result-detail-score" ||
            target === "result-detail-stats"
              ? 0.16
              : 0.28,
        });
      }
      measure();
      onResize();
    }, 400);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [open, measure, target, reduceMotion]);

  if (!mounted) return null;

  /** ターゲットなし／画面全体説明は全面ぼかし禁止 */
  const softBackdrop = allowInteractBehind || !target;
  /**
   * - 画面全体説明: 下（背後を見せる）
   * - ナビ誘導・対象なし: 中央 + 誘導線
   * - 試合カード等: 穴の近く（中央だと被る）
   */
  const calloutStyle: CSSProperties = allowInteractBehind
    ? {
        position: "fixed",
        left: "50%",
        bottom: "max(16px, calc(env(safe-area-inset-bottom) + 72px))",
        width: "min(360px, calc(100vw - 32px))",
        maxWidth: 360,
        zIndex: 1000061,
        transform: "translateX(-50%)",
      }
    : !target || target.startsWith("nav-") || !hole
      ? CENTER_CALLOUT_STYLE
      : buildNearTargetCalloutStyle(hole, calloutBox?.height ?? CALLOUT_EST_H);

  const line =
    (focusRect ?? hole) && calloutBox
      ? (() => {
          const tip = focusRect ?? hole!;
          const tipMidY = tip.top + tip.height / 2;
          const calloutMidY = calloutBox.top + calloutBox.height / 2;
          const tipIsAbove = tipMidY < calloutMidY;
          const cx = calloutBox.left + calloutBox.width / 2;
          const cy = tipIsAbove
            ? calloutBox.top
            : calloutBox.top + calloutBox.height;
          const hx = tip.left + tip.width / 2;
          const hy = tipIsAbove ? tip.top + tip.height : tip.top;
          return { x1: cx, y1: cy, x2: hx, y2: hy };
        })()
      : null;

  const showFocusNav =
    focusRect != null &&
    hole != null &&
    (Math.abs(focusRect.height - hole.height) > 16 ||
      Math.abs(focusRect.width - hole.width) > 16);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-live-coach"
          className="pointer-events-none fixed inset-0 z-[1000060]"
          style={{ isolation: "isolate" }}
        >
          {/* 背景: ソフトは下フェードのみ／スポットライトは穴あきぼかし */}
          {softBackdrop ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
              style={{
                background:
                  "linear-gradient(to top, rgba(2,6,12,0.42) 0%, rgba(2,6,12,0.14) 55%, transparent 100%)",
              }}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
            />
          ) : hole ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
            >
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, hole.top),
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top + hole.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top,
                  left: 0,
                  width: Math.max(0, hole.left),
                  height: hole.height,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top,
                  left: hole.left + hole.width,
                  right: 0,
                  height: hole.height,
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute rounded-xl"
                animate={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                style={{
                  boxShadow: showHoleRing
                    ? showFocusNav
                      ? `0 0 0 1px ${TUTORIAL_CYAN}55, 0 0 14px ${TUTORIAL_CYAN}22`
                      : `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 22px ${TUTORIAL_CYAN}66`
                    : undefined,
                }}
              />
              {showFocusNav && focusRect ? (
                <motion.div
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
                    {title}
                  </motion.span>
                </motion.div>
              ) : null}
              {onTargetPress && hole ? (
                <button
                  type="button"
                  aria-label={waitHint ?? title}
                  className="pointer-events-auto absolute cursor-pointer rounded-xl bg-transparent"
                  style={{
                    top: hole.top,
                    left: hole.left,
                    width: hole.width,
                    height: hole.height,
                  }}
                  onClick={onTargetPress}
                />
              ) : null}
            </motion.div>
          ) : null}

          {line ? (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <marker
                  id="tutorial-live-coach-arrow"
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
                strokeWidth={1.5}
                strokeDasharray="5 5"
                markerEnd="url(#tutorial-live-coach-arrow)"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 0.92 }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </svg>
          ) : null}

          {/* transform は外枠固定。motion は内側のみ（中央ズレ防止） */}
          <div
            id="tutorial-live-coach-callout"
            ref={calloutRef}
            className="pointer-events-auto"
            style={calloutStyle}
          >
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{
                duration: TUTORIAL_CALLOUT_DURATION_S,
                ease: EASE,
                delay: reduceMotion ? 0 : 0.06,
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
                  boxShadow: `0 0 0 1px ${TUTORIAL_CYAN}33, 0 16px 48px rgba(0,0,0,0.45), 0 0 28px ${TUTORIAL_CYAN}20, inset 0 1px 0 rgba(255,255,255,0.14)`,
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
                </div>
                {visual ? (
                  <div className="mb-3">
                    <TutorialSlideVisual visual={visual} className="max-w-none" />
                  </div>
                ) : null}
                <h2
                  className={cn(
                    jp.className,
                    "mb-1 text-[17px] font-bold text-white"
                  )}
                >
                  {title}
                </h2>
                <p
                  className={cn(
                    nameRajdhani.className,
                    "mb-3 text-[13px] leading-relaxed text-white/65"
                  )}
                >
                  {body}
                </p>
                {children}
                {waitHint ? (
                  <p
                    className={cn(
                      nameRajdhani.className,
                      "text-center text-[12px] text-cyan-200/75"
                    )}
                  >
                    {waitHint}
                  </p>
                ) : null}
                {onBack || (onNext && nextLabel) ? (
                  <div className="mt-1 flex gap-2">
                    {onBack && backLabel ? (
                      <button
                        type="button"
                        onClick={onBack}
                        className={cn(
                          nameOxanium.className,
                          onNext && nextLabel
                            ? "shrink-0 border border-white/20 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                            : "w-full border border-white/20 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                        )}
                        style={{
                          clipPath: CYBER_CHAMFER_CLIP,
                          WebkitClipPath: CYBER_CHAMFER_CLIP,
                        }}
                      >
                        {backLabel}
                      </button>
                    ) : null}
                    {onNext && nextLabel ? (
                      <button
                        type="button"
                        onClick={onNext}
                        className={cn(
                          nameOxanium.className,
                          "min-w-0 flex-1 py-2.5 text-[12px] font-black uppercase tracking-[0.12em]"
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
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
