"use client";

import { nameOxanium } from "@/lib/fonts";

type Props = {
  /** 開いている／押下中 */
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** 予想入力の採点ルールはてな。四角枠 + ? */
export default function CyberHelpMark({
  active = false,
  size = "sm",
  className = "",
}: Props) {
  return (
    <span
      aria-hidden
      className={[
        nameOxanium.className,
        "inline-flex shrink-0 items-center justify-center border font-extrabold leading-none",
        size === "md" ? "h-8 w-8 text-[13px]" : "h-7 w-7 text-[12px]",
        active
          ? "border-cyan-300/60 bg-cyan-500/16 text-cyan-50"
          : "border-cyan-400/45 bg-cyan-500/10 text-cyan-100/95",
        className,
      ].join(" ")}
    >
      ?
    </span>
  );
}
