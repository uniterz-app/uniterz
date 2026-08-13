"use client";

/**
 * サイバー起動スプラッシュ — 枠に光ライン → 白塗りロゴ出現。
 * 本番差し替え前のプレビュー用。正アセット: public/brand/uniterz-logo.svg
 */
import { useReducedMotion } from "framer-motion";
import {
  UNITERZ_LOGO_SPLASH_ACCENT,
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
} from "@/lib/units/uniterzLogoSplash";

export type CyberLogoSplashScreenProps = {
  className?: string;
  /** true でアニメなしの完成形（プレビューの強制静的用） */
  forceStatic?: boolean;
};

export default function CyberLogoSplashScreen({
  className,
  forceStatic = false,
}: CyberLogoSplashScreenProps) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;

  return (
    <div
      className={[
        "splash-logo-screen",
        staticPose ? "splash-logo-screen--static" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
    >
      <div className="splash-logo-bg" aria-hidden>
        <div className="splash-logo-bg-grid splash-cyber-grid" />
        <div className="splash-logo-bg-scan splash-cyber-scanlines" />
        <div className="splash-logo-bg-vignette" />
      </div>

      <div className="splash-logo-stage" aria-hidden>
        <div className="splash-logo-bloom" />
        <svg
          className="splash-logo-svg"
          viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="UNITERZ"
        >
          <defs>
            <filter
              id="splash-logo-edge-glow"
              x="-20%"
              y="-40%"
              width="140%"
              height="180%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="2.4"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 枠：シアン光ライン描画 */}
          <g
            className="splash-logo-edge"
            fill="none"
            stroke={UNITERZ_LOGO_SPLASH_ACCENT}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#splash-logo-edge-glow)"
          >
            {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
              <path key={`edge-${i}`} d={d} pathLength={1} />
            ))}
          </g>

          {/* 塗り：白ロゴ出現 */}
          <g className="splash-logo-fill" fill="#ffffff">
            {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
              <path key={`fill-${i}`} d={d} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
