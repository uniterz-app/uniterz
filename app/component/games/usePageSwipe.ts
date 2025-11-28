// app/component/games/usePageSwipe.ts
import { useEffect, useRef } from "react";

type Opts = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  lockAxis?: "x" | "y";
};

export default function usePageSwipe(
  elRef: React.RefObject<HTMLDivElement | null>,   // ← ★ 修正ポイント！
  { onSwipeLeft, onSwipeRight, threshold = 24, lockAxis = "x" }: Opts
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const active = useRef(false);
  const used = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      active.current = true;
      used.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;

      if (lockAxis === "x" && Math.abs(dx) < Math.abs(dy)) return;

      if (Math.abs(dx) >= threshold && !used.current) {
        e.preventDefault();

        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();

        used.current = true;
      }
    };

    const onTouchEnd = () => {
      active.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [elRef, onSwipeLeft, onSwipeRight, threshold, lockAxis]);
}
