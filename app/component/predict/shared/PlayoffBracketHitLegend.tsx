import type { Language } from "@/lib/i18n/language";

type Props = {
  language: Language;
  className?: string;
  /** モバイルブラケット向け：文字・アイコンを一段小さく */
  compact?: boolean;
};

type LegendHit = "winner" | "winnerAndGames";

function hitStyle(hitStatus: LegendHit) {
  if (hitStatus === "winnerAndGames") {
    return {
      color: "#36e6ff",
      border: "rgba(54, 230, 255, 0.95)",
      glow: "rgba(54, 230, 255, 0.58)",
      soft: "rgba(54, 230, 255, 0.18)",
    };
  }
  return {
    color: "#ff9f2f",
    border: "rgba(255, 159, 47, 0.95)",
    glow: "rgba(255, 159, 47, 0.52)",
    soft: "rgba(255, 159, 47, 0.16)",
  };
}

function LegendCheck({
  hitStatus,
  compact,
}: {
  hitStatus: LegendHit;
  compact?: boolean;
}) {
  const hit = hitStyle(hitStatus);
  const box = compact ? 15 : 20;
  const svg = compact ? 9 : 12;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border"
      style={{
        width: box,
        height: box,
        borderColor: hit.border,
        background: "rgba(6, 12, 24, 0.94)",
        boxShadow: compact
          ? `inset 0 0 3px ${hit.soft}, 0 0 4px ${hit.glow}`
          : `
          inset 0 0 5px ${hit.soft},
          0 0 6px ${hit.glow}
        `,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={svg}
        height={svg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12.5L9.2 16.5L19 7.5"
          stroke={hit.color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: compact
              ? `drop-shadow(0 0 2px ${hit.glow})`
              : `drop-shadow(0 0 4px ${hit.glow})`,
          }}
        />
      </svg>
    </div>
  );
}

/** カード右上の的中マークと同じ見た目の凡例（2種） */
export default function PlayoffBracketHitLegend({
  language,
  className = "",
  compact = false,
}: Props) {
  const row = compact
    ? "flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] leading-tight text-white/60"
    : "flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/70 sm:text-xs";

  const gap = compact ? "gap-1.5" : "gap-2";

  if (language === "en") {
    return (
      <div className={`${row} ${className}`}>
        <span className={`flex items-center ${gap}`}>
          <LegendCheck hitStatus="winner" compact={compact} />
          <span>Winner correct</span>
        </span>
        <span className={`flex items-center ${gap}`}>
          <LegendCheck hitStatus="winnerAndGames" compact={compact} />
          <span>Winner + games</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`${row} ${className}`}>
      <span className={`flex items-center ${gap}`}>
        <LegendCheck hitStatus="winner" compact={compact} />
        <span>{compact ? "勝者のみ" : "勝者のみ的中"}</span>
      </span>
      <span className={`flex items-center ${gap}`}>
        <LegendCheck hitStatus="winnerAndGames" compact={compact} />
        <span>{compact ? "勝者＋試合数" : "勝者＋試合数的中"}</span>
      </span>
    </div>
  );
}
