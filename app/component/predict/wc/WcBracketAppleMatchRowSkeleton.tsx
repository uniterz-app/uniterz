"use client";

import {
  WC_BRACKET_MATCH_CARD_CLASS,
  WC_BRACKET_MATCH_CARD_DIVIDER_CLASS,
  WC_BRACKET_MATCH_ROW_BAR_SPACER_CLASS,
  wcBracketMatchRowClass,
  wcBracketMatchRowFlagPlaceholderClass,
  wcBracketMatchRowNameClass,
  wcBracketMatchRowQualClass,
} from "@/app/component/predict/wc/wcBracketMatchRowClasses";

type Props = {
  compact?: boolean;
};

function TeamRowSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={wcBracketMatchRowClass({ compact })}>
      <span className={WC_BRACKET_MATCH_ROW_BAR_SPACER_CLASS} aria-hidden />
      <span
        className={[
          wcBracketMatchRowQualClass(compact),
          "skeleton-scan rounded-sm bg-white/10",
          compact ? "h-3" : "h-3.5",
        ].join(" ")}
        aria-hidden
      />
      <span
        className={[
          wcBracketMatchRowFlagPlaceholderClass(compact),
          "skeleton-scan bg-white/10",
        ].join(" ")}
        aria-hidden
      />
      <span
        className={[
          wcBracketMatchRowNameClass({ compact }),
          "skeleton-scan rounded-sm bg-white/10",
          compact ? "h-3 max-w-[68%]" : "h-3.5 max-w-[72%]",
        ].join(" ")}
        aria-hidden
      />
    </div>
  );
}

/** `WcBracketAppleMatchRow` compact 相当のプレースホルダ */
export default function WcBracketAppleMatchRowSkeleton({
  compact = false,
}: Props) {
  return (
    <div className={WC_BRACKET_MATCH_CARD_CLASS} aria-hidden>
      <TeamRowSkeleton compact={compact} />
      <div className={WC_BRACKET_MATCH_CARD_DIVIDER_CLASS} aria-hidden />
      <TeamRowSkeleton compact={compact} />
    </div>
  );
}
