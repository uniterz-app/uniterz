"use client";

import type { MobileMetric } from "@/app/mobile/(with-nav)/rankings/_data/mockRows";
import { jp } from "@/app/mobile/(with-nav)/rankings/fonts";

export default function WebMetricRow({
  metrics,
  metric,
  setMetric,
}: {
  metrics: { key: MobileMetric; label: string }[];
  metric: MobileMetric;
  setMetric: (v: MobileMetric) => void;
}) {
  const currentIndex = metrics.findIndex((m) => m.key === metric);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => {
          const next = metrics[(currentIndex + 1) % metrics.length];
          setMetric(next.key);
        }}
        className={[
          "rounded-2xl border border-white/12 bg-white/5 px-4 py-2",
          "text-xl font-black tracking-[0.04em] text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md",
          jp.className,
        ].join(" ")}
        style={{ textShadow: "0 0 18px rgba(0,255,255,0.10)" }}
      >
        {metrics.find((m) => m.key === metric)?.label}
      </button>
    </div>
  );
}