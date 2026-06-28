"use client";

import { MATCH_LIST_CYBER_CTA_CLASS } from "@/lib/ui/matchListCardCyber";

type Props = {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
};

/** WC ブラケット提出 — ゲームページの「予想をする」CTA と同デザイン */
export default function WcBracketSubmitButton({
  disabled = false,
  onClick,
  className = "",
  label = "提出する",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "grid w-full place-items-center font-bold text-white",
        "h-12 text-[15px] px-2 transition-all duration-200",
        "active:scale-[0.985]",
        MATCH_LIST_CYBER_CTA_CLASS,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
