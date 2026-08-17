"use client";

import { useEffect, useRef, useState } from "react";
import {
  RANK_FIRST_EDGE_H_BEAM_RATIO,
  RANK_FIRST_EDGE_V_BEAM_RATIO,
  RANK_FIRST_LOOP_DURATION_MS,
  rankFirstLoopBeams,
} from "@/lib/rankings/rankFirstBorderEdgeScan";

/** 1位行 — 旧エッジ光線が枠を一周する */

export function RankFirstBorderEdgeScan() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setProgress(((now - t0) / RANK_FIRST_LOOP_DURATION_MS) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const beams =
    size.w > 0 && size.h > 0 ? rankFirstLoopBeams(progress, size.w, size.h) : null;
  const hW = size.w * RANK_FIRST_EDGE_H_BEAM_RATIO;
  const vH = size.h * RANK_FIRST_EDGE_V_BEAM_RATIO;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-[6]">
      <div aria-hidden className="rank-first-flow-dim absolute inset-0" />
      {beams ? (
        <div aria-hidden className="rank-first-flow-loop absolute inset-0 overflow-hidden">
          <span
            className="rank-first-flow-loop__h"
            style={{
              width: hW,
              top: 0,
              left: beams.top.pos - hW / 2,
              opacity: beams.top.opacity,
            }}
          />
          <span
            className="rank-first-flow-loop__h"
            style={{
              width: hW,
              bottom: 0,
              left: beams.bottom.pos - hW / 2,
              opacity: beams.bottom.opacity,
            }}
          />
          <span
            className="rank-first-flow-loop__v"
            style={{
              height: vH,
              right: 0,
              top: beams.right.pos - vH / 2,
              opacity: beams.right.opacity,
            }}
          />
          <span
            className="rank-first-flow-loop__v"
            style={{
              height: vH,
              left: 0,
              top: beams.left.pos - vH / 2,
              opacity: beams.left.opacity,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
