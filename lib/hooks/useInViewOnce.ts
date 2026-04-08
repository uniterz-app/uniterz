"use client";

import { useEffect, useRef, useState } from "react";

export function useInViewOnce(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const threshold = options?.threshold ?? 0.22;
  const rootMargin = options?.rootMargin ?? "0px 0px -6% 0px";

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, threshold, rootMargin]);

  return { ref, inView };
}
