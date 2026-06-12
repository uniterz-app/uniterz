"use client";

import { useEffect, useState } from "react";

/** 概要タブの重いブロックを段階的にマウントして初期負荷を分散 */
export function useProfileOverviewStage(ready: boolean) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!ready) {
      setStage(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setStage(1), 0),
      window.setTimeout(() => setStage(2), 120),
      window.setTimeout(() => setStage(3), 240),
      window.setTimeout(() => setStage(4), 360),
    ];

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [ready]);

  return stage;
}
