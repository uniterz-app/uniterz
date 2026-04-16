"use client";

type Props = {
  delta?: number | null;
};

export function RankDeltaBadge({ delta }: Props) {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
    return null;
  }

  const up = delta > 0;
  const amount = Math.abs(Math.trunc(delta));
  const text = `${up ? "↗" : "↘"}${amount}`;

  return (
    <span
      className={[
        "inline-flex items-center text-[10px] font-bold leading-none",
        up
          ? "text-yellow-300"
          : "text-white/60",
      ].join(" ")}
      aria-label={up ? `Rank up ${text}` : `Rank down ${text}`}
      title={up ? `Rank up ${text}` : `Rank down ${text}`}
    >
      {text}
    </span>
  );
}
