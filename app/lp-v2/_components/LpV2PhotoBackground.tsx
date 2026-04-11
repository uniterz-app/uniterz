"use client";

const LP_V2_BG = "/lp-v2/Firefly.png";

/** Firefly hero image; letterbox shows main background. */
export default function LpV2PhotoBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-1 overflow-hidden bg-transparent"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static LP hero; avoid next/image fill quirks */}
      <img
        src={LP_V2_BG}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 box-border h-full w-full object-contain object-[50%_4%] md:object-top"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,20,0.45)_0%,rgba(4,10,20,0.28)_40%,rgba(4,10,20,0.42)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.38)_100%)]" />
    </div>
  );
}
