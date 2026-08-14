"use client";

/**
 * welcome の単一カメラ。試合ページ（遠）とモーダル（近）を同じ前進量で動かす。
 * 暗幕は 2D で世界とモーダルの間に置き、fly 中に消して世界の接近を見せる。
 */
import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TUTORIAL_WELCOME_CAMERA_Z_PX,
  TUTORIAL_WELCOME_FLY_EASE,
  TUTORIAL_WELCOME_FLY_S,
  TUTORIAL_WELCOME_PASS_FADE_AT,
  TUTORIAL_WELCOME_WORLD_BLUR_PX,
  TUTORIAL_WELCOME_WORLD_REST_RX_DEG,
  TUTORIAL_WELCOME_WORLD_Z_PX,
} from "@/lib/tutorial/tutorialMotion";

type Props = {
  active: boolean;
  flying: boolean;
  overlay?: ReactNode;
  onFlyComplete?: () => void;
  children: ReactNode;
};

const SCRIM_STYLE = {
  height: "100svh",
  background:
    "radial-gradient(ellipse 80% 62% at 50% 38%, rgba(2, 6, 12, 0.06) 0%, rgba(2, 6, 12, 0.28) 58%, rgba(2, 6, 12, 0.52) 100%)",
} as const;

const CAMERA_TRANSITION = {
  duration: TUTORIAL_WELCOME_FLY_S,
  ease: TUTORIAL_WELCOME_FLY_EASE,
} as const;

export default function TutorialWelcomeWorldCamera({
  active,
  flying,
  overlay,
  onFlyComplete,
  children,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  if (!active) {
    return <>{children}</>;
  }
  if (reduceMotion) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col" style={{ minHeight: "100%" }}>
        <div
          style={{
            filter: `blur(${TUTORIAL_WELCOME_WORLD_BLUR_PX}px) brightness(0.9)`,
          }}
        >
          {children}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0"
          style={SCRIM_STYLE}
        />
        {overlay}
      </div>
    );
  }

  const cameraZ = flying ? TUTORIAL_WELCOME_CAMERA_Z_PX : 0;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{
        minHeight: "100%",
        perspective: 1400,
        perspectiveOrigin: "50% 36%",
        overflow: "visible",
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          transformOrigin: "50% 36%",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        initial={false}
        animate={{ z: cameraZ }}
        transition={CAMERA_TRANSITION}
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "50% 36%",
          }}
          initial={false}
          animate={{
            z: TUTORIAL_WELCOME_WORLD_Z_PX,
            rotateX: flying ? 0 : TUTORIAL_WELCOME_WORLD_REST_RX_DEG,
          }}
          transition={CAMERA_TRANSITION}
        >
          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            initial={false}
            animate={{
              filter: flying
                ? "blur(0px) brightness(1)"
                : `blur(${TUTORIAL_WELCOME_WORLD_BLUR_PX}px) brightness(0.9)`,
            }}
            transition={CAMERA_TRANSITION}
            style={{ willChange: "filter" }}
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0"
        style={SCRIM_STYLE}
        initial={false}
        animate={{ opacity: flying ? 0 : 1 }}
        transition={{
          duration: flying ? TUTORIAL_WELCOME_FLY_S * 0.38 : 0.4,
          ease: TUTORIAL_WELCOME_FLY_EASE,
        }}
      />
      {overlay ? (
        <motion.div
          className="pointer-events-none absolute left-0 right-0 top-0"
          style={{
            height: "100svh",
            transformOrigin: "50% 42%",
            transformStyle: "preserve-3d",
            willChange: "transform, opacity",
          }}
          initial={false}
          animate={{
            z: cameraZ,
            opacity: flying ? 0 : 1,
          }}
          transition={{
            ...CAMERA_TRANSITION,
            opacity: {
              duration: flying
                ? TUTORIAL_WELCOME_FLY_S * (1 - TUTORIAL_WELCOME_PASS_FADE_AT)
                : 0.2,
              delay: flying
                ? TUTORIAL_WELCOME_FLY_S * TUTORIAL_WELCOME_PASS_FADE_AT
                : 0,
              ease: TUTORIAL_WELCOME_FLY_EASE,
            },
          }}
          onAnimationComplete={() => {
            if (flying) onFlyComplete?.();
          }}
        >
          {overlay}
        </motion.div>
      ) : null}
    </div>
  );
}
