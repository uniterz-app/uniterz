"use client";

/** 試合一覧 MatchCard 内のトップビーム */
export default function MatchListCyberDecor() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-4 top-0 z-[2] h-px bg-linear-to-r from-transparent via-cyan-400/40 to-transparent"
    />
  );
}
