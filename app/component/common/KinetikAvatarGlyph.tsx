"use client";

const GLYPH_ACCENT = "#ccff00";
const GLYPH_FILL = "rgba(204, 255, 0, 0.12)";
const GLYPH_GLOW = "rgba(204, 255, 0, 0.36)";

type Props = {
  /** SVG box size relative to parent (e.g. "62%", 28) */
  size?: string | number;
  className?: string;
  /** profile kinetik card uses global CSS classes on the wrapper */
  variant?: "inline" | "kinetik";
};

export function KinetikAvatarGlyph({
  size = "62%",
  className,
  variant = "inline",
}: Props) {
  const svg = (
    <svg viewBox="0 0 40 40" aria-hidden>
      <polygon
        points="20,9 31.5,29 8.5,29"
        fill={variant === "kinetik" ? undefined : GLYPH_FILL}
        stroke={variant === "kinetik" ? undefined : GLYPH_ACCENT}
        strokeWidth="1.35"
        className={
          variant === "kinetik" ? "profile-edit-kinetik-avatar__glyph-shape" : undefined
        }
      />
      <circle
        cx="20"
        cy="21.5"
        r="2.8"
        fill={variant === "kinetik" ? undefined : GLYPH_ACCENT}
        className={
          variant === "kinetik" ? "profile-edit-kinetik-avatar__glyph-dot" : undefined
        }
      />
    </svg>
  );

  if (variant === "kinetik") {
    return (
      <div
        className={["profile-edit-kinetik-avatar__glyph", className]
          .filter(Boolean)
          .join(" ")}
      >
        {svg}
      </div>
    );
  }

  return (
    <div
      className={["grid h-full w-full place-items-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 0 4px ${GLYPH_GLOW})`,
        }}
      >
        {svg}
      </div>
    </div>
  );
}
