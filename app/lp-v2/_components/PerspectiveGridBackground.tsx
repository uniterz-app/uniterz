"use client";

import { useEffect, useRef, useState } from "react";

type PerspectiveGridBackgroundProps = {
  mobileOptimized?: boolean;
  onRevealComplete?: () => void;
};

export default function PerspectiveGridBackground({
  mobileOptimized = false,
  onRevealComplete,
}: PerspectiveGridBackgroundProps) {
  const revealDurationMs = mobileOptimized ? 3200 : 2800;
  const [animKey, setAnimKey] = useState(0);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const floorSide = mobileOptimized ? "-18%" : "-24%";
  const floorBottom = mobileOptimized ? "-16%" : "-22%";
  const floorHeight = mobileOptimized ? "72%" : "72%";
  const wallSide = mobileOptimized ? "-22%" : "-18%";
  const wallWidth = mobileOptimized ? "52%" : "40%";
  const wallVertical = mobileOptimized ? "-6%" : "-8%";
  const gridSize = mobileOptimized ? "30px 30px" : "38px 38px";
  const wallRotate = mobileOptimized ? 61 : 66;

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    // Replay animation when page is shown again (including bfcache restore).
    let timer: ReturnType<typeof setTimeout> | null = null;
    const replay = () => {
      setAnimKey((prev) => prev + 1);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onRevealCompleteRef.current?.();
      }, revealDurationMs);
    };
    replay();
    window.addEventListener("pageshow", replay);
    return () => {
      window.removeEventListener("pageshow", replay);
      if (timer) clearTimeout(timer);
    };
  }, [revealDurationMs]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#080a0d]" />

      <div key={animKey} className="absolute inset-0 perspective-[1100px]">
        {/* floor */}
        <div
          className="absolute origin-bottom"
          style={{
            left: floorSide,
            right: floorSide,
            bottom: floorBottom,
            height: floorHeight,
            transform: "rotateX(72deg)",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.72) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.66) 1px, transparent 1px)",
            backgroundSize: gridSize,
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.96) 62%, rgba(0,0,0,0.08) 100%)",
            opacity: mobileOptimized ? 0.8 : 0.86,
            animation: `lpv2FloorDraw ${revealDurationMs}ms cubic-bezier(0.18, 0.78, 0.2, 1) both`,
            willChange: "clip-path, opacity",
          }}
        />
        <div
          className="absolute origin-bottom"
          style={{
            left: floorSide,
            right: floorSide,
            bottom: floorBottom,
            height: floorHeight,
            transform: "rotateX(72deg)",
            background:
              "linear-gradient(180deg, rgba(140,214,255,0) 0%, rgba(140,214,255,0.12) 22%, rgba(120,226,255,0.62) 46%, rgba(140,214,255,0.18) 62%, rgba(140,214,255,0) 80%)",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.96) 62%, rgba(0,0,0,0.08) 100%)",
            mixBlendMode: "screen",
            animation: `lpv2FloorLight 7000ms linear infinite`,
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        />

        {/* ceiling */}
        <div
          className="absolute origin-top"
          style={{
            left: floorSide,
            right: floorSide,
            top: mobileOptimized ? "-16%" : "-20%",
            height: mobileOptimized ? "60%" : "62%",
            transform: "rotateX(-69deg)",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.58) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.54) 1px, transparent 1px)",
            backgroundSize: gridSize,
            maskImage:
              "linear-gradient(0deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.92) 58%, rgba(0,0,0,0.06) 100%)",
            opacity: mobileOptimized ? 0.68 : 0.74,
            animation: `lpv2CeilDraw ${revealDurationMs}ms cubic-bezier(0.18, 0.78, 0.2, 1) both`,
            willChange: "clip-path, opacity",
          }}
        />
        <div
          className="absolute origin-top"
          style={{
            left: floorSide,
            right: floorSide,
            top: mobileOptimized ? "-16%" : "-20%",
            height: mobileOptimized ? "60%" : "62%",
            transform: "rotateX(-69deg)",
            background:
              "linear-gradient(0deg, rgba(140,214,255,0) 0%, rgba(140,214,255,0.1) 22%, rgba(120,226,255,0.44) 46%, rgba(140,214,255,0.14) 62%, rgba(140,214,255,0) 80%)",
            maskImage:
              "linear-gradient(0deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.92) 58%, rgba(0,0,0,0.06) 100%)",
            mixBlendMode: "screen",
            animation: `lpv2CeilLight 7000ms linear infinite`,
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        />

        {/* left wall */}
        <div
          className="absolute origin-left"
          style={{
            left: wallSide,
            top: wallVertical,
            bottom: wallVertical,
            width: wallWidth,
            transform: `rotateY(${wallRotate}deg)`,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.58) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.54) 1px, transparent 1px)",
            backgroundSize: gridSize,
            maskImage:
              mobileOptimized
                ? "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.95) 58%, rgba(0,0,0,0.2) 100%)"
                : "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.94) 62%, rgba(0,0,0,0.08) 100%)",
            opacity: mobileOptimized ? 0.68 : 0.74,
            animation: `lpv2LeftWallDraw ${revealDurationMs}ms cubic-bezier(0.18, 0.78, 0.2, 1) both`,
            willChange: "clip-path, opacity",
          }}
        />
        <div
          className="absolute origin-left"
          style={{
            left: wallSide,
            top: wallVertical,
            bottom: wallVertical,
            width: wallWidth,
            transform: `rotateY(${wallRotate}deg)`,
            background:
              "linear-gradient(90deg, rgba(140,214,255,0) 0%, rgba(140,214,255,0.08) 24%, rgba(120,226,255,0.34) 46%, rgba(140,214,255,0.12) 62%, rgba(140,214,255,0) 78%)",
            maskImage:
              mobileOptimized
                ? "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.95) 58%, rgba(0,0,0,0.2) 100%)"
                : "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.94) 62%, rgba(0,0,0,0.08) 100%)",
            mixBlendMode: "screen",
            animation: `lpv2LeftLight 7000ms linear infinite`,
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        />

        {/* right wall */}
        <div
          className="absolute origin-right"
          style={{
            right: wallSide,
            top: wallVertical,
            bottom: wallVertical,
            width: wallWidth,
            transform: `rotateY(-${wallRotate}deg)`,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.58) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.54) 1px, transparent 1px)",
            backgroundSize: gridSize,
            maskImage:
              mobileOptimized
                ? "linear-gradient(270deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.95) 58%, rgba(0,0,0,0.2) 100%)"
                : "linear-gradient(270deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.94) 62%, rgba(0,0,0,0.08) 100%)",
            opacity: mobileOptimized ? 0.68 : 0.74,
            animation: `lpv2RightWallDraw ${revealDurationMs}ms cubic-bezier(0.18, 0.78, 0.2, 1) both`,
            willChange: "clip-path, opacity",
          }}
        />
        <div
          className="absolute origin-right"
          style={{
            right: wallSide,
            top: wallVertical,
            bottom: wallVertical,
            width: wallWidth,
            transform: `rotateY(-${wallRotate}deg)`,
            background:
              "linear-gradient(270deg, rgba(140,214,255,0) 0%, rgba(140,214,255,0.08) 24%, rgba(120,226,255,0.34) 46%, rgba(140,214,255,0.12) 62%, rgba(140,214,255,0) 78%)",
            maskImage:
              mobileOptimized
                ? "linear-gradient(270deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.95) 58%, rgba(0,0,0,0.2) 100%)"
                : "linear-gradient(270deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.94) 62%, rgba(0,0,0,0.08) 100%)",
            mixBlendMode: "screen",
            animation: `lpv2RightLight 7000ms linear infinite`,
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* tunnel center dark core */}
      <div
        className="absolute rounded-[14px] bg-black/20 blur-[0.5px]"
        style={{
          left: mobileOptimized ? "38%" : "24%",
          right: mobileOptimized ? "38%" : "24%",
          top: mobileOptimized ? "36%" : "26%",
          bottom: mobileOptimized ? "36%" : "26%",
          opacity: mobileOptimized ? 0.12 : 1,
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_36%,rgba(0,0,0,0.65)_100%)]" />
      <style jsx>{`
        @keyframes lpv2FloorDraw {
          0% {
            clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
            opacity: 0;
          }
          55% {
            opacity: 0.35;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }

        @keyframes lpv2CeilDraw {
          0% {
            clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
            opacity: 0;
          }
          55% {
            opacity: 0.32;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }

        @keyframes lpv2LeftWallDraw {
          0% {
            clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
            opacity: 0;
          }
          58% {
            opacity: 0.34;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }

        @keyframes lpv2RightWallDraw {
          0% {
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
            opacity: 0;
          }
          58% {
            opacity: 0.34;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }

        @keyframes lpv2FloorLight {
          0% {
            transform: rotateX(72deg) translateY(-62%);
            opacity: 0;
          }
          12% {
            opacity: 0.22;
          }
          58% {
            opacity: 0.62;
          }
          86% {
            transform: rotateX(72deg) translateY(42%);
            opacity: 0.92;
          }
          100% {
            transform: rotateX(72deg) translateY(58%);
            opacity: 0;
          }
        }

        @keyframes lpv2CeilLight {
          0% {
            transform: rotateX(-69deg) translateY(62%);
            opacity: 0;
          }
          12% {
            opacity: 0.18;
          }
          58% {
            opacity: 0.48;
          }
          86% {
            transform: rotateX(-69deg) translateY(-42%);
            opacity: 0.72;
          }
          100% {
            transform: rotateX(-69deg) translateY(-58%);
            opacity: 0;
          }
        }

        @keyframes lpv2LeftLight {
          0% {
            transform: rotateY(${wallRotate}deg) translateX(46%);
            opacity: 0;
          }
          14% {
            opacity: 0.16;
          }
          60% {
            opacity: 0.44;
          }
          88% {
            transform: rotateY(${wallRotate}deg) translateX(-36%);
            opacity: 0.68;
          }
          100% {
            transform: rotateY(${wallRotate}deg) translateX(-48%);
            opacity: 0;
          }
        }

        @keyframes lpv2RightLight {
          0% {
            transform: rotateY(-${wallRotate}deg) translateX(-46%);
            opacity: 0;
          }
          14% {
            opacity: 0.16;
          }
          60% {
            opacity: 0.44;
          }
          88% {
            transform: rotateY(-${wallRotate}deg) translateX(36%);
            opacity: 0.68;
          }
          100% {
            transform: rotateY(-${wallRotate}deg) translateX(48%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

