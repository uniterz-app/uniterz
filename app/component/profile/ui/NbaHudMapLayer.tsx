"use client";

import { useId } from "react";
import type { ExtendedFeature } from "d3-geo";
import { postalFromUsAtlasFips } from "@/lib/nba/usStateFipsToPostal";

/** react-simple-maps が path / rsmKey を付与した州フィーチャ */
export type NbaHudGeography = ExtendedFeature & {
  rsmKey: string;
  svgPath: string;
};

/**
 * HUD / サイバー風：暗背景・細ドット・座標グリッド・縦の光条、州はネオン境界のみ（塗り無し）。
 */
export function NbaHudMapLayer({
  geographies,
  width,
  height,
  stateAllow,
  narrowViewport,
}: {
  geographies: NbaHudGeography[];
  width: number;
  height: number;
  stateAllow: Set<string> | null;
  narrowViewport: boolean;
}) {
  const rid = useId().replace(/:/g, "");
  const gradBg = `nbaCyberSea-${rid}`;
  const patDots = `nbaCyberDots-${rid}`;
  const streak = `nbaCyberStreak-${rid}`;

  const baseStrokeW = narrowViewport ? 0.65 : 0.55;
  const divisionFocus = stateAllow != null;
  const gridMajor = 52;
  const vM = Math.ceil(width / gridMajor) + 1;
  const hM = Math.ceil(height / gridMajor) + 1;

  return (
    <>
      <defs>
        <linearGradient id={gradBg} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00040a" />
          <stop offset="45%" stopColor="#020814" />
          <stop offset="100%" stopColor="#00050c" />
        </linearGradient>
        <pattern
          id={patDots}
          width={3}
          height={3}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1.5} cy={1.5} r={0.32} fill="rgba(0, 210, 255, 0.1)" />
        </pattern>
        <linearGradient id={streak} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 240, 255, 0)" />
          <stop offset="50%" stopColor="rgba(0, 230, 255, 0.07)" />
          <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#${gradBg})`} />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#${patDots})`}
        opacity={0.85}
      />

      {[0.12, 0.32, 0.55, 0.78].map((fx, i) => (
        <rect
          key={`st-${i}`}
          x={width * fx - 22}
          y={0}
          width={44}
          height={height}
          fill={`url(#${streak})`}
          opacity={0.45}
        />
      ))}

      <g
        className="pointer-events-none"
        stroke="rgba(0, 220, 255, 0.09)"
        strokeWidth={0.4}
      >
        {Array.from({ length: vM }, (_, i) => (
          <line
            key={`vg-${i}`}
            x1={i * gridMajor}
            y1={0}
            x2={i * gridMajor}
            y2={height}
          />
        ))}
        {Array.from({ length: hM }, (_, i) => (
          <line
            key={`hg-${i}`}
            x1={0}
            y1={i * gridMajor}
            x2={width}
            y2={i * gridMajor}
          />
        ))}
      </g>

      <g className="pointer-events-none" fill="none">
        {Array.from({ length: vM * hM }, (_, k) => {
          const i = Math.floor(k / hM);
          const j = k % hM;
          const x = i * gridMajor;
          const y = j * gridMajor;
          return (
            <path
              key={`xh-${i}-${j}`}
              d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`}
              stroke="rgba(0, 240, 255, 0.2)"
              strokeWidth={0.45}
            />
          );
        })}
      </g>

      <g className="pointer-events-none">
        {geographies.map((geo) => {
          const fips = String(geo.id ?? "");
          const postal = postalFromUsAtlasFips(fips);
          const inDivision =
            stateAllow == null || (postal != null && stateAllow.has(postal));

          const stroke = !postal
            ? "rgba(75, 95, 120, 0.42)"
            : inDivision
              ? divisionFocus
                ? "#4ecbff"
                : "#5dfff5"
              : "rgba(55, 72, 92, 0.55)";

          /** DC は面積が極小でディビジョン強調が見えにくいため線を太めに */
          const divisionStrokeMul =
            divisionFocus && inDivision && postal === "DC" ? 2.35 : 1.45;

          const strokeWidth = !postal
            ? baseStrokeW
            : divisionFocus && inDivision
              ? baseStrokeW * divisionStrokeMul
              : divisionFocus && !inDivision
                ? baseStrokeW * 0.82
                : baseStrokeW;

          return (
            <path
              key={geo.rsmKey}
              d={geo.svgPath}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                filter: inDivision
                  ? divisionFocus
                    ? postal === "DC"
                      ? "drop-shadow(0 0 10px rgba(78, 203, 255, 0.95))"
                      : "drop-shadow(0 0 6px rgba(78, 203, 255, 0.75))"
                    : "drop-shadow(0 0 4px rgba(0, 255, 250, 0.55))"
                  : divisionFocus
                    ? "none"
                    : "drop-shadow(0 0 2px rgba(0, 220, 255, 0.25))",
              }}
            />
          );
        })}
      </g>
    </>
  );
}
