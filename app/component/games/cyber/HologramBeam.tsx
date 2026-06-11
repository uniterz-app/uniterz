"use client";

type HologramBeamProps = {
  accentColor: string;
  pedestalWidth: number;
  top: number;
  bottom: number;
};

/**
 * 下リング起点のホログラム光。矩形マスクなし・楕円グラデーションのみで減衰。
 */
export default function HologramBeam({
  accentColor,
  pedestalWidth,
  top,
  bottom,
}: HologramBeamProps) {
  const baseStyle = {
    top: top + 4,
    bottom: bottom + 2,
    transform: "translateX(-50%) translateZ(8px)",
  } as const;

  return (
    <>
      {/* 外側散乱（最も広く薄い） */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 rounded-full blur-[12px]"
        style={{
          ...baseStyle,
          width: pedestalWidth * 0.78,
          background: `radial-gradient(ellipse 50% 100% at 50% 100%, ${accentColor}14 0%, rgba(34,211,238,0.08) 42%, transparent 74%)`,
        }}
        aria-hidden
      />

      {/* シアン層 */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 rounded-full blur-[6px]"
        style={{
          ...baseStyle,
          width: pedestalWidth * 0.58,
          background: `radial-gradient(ellipse 48% 100% at 50% 100%, rgba(34,211,238,0.28) 0%, rgba(34,211,238,0.1) 38%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
        aria-hidden
      />

      {/* チーム色層 */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 rounded-full blur-[4px]"
        style={{
          ...baseStyle,
          width: pedestalWidth * 0.48,
          background: `radial-gradient(ellipse 46% 100% at 50% 100%, ${accentColor}44 0%, ${accentColor}18 36%, transparent 68%)`,
          mixBlendMode: "screen",
        }}
        aria-hidden
      />

      {/* 白芯 */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 rounded-full blur-[2px]"
        style={{
          ...baseStyle,
          width: pedestalWidth * 0.32,
          background: `radial-gradient(ellipse 42% 88% at 50% 100%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.16) 28%, transparent 62%)`,
          mixBlendMode: "screen",
        }}
        aria-hidden
      />
    </>
  );
}
