"use client";

import { nameBebas, nameOxanium } from "@/lib/fonts";

type Props = {
  /** 例: SEASON STANDINGS / SEASON AWARDS */
  title: string;
  season: string;
  accent?: "cyan" | "amber";
};

/**
 * スクショ拡散用 — UNITERZ を画面上の明確なブランド信号にする
 */
export function SeasonPicksBrandHeader({
  title,
  season,
  accent = "cyan",
}: Props) {
  const titleColor =
    accent === "amber" ? "text-amber-100/90" : "text-cyan-100/90";

  return (
    <header className="mb-4 flex flex-col items-center text-center">
      <p
        className={[
          nameBebas.className,
          "text-[28px] leading-none tracking-[0.28em] text-[#9fb4ff]",
        ].join(" ")}
      >
        UNITERZ
      </p>
      <div
        className={[
          "mt-2.5 h-px w-[min(200px,70%)] bg-gradient-to-r from-transparent to-transparent shadow-[0_0_12px_rgba(34,211,238,0.45)]",
          accent === "amber" ? "via-amber-300/80" : "via-cyan-300/85",
        ].join(" ")}
        aria-hidden
      />
      <p
        className={[
          nameOxanium.className,
          "mt-3 text-[11px] font-extrabold uppercase tracking-[0.18em]",
          titleColor,
        ].join(" ")}
      >
        {title}
      </p>
      <p
        className={[
          nameOxanium.className,
          "mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40",
        ].join(" ")}
      >
        {season}
      </p>
    </header>
  );
}

export function SeasonPicksBrandFooter() {
  return (
    <footer className="mt-4 flex flex-col items-center gap-1.5 border-t border-white/8 pt-3">
      <p
        className={[
          nameBebas.className,
          "text-[16px] leading-none tracking-[0.24em] text-[#9fb4ff]/90",
        ].join(" ")}
      >
        UNITERZ
      </p>
      <p
        className={[
          nameOxanium.className,
          "text-[8px] font-bold uppercase tracking-[0.16em] text-white/28",
        ].join(" ")}
      >
        Season prediction
      </p>
    </footer>
  );
}
