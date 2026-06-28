"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { nameOxanium } from "@/lib/fonts";
import type { TooltipPlacement } from "./Tooltip";
import type { KinetikCyberTooltipTheme } from "@/app/component/profile/edit/kinetikSlantTabTheme";
import { KINETIK_CYBER_TOOLTIP_DEFAULT } from "@/app/component/profile/edit/kinetikSlantTabTheme";

const TOOLTIP_WIDTH = 280;
const TOOLTIP_GAP = 10;
const TOOLTIP_ESTIMATED_HEIGHT = 130;
const BG = "#050508";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function resolvePlacement(
  anchorRect: DOMRect,
  placement: TooltipPlacement
): "above" | "below" {
  if (placement === "above") return "above";
  if (placement === "below") return "below";

  const spaceAbove = anchorRect.top - TOOLTIP_GAP;
  const spaceBelow =
    window.innerHeight - anchorRect.bottom - TOOLTIP_GAP;

  if (spaceAbove >= TOOLTIP_ESTIMATED_HEIGHT) return "above";
  if (spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT) return "below";
  return spaceBelow > spaceAbove ? "below" : "above";
}

function CornerBracket({
  className,
  accent,
  glow,
  reduceMotion,
}: {
  className: string;
  accent: string;
  glow: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.span
      className={["pointer-events-none absolute h-2 w-2", className].join(" ")}
      style={{
        borderColor: accent,
        boxShadow: `0 0 8px ${glow}`,
      }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      aria-hidden
    />
  );
}

function parseMessage(message: string): { title: string; body: string } {
  const lines = message.split("\n");
  const title = lines[0]?.trim() ?? "";
  const body = lines.slice(1).join("\n").trim();
  return { title, body };
}

function CyberTooltipTitle({
  title,
  theme,
  reduceMotion,
}: {
  title: string;
  theme: KinetikCyberTooltipTheme;
  reduceMotion: boolean;
}) {
  const isLatinBadge = /^[A-Z0-9 ]+$/i.test(title);
  const titleClass = isLatinBadge
    ? "text-[15px] font-black uppercase italic tracking-[0.2em]"
    : "text-[14px] font-bold tracking-[0.06em]";

  return (
    <div className="mb-3 flex flex-col items-center">
      <div className="flex w-full items-center gap-2">
        <motion.span
          className="h-px min-w-0 flex-1"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.accent}aa 100%)`,
            boxShadow: `0 0 8px ${theme.accent}44`,
            transformOrigin: "right center",
          }}
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.34, delay: 0.06, ease: EASE_OUT }}
          aria-hidden
        />
        <motion.span
          className="shrink-0 text-[8px] font-bold tracking-[0.28em]"
          style={{ color: `${theme.accent}99` }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          aria-hidden
        >
          //
        </motion.span>
        <motion.div
          className="relative shrink-0 px-1"
          initial={reduceMotion ? false : { opacity: 0, y: 5, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, delay: 0.04, ease: EASE_OUT }}
        >
          <span
            className={[
              nameOxanium.className,
              "pointer-events-none absolute inset-0 select-none",
              titleClass,
              reduceMotion ? "" : "cyber-tooltip-title-glitch-a",
            ].join(" ")}
            style={{
              color: theme.accent,
              transform: "translate(-1.5px, 1.5px)",
              opacity: 0.55,
            }}
            aria-hidden
          >
            {title}
          </span>
          <span
            className={[
              nameOxanium.className,
              "pointer-events-none absolute inset-0 select-none",
              titleClass,
              reduceMotion ? "" : "cyber-tooltip-title-glitch-b",
            ].join(" ")}
            style={{
              color: "#ffffff",
              transform: "translate(1px, -1px)",
              opacity: 0.28,
            }}
            aria-hidden
          >
            {title}
          </span>
          <p
            className={[
              nameOxanium.className,
              "relative z-[1] text-center",
              titleClass,
              reduceMotion ? "" : "cyber-tooltip-title-glow",
            ].join(" ")}
            style={{
              backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${theme.title} 42%, ${theme.accent} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 0 10px ${theme.accent}66)`,
            }}
          >
            {title}
          </p>
        </motion.div>
        <motion.span
          className="shrink-0 text-[8px] font-bold tracking-[0.28em]"
          style={{ color: `${theme.accent}99` }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          aria-hidden
        >
          //
        </motion.span>
        <motion.span
          className="h-px min-w-0 flex-1"
          style={{
            background: `linear-gradient(90deg, ${theme.accent}aa 0%, transparent 100%)`,
            boxShadow: `0 0 8px ${theme.accent}44`,
            transformOrigin: "left center",
          }}
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.34, delay: 0.06, ease: EASE_OUT }}
          aria-hidden
        />
      </div>
      <motion.span
        className="mt-2 h-px w-[72%]"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accent}88, transparent)`,
          boxShadow: `0 0 10px ${theme.glow}`,
        }}
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.14, ease: EASE_OUT }}
        aria-hidden
      />
    </div>
  );
}

export default function CyberTooltip({
  anchorRect,
  message,
  onClose,
  placement = "auto",
  theme = KINETIK_CYBER_TOOLTIP_DEFAULT,
}: {
  anchorRect: DOMRect | null;
  message: string;
  onClose: () => void;
  placement?: TooltipPlacement;
  theme?: KinetikCyberTooltipTheme;
}) {
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    if (!anchorRect) return;

    function handler(e: MouseEvent) {
      const box = document.getElementById("cyber-tooltip-box");
      if (box && box.contains(e.target as Node)) return;
      onClose();
    }

    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [anchorRect, onClose]);

  if (!anchorRect || typeof document === "undefined") return null;

  const sw = window.innerWidth;
  const resolved = resolvePlacement(anchorRect, placement);
  const { title, body } = parseMessage(message);
  const bodyParagraphs = body ? body.split(/\n\n+/).filter(Boolean) : [];

  const centerX = anchorRect.left + anchorRect.width / 2;
  let leftPx = centerX - TOOLTIP_WIDTH / 2;
  leftPx = Math.max(12, Math.min(leftPx, sw - TOOLTIP_WIDTH - 12));

  const topPx =
    resolved === "above" ? anchorRect.top : anchorRect.bottom;
  const baseTransform =
    resolved === "above"
      ? `translateY(calc(-100% - ${TOOLTIP_GAP}px))`
      : `translateY(${TOOLTIP_GAP}px)`;
  const enterY = resolved === "above" ? 8 : -8;

  return createPortal(
    <motion.div
      className="fixed z-[9999]"
      style={{
        left: leftPx,
        top: topPx,
        width: TOOLTIP_WIDTH,
        transform: baseTransform,
        filter: `drop-shadow(0 0 16px ${theme.glow}) drop-shadow(0 0 28px ${theme.accent}28)`,
      }}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, scale: 0.95, y: enterY }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        id="cyber-tooltip-box"
        className={[
          "relative overflow-hidden rounded-sm border px-3.5 py-3",
          reduceMotion ? "" : "cyber-tooltip-border-pulse",
        ].join(" ")}
        style={{
          background: BG,
          borderColor: `${theme.accent}88`,
          boxShadow: `inset 0 0 28px ${theme.accent}1a, 0 0 0 1px ${theme.accent}40`,
          ["--cyber-tooltip-accent" as string]: theme.accent,
          ["--cyber-tooltip-glow" as string]: theme.glow,
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: [
                  `inset 0 0 28px ${theme.accent}1a, 0 0 0 1px ${theme.accent}40`,
                  `inset 0 0 34px ${theme.accent}28, 0 0 0 1px ${theme.accent}66`,
                  `inset 0 0 28px ${theme.accent}1a, 0 0 0 1px ${theme.accent}40`,
                ],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(${theme.grid} 1px, transparent 1px),
              linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)
            `,
            backgroundSize: "18px 18px",
          }}
          aria-hidden
        />
        {!reduceMotion ? (
          <span
            className="cyber-tooltip-scan-sweep pointer-events-none absolute inset-y-0 left-0 w-[38%] opacity-35"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent}33, transparent)`,
            }}
            aria-hidden
          />
        ) : null}

        <CornerBracket
          className="left-0 top-0 border-l border-t"
          accent={theme.accent}
          glow={theme.glow}
          reduceMotion={reduceMotion}
        />
        <CornerBracket
          className="right-0 top-0 border-r border-t"
          accent={theme.accent}
          glow={theme.glow}
          reduceMotion={reduceMotion}
        />
        <CornerBracket
          className="bottom-0 left-0 border-b border-l"
          accent={theme.accent}
          glow={theme.glow}
          reduceMotion={reduceMotion}
        />
        <CornerBracket
          className="bottom-0 right-0 border-b border-r"
          accent={theme.accent}
          glow={theme.glow}
          reduceMotion={reduceMotion}
        />

        <div className="relative z-[1]">
          {title ? (
            <CyberTooltipTitle
              title={title}
              theme={theme}
              reduceMotion={reduceMotion}
            />
          ) : null}
          {bodyParagraphs.length > 0 ? (
            <div className="space-y-2">
              {bodyParagraphs.map((paragraph, index) => (
                <motion.p
                  key={`${index}-${paragraph.slice(0, 12)}`}
                  className="whitespace-pre-line text-center text-[12px] leading-[1.65]"
                  style={{
                    color: index === 0 ? theme.body : theme.bodyMuted,
                    textShadow:
                      index === 0 ? `0 0 12px ${theme.accent}44` : "none",
                  }}
                  initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: 0.12 + index * 0.07,
                    ease: EASE_OUT,
                  }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className={[
            "absolute left-[50%] h-0 w-0 -translate-x-1/2",
            resolved === "above" ? "-bottom-2" : "-top-2",
          ].join(" ")}
          style={
            resolved === "above"
              ? {
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: `7px solid ${BG}`,
                  filter: `drop-shadow(0 0 5px ${theme.glow})`,
                }
              : {
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderBottom: `7px solid ${BG}`,
                  filter: `drop-shadow(0 0 5px ${theme.glow})`,
                }
          }
          aria-hidden
        />
      </motion.div>
    </motion.div>,
    document.body
  );
}
