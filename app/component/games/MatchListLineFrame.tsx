"use client";

import { type MouseEventHandler, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { nameOxanium } from "@/lib/fonts";
import {
  GAMES_CYBER_EASE,
  GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_SEC,
  GAMES_LINE_FRAME_DRAW_SEC,
} from "@/app/component/games/cyberMotion";
import {
  interruptedRoundedRectStrokeHalves,
  MATCH_LINE_FRAME_TOP_GAP_START_INSET,
  matchLineFrameLabelMaxWidth,
  matchLineFramePaint,
} from "@/lib/games/matchListLineFrame";
import MatchPickupSideLabel from "@/app/component/games/MatchPickupSideLabel";

const STROKE = 1.5;
const LABEL_GAP_PAD = 16;
const MIN_TICK_GAP = 12;

type Props = {
  children: ReactNode;
  topLabel?: string;
  /** 上辺ラベル位置。プロフィール概要は start */
  topLabelAlign?: "center" | "start";
  predicted?: boolean;
  pickup?: boolean;
  /** 左辺縦ラベル（ピックアップは `PICK UP`） */
  leftLabel?: string;
  paint?: { color: string; glow: string };
  className?: string;
  topLabelTutorialTarget?: string;
  leftLabelTutorialTarget?: string;
  /** ラウンドラベルから左右パスを描く登場アニメ */
  animateDraw?: boolean;
  /** 描画開始の遅延（秒） */
  drawDelaySec?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
  /** 上辺ラベル用の外側パディングを付けない（My Rank など） */
  flush?: boolean;
  /** false なら中身は枠描画中も表示（既定は描画後にフェードイン） */
  fadeContent?: boolean;
  /** 上辺を閉じる（My Rank。左右から同時に描いて中央で接続） */
  closedTop?: boolean;
};

/**
 * Native `MatchListLineFrameNative` 相当。
 * ラウンドラベルで途切れた直角ストロークがカードを包む。
 */
export default function MatchListLineFrame({
  children,
  topLabel,
  topLabelAlign = "center",
  predicted = false,
  pickup = false,
  leftLabel,
  paint,
  className,
  topLabelTutorialTarget,
  leftLabelTutorialTarget,
  animateDraw = false,
  drawDelaySec = 0,
  onClick,
  flush = false,
  fadeContent = true,
  closedTop = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const leftLabelRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [topLabelW, setTopLabelW] = useState(0);
  const [leftLabelH, setLeftLabelH] = useState(0);
  const reduceMotion = useReducedMotion();
  const { color, glow } = paint ?? matchLineFramePaint({ pickup, predicted });
  const shouldDraw = animateDraw && !reduceMotion;
  const [pressed, setPressed] = useState(false);

  function isCaptureSkip(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest("[data-capture-skip]"));
  }

  const pressable = Boolean(onClick) && !reduceMotion;
  const setCardPressed = (next: boolean, target?: EventTarget | null) => {
    if (!pressable) return;
    if (next && isCaptureSkip(target ?? null)) return;
    setPressed(next);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      setSize((prev) =>
        Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5
          ? prev
          : { w, h }
      );
      const labelW = labelRef.current?.getBoundingClientRect().width ?? 0;
      setTopLabelW((prev) => (Math.abs(prev - labelW) < 0.5 ? prev : labelW));
      const leftH = leftLabelRef.current?.getBoundingClientRect().height ?? 0;
      setLeftLabelH((prev) => (Math.abs(prev - leftH) < 0.5 ? prev : leftH));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    if (labelRef.current) ro.observe(labelRef.current);
    if (leftLabelRef.current) ro.observe(leftLabelRef.current);
    return () => ro.disconnect();
  }, [topLabel, leftLabel]);

  const labelMaxW = matchLineFrameLabelMaxWidth({
    frameWidth: size.w,
    align: topLabelAlign,
  });
  const topGap = closedTop
    ? 0
    : topLabel && topLabelW > 0
      ? topLabelW + LABEL_GAP_PAD
      : MIN_TICK_GAP;
  const leftGap =
    leftLabel && leftLabelH > 0 ? leftLabelH + LABEL_GAP_PAD : 0;
  const halves =
    size.w > 0 && size.h > 0 && (!topLabel || topLabelW > 0)
      ? interruptedRoundedRectStrokeHalves({
          width: size.w,
          height: size.h,
          radius: 0,
          inset: STROKE / 2,
          topGap,
          bottomGap: 0,
          leftGap,
          topGapAlign: topLabelAlign,
          topGapStartInset: MATCH_LINE_FRAME_TOP_GAP_START_INSET,
        })
      : null;

  const drawTransition = {
    duration: GAMES_LINE_FRAME_DRAW_SEC,
    delay: drawDelaySec + GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_SEC,
    ease: GAMES_CYBER_EASE,
  } as const;

  const pathMotion = shouldDraw
    ? {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: drawTransition,
      }
    : {
        initial: false as const,
        animate: { pathLength: 1 },
        transition: { duration: 0 },
      };

  return (
    <div
      className={["relative w-full overflow-visible", flush ? "" : "pt-3.5", className]
        .filter(Boolean)
        .join(" ")}
      style={
        pressable
          ? {
              transformOrigin: "50% 50%",
              transform: pressed ? "scale(0.99)" : "scale(1)",
              opacity: pressed ? 0.96 : 1,
              transition: pressed
                ? "transform 90ms ease-out, opacity 90ms ease-out"
                : "transform 160ms ease-out, opacity 160ms ease-out",
            }
          : undefined
      }
      onClick={onClick}
      onPointerDown={(e) => setCardPressed(true, e.target)}
      onPointerUp={() => setCardPressed(false)}
      onPointerLeave={() => setCardPressed(false)}
      onPointerCancel={() => setCardPressed(false)}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as Parameters<MouseEventHandler<HTMLDivElement>>[0]);
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div ref={rootRef} className="relative w-full overflow-visible">
        {halves ? (
          <svg
            key={`${Math.round(size.w)}-${Math.round(size.h)}-${Math.round(topGap)}`}
            className="pointer-events-none absolute inset-0 z-[2] overflow-visible"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            style={{ pointerEvents: "none" }}
            aria-hidden
          >
            <motion.path
              d={halves.left}
              fill="none"
              stroke={glow}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="miter"
              style={{ pointerEvents: "none" }}
              {...pathMotion}
            />
            <motion.path
              d={halves.right}
              fill="none"
              stroke={glow}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="miter"
              style={{ pointerEvents: "none" }}
              {...pathMotion}
            />
            <motion.path
              d={halves.left}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="miter"
              style={{ pointerEvents: "none" }}
              {...pathMotion}
            />
            <motion.path
              d={halves.right}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="miter"
              style={{ pointerEvents: "none" }}
              {...pathMotion}
            />
          </svg>
        ) : null}

        {leftLabel ? (
          <MatchPickupSideLabel
            color={color}
            tutorialTarget={leftLabelTutorialTarget}
            measureRef={leftLabelRef}
          />
        ) : null}

        {topLabel ? (
          <div
            className={[
              "pointer-events-none absolute top-0 z-[3] flex -translate-y-2.5",
              topLabelAlign === "start" ? "justify-start right-6" : "left-6 right-6 justify-center",
            ].join(" ")}
            style={
              topLabelAlign === "start"
                ? {
                    left:
                      MATCH_LINE_FRAME_TOP_GAP_START_INSET + LABEL_GAP_PAD / 2,
                  }
                : undefined
            }
          >
            <motion.span
              ref={labelRef}
              className={`${nameOxanium.className} max-w-full truncate font-bold uppercase leading-[18px] tracking-[0.08em] ${
                topLabelAlign === "start" ? "text-left text-[15px]" : "text-center text-[15px]"
              }`}
              style={{
                color,
                transform: "skewX(-10deg)",
                maxWidth: labelMaxW > 0 ? labelMaxW : undefined,
              }}
              data-tutorial-target={topLabelTutorialTarget}
              initial={shouldDraw ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{
                duration: GAMES_LINE_FRAME_DRAW_SEC * 0.12,
                delay: drawDelaySec + GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_SEC,
                ease: GAMES_CYBER_EASE,
              }}
            >
              {topLabel}
            </motion.span>
          </div>
        ) : null}

        <motion.div
          className="relative z-[1] pointer-events-auto"
          initial={shouldDraw && fadeContent ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={
            shouldDraw && fadeContent
              ? {
                  duration: 0.28,
                  delay:
                    drawDelaySec +
                    GAMES_LINE_FRAME_DRAW_DELAY_AFTER_SHELL_SEC +
                    GAMES_LINE_FRAME_DRAW_SEC +
                    0.04,
                  ease: GAMES_CYBER_EASE,
                }
              : { duration: 0 }
          }
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
