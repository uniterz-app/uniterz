"use client";

/** 案C — 水平ビーム + 大気 + 後方ヴィネット（MyRankCard 背面発光） */
export function MyRankCardBacklight() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[145%] w-[178%] -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 48%, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "240px 240px",
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="absolute left-1/2 top-[44%] h-[104px] w-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.12) 15%, rgba(34,211,238,0.55) 46%, rgba(186,230,253,0.72) 50%, rgba(34,211,238,0.55) 54%, rgba(34,211,238,0.12) 85%, transparent 100%)",
          filter: "blur(26px)",
        }}
      />
      <div
        className="absolute left-0 right-0 top-[44%] h-px -translate-y-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.65) 50%, transparent)",
          boxShadow:
            "0 0 24px rgba(34,211,238,0.75), 0 0 48px rgba(34,211,238,0.35)",
        }}
      />
      <div
        className="absolute left-1/2 top-[44%] size-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[48px]"
        style={{ background: "rgba(34,211,238,0.28)" }}
      />
    </div>
  );
}

/** clip-path カード向け — シアン + マゼンタのリムライト */
export const MY_RANK_CARD_RIM_FILTER = [
  "drop-shadow(0 0 10px rgba(236,72,153,0.38))",
  "drop-shadow(0 0 22px rgba(34,211,238,0.32))",
  "drop-shadow(0 14px 26px rgba(0,0,0,0.42))",
].join(" ");
