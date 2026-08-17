"use client";

/** サイドメニューパネル内装飾 — サイバー HUD（四隅ブラケットなし） */
export function CyberSideMenuFrame() {
  return (
    <>
      {/* 左上・右下のシアン残光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_46%_at_12%_0%,rgba(0,245,255,0.18),transparent_60%),radial-gradient(60%_40%_at_100%_100%,rgba(0,245,255,0.1),transparent_60%)]"
      />

      {/* 微細ノイズ */}
      <div
        aria-hidden
        className="cyber-side-menu-deep-noise pointer-events-none absolute inset-0"
      />

      {/* 走査線 */}
      <div
        aria-hidden
        className="cyber-side-menu-scanlines pointer-events-none absolute inset-0 opacity-55"
      />
    </>
  );
}
