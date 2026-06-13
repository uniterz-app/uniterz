"use client";

const CORNER = "pointer-events-none absolute z-[2] border-cyan-400/45";

/** 試合一覧 MatchCard 内の角ブラケット・トップビーム */
export default function MatchListCyberDecor() {
  return (
    <>
      <span className={`${CORNER} left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t`} aria-hidden />
      <span className={`${CORNER} right-1.5 top-1.5 h-2.5 w-2.5 border-r border-t`} aria-hidden />
      <span
        className={`${CORNER} bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l`}
        aria-hidden
      />
      <span
        className={`${CORNER} bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r`}
        aria-hidden
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 z-[2] h-px bg-linear-to-r from-transparent via-cyan-400/40 to-transparent"
      />
    </>
  );
}
