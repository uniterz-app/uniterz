"use client";

import { useEffect, useState } from "react";

/** 概要タブの重いブロックを段階的にマウントして初期負荷を分散 */
export function useProfileOverviewStage(
  ready: boolean,
  opts?: { mobile?: boolean; instant?: boolean }
) {
  const [stage, setStage] = useState(0);
  const stepMs = opts?.mobile ? 450 : 120;
  const instant = opts?.instant === true;

  useEffect(() => {
    if (!ready) {
      setStage(0);
      return;
    }

    if (instant) {
      setStage(4);
      return;
    }

    const timers = [
      window.setTimeout(() => setStage(1), 0),
      window.setTimeout(() => setStage(2), stepMs),
      window.setTimeout(() => setStage(3), stepMs * 2),
      window.setTimeout(() => setStage(4), stepMs * 3),
    ];

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [ready, stepMs, instant]);

  return stage;
}
