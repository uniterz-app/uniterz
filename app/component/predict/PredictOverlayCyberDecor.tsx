"use client";

const CORNER = "pointer-events-none absolute z-[3] border-cyan-400/55";

/** 予想オーバーレイ MatchCard 内の角ブラケット・トップビーム */
export default function PredictOverlayCyberDecor() {
  return (
    <>
      <span className={`${CORNER} left-2 top-2 h-3 w-3 border-l-2 border-t-2`} aria-hidden />
      <span
        className={`${CORNER} bottom-2 left-2 h-3 w-3 border-b-2 border-l-2`}
        aria-hidden
      />
      <span
        className={`${CORNER} bottom-2 right-2 h-3 w-3 border-b-2 border-r-2`}
        aria-hidden
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 z-[3] h-px bg-linear-to-r from-transparent via-cyan-400/55 to-transparent"
        style={{ boxShadow: "0 0 10px rgba(0,245,255,0.35)" }}
      />
    </>
  );
}
