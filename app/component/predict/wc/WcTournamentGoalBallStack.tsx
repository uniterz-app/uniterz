"use client";

type Props = {
  count: number;
  /** compact = 得点者ピッカー行内 */
  size?: "compact" | "default";
  className?: string;
};

/** 大会累計ゴール数 — サッカーボール */
export default function WcTournamentGoalBallStack({
  count,
  size = "compact",
  className = "",
}: Props) {
  if (count <= 0) return null;

  const ballClass =
    size === "compact"
      ? "text-[11px] leading-none"
      : "text-[13px] leading-none";
  const gapClass = size === "compact" ? "gap-0.5" : "gap-1";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center",
        gapClass,
        className,
      ].join(" ")}
      aria-label={`${count} tournament goals`}
      title={`${count} tournament goals`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={ballClass} aria-hidden>
          ⚽
        </span>
      ))}
    </span>
  );
}
