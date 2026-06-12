"use client";

import cn from "clsx";
import {
  CYBER_SIDE_MENU_GRID_CLASS,
  CYBER_SIDE_MENU_INNER_CLIP,
} from "@/lib/ui/cyberSideMenu";

const CORNER = "pointer-events-none absolute z-[2] border-cyan-300/70";

/** サイドメニューパネル内のサイバー装飾（角ブラケット・走査・グリッド） */
export function CyberSideMenuFrame() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8px] border border-cyan-400/10 opacity-95"
        style={{ clipPath: CYBER_SIDE_MENU_INNER_CLIP }}
      />

      <div className={`${CORNER} left-2 top-2 h-3 w-3 border-l-2 border-t-2`} aria-hidden />
      <div className={`${CORNER} right-2 top-2 h-3 w-3 border-r-2 border-t-2`} aria-hidden />
      <div className={`${CORNER} bottom-2 left-2 h-3 w-3 border-b-2 border-l-2`} aria-hidden />
      <div className={`${CORNER} bottom-2 right-2 h-3 w-3 border-b-2 border-r-2`} aria-hidden />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1 top-7 h-12 w-px bg-cyan-400/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1 bottom-7 h-12 w-px bg-cyan-400/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1 top-7 h-12 w-px bg-cyan-400/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1 bottom-7 h-12 w-px bg-cyan-400/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1 left-9 h-px w-12 bg-cyan-400/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-9 top-1 h-px w-12 bg-cyan-400/40"
      />

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-90",
          CYBER_SIDE_MENU_GRID_CLASS
        )}
      />
      <div
        aria-hidden
        className="cyber-side-menu-scanlines pointer-events-none absolute inset-0 opacity-70"
      />

      <div
        aria-hidden
        className="cyber-side-menu-edge-h pointer-events-none absolute inset-x-0 inset-y-0 overflow-hidden"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-cyan-400/[0.08] to-transparent"
      />
      <div
        aria-hidden
        className="cyber-side-menu-top-beam pointer-events-none absolute inset-x-6 top-0 h-px"
      />
    </>
  );
}
