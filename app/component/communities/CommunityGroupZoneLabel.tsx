"use client";

import { communityCrtMono } from "./CommunityCrtTheme";

/** TITLE / MEMO / RANKING 等のゾーン見出し — Native `CommunityGroupZoneLabelNative` 相当 */
export default function CommunityGroupZoneLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-[5px] w-[5px] shrink-0 rotate-45 bg-[#00F5FF]/85 shadow-[0_0_6px_rgba(0,245,255,0.9)]"
        aria-hidden
      />
      <span
        className={[
          "shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-200/58",
          communityCrtMono.className,
        ].join(" ")}
      >
        {children}
      </span>
      <span
        className="h-px min-w-0 flex-1 bg-gradient-to-r from-[#00F5FF]/60 via-[#00F5FF]/24 to-transparent shadow-[0_0_8px_rgba(0,245,255,0.65),0_0_18px_rgba(0,245,255,0.28)]"
        aria-hidden
      />
    </div>
  );
}
