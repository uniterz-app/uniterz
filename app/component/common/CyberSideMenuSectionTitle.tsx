"use client";

import cn from "clsx";
import type { ReactNode } from "react";
import { nameOxanium } from "@/lib/fonts";
import { CYBER_TAB_CYAN } from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  children: ReactNode;
  className?: string;
  /** 先頭セクション（上マージンなし） */
  first?: boolean;
};

/** サイドメニュー内セクション見出し（HUD ラベル + シアンアクセント） */
export function CyberSideMenuSectionTitle({
  children,
  className,
  first = false,
}: Props) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2",
        first ? "mt-0" : "mt-4",
        className
      )}
    >
      <span
        aria-hidden
        className="h-px w-3 shrink-0"
        style={{ background: CYBER_TAB_CYAN, boxShadow: `0 0 6px ${CYBER_TAB_CYAN}88` }}
      />
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rotate-45 border border-cyan-400/60"
        style={{ boxShadow: `0 0 6px ${CYBER_TAB_CYAN}55` }}
      />
      <p
        className={cn(
          nameOxanium.className,
          "min-w-0 text-[10px] font-bold uppercase tracking-[0.24em] text-white/42"
        )}
      >
        {children}
      </p>
      <span
        aria-hidden
        className="h-px min-w-0 flex-1 bg-linear-to-r from-cyan-400/25 to-transparent"
      />
    </div>
  );
}
