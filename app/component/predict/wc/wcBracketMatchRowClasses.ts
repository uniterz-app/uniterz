/** ブラケット入力カード — globals.css 未読込でも崩れない Tailwind 構造 */

import { nameBebas } from "@/lib/fonts";

export const WC_BRACKET_MATCH_CARD_CLASS =
  "wc-bracket-match-card min-w-0 overflow-hidden border border-white/[0.06] bg-[#06080c]";

export const WC_BRACKET_MATCH_CARD_DIVIDER_CLASS =
  "wc-bracket-match-card__divider h-px shrink-0 bg-white/[0.06]";

export function wcBracketMatchRowClass(options: {
  compact?: boolean;
  selected?: boolean;
  pickable?: boolean;
}): string {
  const { compact, selected, pickable } = options;
  return [
    "wc-bracket-match-row",
    "relative flex min-w-0 w-full items-center gap-1 border-0 bg-transparent text-left transition-[background,color] duration-150",
    compact
      ? "wc-bracket-match-row--compact py-3.5 pr-3.5 pl-0"
      : "py-4 pr-[18px] pl-0",
    selected
      ? "wc-bracket-match-row--selected bg-[rgba(57,255,126,0.055)]"
      : "",
    pickable
      ? "wc-bracket-match-row--pickable cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.05]"
      : "wc-bracket-match-row--dim opacity-[0.42]",
  ]
    .filter(Boolean)
    .join(" ");
}

export const WC_BRACKET_MATCH_ROW_BAR_CLASS =
  "wc-bracket-match-row__bar shrink-0 self-stretch w-[5px] bg-[#39ff7e] shadow-[0_0_8px_rgba(57,255,126,0.75),0_0_16px_rgba(57,255,126,0.28)]";

export const WC_BRACKET_MATCH_ROW_BAR_SPACER_CLASS =
  "wc-bracket-match-row__bar-spacer shrink-0 self-stretch w-[5px]";

export function wcBracketMatchRowQualClass(compact?: boolean): string {
  return [
    "wc-bracket-match-row__qual shrink-0 pl-0 text-left font-mono font-semibold tracking-wide text-white/35",
    compact ? "w-[22px] text-[11px]" : "w-6 text-xs",
  ].join(" ");
}

export function wcBracketMatchRowFlagClass(compact?: boolean): string {
  return [
    "wc-bracket-match-row__flag shrink-0 overflow-hidden rounded-[2px]",
    compact ? "wc-bracket-match-row__flag--compact h-[22px] w-[30px]" : "h-[25px] w-[34px]",
  ].join(" ");
}

export function wcBracketMatchRowFlagPlaceholderClass(compact?: boolean): string {
  return [
    "wc-bracket-match-row__flag-placeholder flex shrink-0 items-center justify-center rounded-[2px] border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-bold text-white/40",
    compact
      ? "wc-bracket-match-row__flag-placeholder--compact h-[22px] w-[30px]"
      : "h-[25px] w-[34px]",
  ].join(" ");
}

export function wcBracketMatchRowNameClass(options: {
  compact?: boolean;
  selected?: boolean;
}): string {
  const { compact, selected } = options;
  return [
    "wc-bracket-match-row__name min-w-0 flex-1 truncate pl-1.5 font-normal uppercase text-white/90",
    nameBebas.className,
    compact ? "text-[15px] tracking-[0.08em]" : "text-[17px] tracking-[0.08em]",
    selected
      ? "text-[#39ff7e] shadow-[0_0_10px_rgba(57,255,126,0.28)]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
