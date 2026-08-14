"use client";

/**
 * welcome 用 — 文字が画面外から飛んできて揃い、輪郭だけ発光する。
 */
import { motion, useReducedMotion } from "framer-motion";
import {
  UNITERZ_LOGO_FILL_LETTERS,
  UNITERZ_LOGO_FILL_VIEWBOX,
} from "@/lib/units/uniterzLogoFillLetters";
import {
  TUTORIAL_CYAN,
  TUTORIAL_WELCOME_GATHER_EASE,
  TUTORIAL_WELCOME_GATHER_S,
  TUTORIAL_WELCOME_GLOW_S,
} from "@/lib/tutorial/tutorialMotion";

type Props = {
  className?: string;
};

/** 塗りつぶしのハローではなく、パス輪郭に沿う線幅（viewBox 単位） */
const EDGE_STROKE = 7;
const SHADOW = "drop-shadow(0 14px 18px rgba(0,0,0,0.7))";

export default function TutorialWelcomeLogoLetters({ className }: Props) {
  const reduceMotion = useReducedMotion() === true;
  const vb = `0 0 ${UNITERZ_LOGO_FILL_VIEWBOX.width} ${UNITERZ_LOGO_FILL_VIEWBOX.height}`;
  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  return (
    <div
      className={className}
      role="img"
      aria-label="UNITERZ"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: String(UNITERZ_LOGO_FILL_VIEWBOX.aspectRatio),
        overflow: "visible",
      }}
    >
      {UNITERZ_LOGO_FILL_LETTERS.map((letter, i) => {
        const landDelay = reduceMotion ? 0 : i * 0.055;
        return (
          <motion.div
            key={letter.id}
            className="pointer-events-none absolute inset-0"
            style={{ filter: SHADOW }}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 1,
                    x: letter.scatter.vx * vw,
                    y: letter.scatter.vy * vh,
                    rotate: letter.scatter.rotate,
                    scale: 0.86,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              scale: reduceMotion ? 1 : [0.86, 1, 1.06, 1],
            }}
            transition={{
              x: {
                duration: TUTORIAL_WELCOME_GATHER_S,
                delay: landDelay,
                ease: TUTORIAL_WELCOME_GATHER_EASE,
              },
              y: {
                duration: TUTORIAL_WELCOME_GATHER_S,
                delay: landDelay,
                ease: TUTORIAL_WELCOME_GATHER_EASE,
              },
              rotate: {
                duration: TUTORIAL_WELCOME_GATHER_S,
                delay: landDelay,
                ease: TUTORIAL_WELCOME_GATHER_EASE,
              },
              scale: {
                duration: TUTORIAL_WELCOME_GATHER_S + TUTORIAL_WELCOME_GLOW_S,
                delay: landDelay,
                times: [0, 0.62, 0.78, 1],
                ease: TUTORIAL_WELCOME_GATHER_EASE,
              },
            }}
          >
            <svg
              viewBox={vb}
              className="h-full w-full overflow-visible"
              aria-hidden
            >
              {letter.paths.map((d) => (
                <path key={d.slice(0, 24)} d={d} fill={TUTORIAL_CYAN} />
              ))}
            </svg>
            <motion.svg
              viewBox={vb}
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={
                reduceMotion ? { opacity: 0 } : { opacity: [0, 0, 1, 0] }
              }
              transition={{
                duration: TUTORIAL_WELCOME_GATHER_S + TUTORIAL_WELCOME_GLOW_S,
                delay: landDelay,
                times: [0, 0.62, 0.78, 1],
                ease: "easeOut",
              }}
            >
              {letter.paths.map((d) => (
                <path
                  key={`${d.slice(0, 24)}-edge`}
                  d={d}
                  fill="none"
                  stroke={TUTORIAL_CYAN}
                  strokeWidth={EDGE_STROKE}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
            </motion.svg>
          </motion.div>
        );
      })}
    </div>
  );
}
