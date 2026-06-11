/** 1位行 — 案D EDGE SCAN（上下左右から光が縁を流れる） */
export function RankFirstBorderEdgeScan() {
  return (
    <>
      <div
        aria-hidden
        className="rank-first-flow-dim pointer-events-none absolute inset-0 z-[6]"
      />
      <div
        aria-hidden
        className="rank-first-flow--edge-scan absolute inset-0 z-[7]"
      />
      <div
        aria-hidden
        className="rank-first-flow--edge-scan-v absolute inset-0 z-[7]"
      >
        <span />
        <span />
      </div>
    </>
  );
}
