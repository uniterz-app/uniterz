"use client";

import { nameBebas } from "@/lib/fonts";
import { useReducedMotion } from "framer-motion";

/** 18deg × 20 = 360° の円形ドット */
const ORB_DOT_COUNT = 20;

/**
 * 共通スプラッシュ（モバイル・Web）：オーブローダー＋ UNITERZ。
 * 背景はルートの AppPageBackground を透過表示。
 */
export default function CssAnimatedSplashScreen() {
  const reduceMotion = useReducedMotion();
  const staticPose = reduceMotion === true;

  return (
    <div
      className="splash-orb-screen"
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
    >
      <div
        className={[
          "splash-orb-loader",
          staticPose ? "splash-orb-loader--static" : "",
        ].join(" ")}
        aria-hidden
      >
        {Array.from({ length: ORB_DOT_COUNT }, (_, i) => (
          <span
            key={i}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </div>

      <p className={[nameBebas.className, "splash-orb-brand"].join(" ")}>
        UNITERZ
      </p>
    </div>
  );
}
