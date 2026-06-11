"use client";

/**
 * Web ランキング:
 * - 背景はルートの AppPageBackground（GamesPageBackground）に任せる
 * - 長いリストは内側のラッパーだけがスクロールする
 */
export default function WebRankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      <div
        data-web-rankings-scroll
        className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
}
