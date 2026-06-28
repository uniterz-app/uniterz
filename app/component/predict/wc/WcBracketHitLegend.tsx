import type { Language } from "@/lib/i18n/language";

type Props = {
  language: Language;
  className?: string;
  compact?: boolean;
};

function Swatch({
  border,
  glow,
  compact,
}: {
  border: string;
  glow: string;
  compact?: boolean;
}) {
  const size = compact ? 14 : 18;
  return (
    <span
      className="inline-block shrink-0 rounded-[3px] border"
      style={{
        width: size,
        height: size,
        borderColor: border,
        boxShadow: `0 0 6px ${glow}`,
        background: "rgba(8,12,20,0.9)",
      }}
    />
  );
}

/** WC サバイバー — hit / miss / 予想勝者の凡例 */
export default function WcBracketHitLegend({
  language,
  className = "",
  compact = false,
}: Props) {
  const isJa = language === "ja";
  const textClass = compact
    ? "text-[9px] tracking-[0.12em]"
    : "text-[10px] tracking-[0.14em]";

  return (
    <div
      className={[
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-2 py-2",
        textClass,
        "font-semibold text-white/55",
        className,
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1.5">
        <Swatch
          border="rgba(34,211,238,0.95)"
          glow="rgba(34,211,238,0.4)"
          compact={compact}
        />
        {isJa ? "的中" : "Hit"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch
          border="rgba(248,113,113,0.55)"
          glow="rgba(248,113,113,0.25)"
          compact={compact}
        />
        {isJa ? "外れ" : "Miss"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch
          border="rgba(251,146,60,0.85)"
          glow="rgba(251,146,60,0.3)"
          compact={compact}
        />
        {isJa ? "予想勝者" : "Pick"}
      </span>
    </div>
  );
}
