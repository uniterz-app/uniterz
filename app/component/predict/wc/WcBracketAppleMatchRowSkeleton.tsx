"use client";

type Props = {
  compact?: boolean;
};

function TeamRowSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={[
        "wc-bracket-match-row",
        compact ? "wc-bracket-match-row--compact" : "",
      ].join(" ")}
    >
      <span className="wc-bracket-match-row__bar-spacer" aria-hidden />
      <span
        className={[
          "wc-bracket-match-row__qual skeleton-scan rounded-sm bg-white/10",
          compact ? "h-3" : "h-3.5",
        ].join(" ")}
        aria-hidden
      />
      <span
        className={[
          "wc-bracket-match-row__flag-placeholder skeleton-scan bg-white/10",
          compact ? "wc-bracket-match-row__flag-placeholder--compact" : "",
        ].join(" ")}
        aria-hidden
      />
      <span
        className={[
          "wc-bracket-match-row__name skeleton-scan rounded-sm bg-white/10",
          compact ? "h-3 max-w-[68%]" : "h-3.5 max-w-[72%]",
        ].join(" ")}
        aria-hidden
      />
    </div>
  );
}

/** `WcBracketAppleMatchRow` compact 相当のプレースホルダ */
export default function WcBracketAppleMatchRowSkeleton({ compact = false }: Props) {
  return (
    <div className="wc-bracket-match-card" aria-hidden>
      <TeamRowSkeleton compact={compact} />
      <div className="wc-bracket-match-card__divider" aria-hidden />
      <TeamRowSkeleton compact={compact} />
    </div>
  );
}
