"use client";

import Link from "next/link";

const ITEMS = [
  { href: "#top", label: "トップ" },
  { href: "#features", label: "流れ" },
  { href: "#plans", label: "プラン" },
  { href: "#media-slots", label: "実績" },
  { href: "#signup", label: "登録" },
] as const;

/**
 * モバイルLP専用：縦長スクロールの区切りとジャンプ導線（lg 以上は非表示）
 */
export default function MobileLPQuickNav() {
  return (
    <nav
      aria-label="セクションへ移動"
      className="sticky top-[72px] z-40 border-b border-cyan-300/10 bg-[rgba(3,8,16,0.82)] backdrop-blur-xl lg:hidden"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2.5 scrollbar-none">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-semibold tracking-tight text-white/82 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.08] hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
