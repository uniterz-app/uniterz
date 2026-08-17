/** 左上・右下の離角ゴールドブラケット — PRO バッジ / My Rank Pro 枠で共有 */
export function ProCornerBracketFrame({
  className,
  idPrefix,
  strokeWidth = 0.95,
  vectorEffect,
}: {
  className?: string;
  idPrefix: string;
  strokeWidth?: number;
  vectorEffect?: "non-scaling-stroke";
}) {
  const gold = `${idPrefix}-bracket-gold`;

  return (
    <svg
      className={className}
      viewBox="0 0 62 18"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff4d4" />
          <stop offset="22%" stopColor="#e8c66a" />
          <stop offset="55%" stopColor="#c89a3a" />
          <stop offset="82%" stopColor="#f0cc72" />
          <stop offset="100%" stopColor="#8f6820" />
        </linearGradient>
      </defs>
      <path
        d="M 46 0.5 L 1 0.5 L 1 12.5"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={strokeWidth}
        vectorEffect={vectorEffect}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M 16 17.5 L 61 17.5 L 61 5.5"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={strokeWidth}
        vectorEffect={vectorEffect}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
