"use client";

/**
 * 試合面・暗幕・CTA を同じ perspective の 3D 空間に置く。
 * 世界は奥（translateZ -520）、暗幕と CTA は手前。
 * 2D の兄弟にすると、カードの GPU レイヤーが CTA より前面に合成される。
 */
import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TUTORIAL_WELCOME_CAMERA_Z_PX,
  TUTORIAL_WELCOME_FLY_EASE,
  TUTORIAL_WELCOME_FLY_S,
  TUTORIAL_WELCOME_MODAL_PASS_SCALE,
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

const PERSPECTIVE_PX = 1400;
/** 暗幕は世界より手前。CTA はさらに手前 */
const SCRIM_Z_PX = 48;
const OVERLAY_Z_PX = 96;

const SCRIM_FILL =
  "linear-gradient(to bottom, rgba(2, 6, 12, 0.55) 0%, rgba(2, 6, 12, 0.72) 42%, rgba(2, 6, 12, 0.86) 100%)";

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

  const restFilter = `blur(${TUTORIAL_WELCOME_WORLD_BLUR_PX}px) brightness(0.55)`;

  if (reduceMotion) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col" style={{ minHeight: "100%" }}>
        <div
          className="pointer-events-none flex min-h-0 flex-1 flex-col"
          style={{ filter: restFilter }}
        >
          {children}
        </div>
        {overlay ? (
          <>
            <div
              aria-hidden
              className="pointer-events-auto absolute inset-0"
              style={{ background: SCRIM_FILL }}
            />
            <div className="pointer-events-none absolute inset-0">{overlay}</div>
          </>
        ) : null}
      </div>
    );
  }

  const cameraZ = flying ? TUTORIAL_WELCOME_CAMERA_Z_PX : 0;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{
        minHeight: "100%",
        perspective: PERSPECTIVE_PX,
        perspectiveOrigin: "50% 36%",
        transformStyle: "preserve-3d",
        overflow: flying ? "visible" : "hidden",
      }}
    >
      <motion.div
        className={
          flying
            ? "flex min-h-0 flex-1 flex-col"
            : "pointer-events-none flex min-h-0 flex-1 flex-col"
        }
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
          {children}
        </motion.div>
      </motion.div>

      {overlay ? (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: SCRIM_FILL,
              transformStyle: "preserve-3d",
              pointerEvents: flying ? "none" : "auto",
            }}
            initial={false}
            animate={{
              z: SCRIM_Z_PX,
              opacity: flying ? 0 : 1,
            }}
            transition={{
              duration: flying ? TUTORIAL_WELCOME_FLY_S * 0.38 : 0.4,
              ease: TUTORIAL_WELCOME_FLY_EASE,
            }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "50% 42%",
              willChange: "transform, opacity",
            }}
            initial={false}
            animate={{
              z: OVERLAY_Z_PX,
              opacity: flying ? 0 : 1,
              scale: flying ? TUTORIAL_WELCOME_MODAL_PASS_SCALE : 1,
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
        </>
      ) : null}
    </div>
  );
}
