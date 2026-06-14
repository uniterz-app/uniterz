"use client";

import { useEffect, useState } from "react";

/** リザルト一覧の listNowTick が無い詳細ヘッダー等向け（30秒更新） */
export function useResultCardClockMs(cardClockMs?: number): number {
  const hasExternal =
    typeof cardClockMs === "number" && Number.isFinite(cardClockMs);
  const [now, setNow] = useState(() =>
    hasExternal ? cardClockMs! : Date.now()
  );

  useEffect(() => {
    if (hasExternal) {
      setNow(cardClockMs!);
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [hasExternal, cardClockMs]);

  return hasExternal ? cardClockMs! : now;
}
