"use client";

import TrendPanel from "@/app/component/games/TrendPanel";

/**
 * トレンドページ（モバイル）
 * - ヘッダー：中央ロゴのみ（高さ h-11）
 * - TrendPanel のロジックや挙動は一切変更しない
 */
export default function MobileTrendPage() {
  return (
    <div className="min-h-[100svh] text-white bg-[var(--color-app-bg,#0b2126)] pt-2">
      {/* ▼ 共通ヘッダー（ロゴのみ） */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-app-bg,#0b2126)]/85 backdrop-blur-md">
        <div className="relative h-11 flex items-center justify-center px-3 md:px-8">
          {/* 中央ロゴ */}
          <img
            src="/logo/logo.png"
            alt="Uniterz Logo"
            className="w-10 h-auto select-none"
          />
        </div>
      </header>

      {/* ▼ 本文 */}
      <main className="p-3">
        <TrendPanel />
      </main>
    </div>
  );
}

