// app/component/profile/ui/summary/SummaryCardShell.tsx
"use client";

import React from "react";

import { summaryCardShellShadowClass } from "@/lib/ui/profileCardEdgeGlow";

type Props = {
  children: React.ReactNode;
  className?: string;

  /** compact時の余白を親から制御したい場合 */
  compact?: boolean;

  /** クリックさせたいカード用（任意） */
  onClick?: () => void;
};

export default function SummaryCardShell({
  children,
  className = "",
  compact = false,
  onClick,
}: Props) {
  const pad = compact ? "p-3" : "p-4";
  const base = [
    "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
    summaryCardShellShadowClass,
  ].join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${pad} text-left w-full active:scale-[0.99] transition ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${base} ${pad} ${className}`}>{children}</div>;
}