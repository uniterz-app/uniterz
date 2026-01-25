"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  delay?: number;
};

export default function DepthCard({ title, children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="
        rounded-2xl p-5
        bg-gradient-to-br
        from-[rgba(var(--team-primary),0.18)]
        to-[rgba(var(--team-primary),0.03)]
        border border-[rgba(var(--team-primary),0.25)]
        shadow-[0_12px_40px_rgba(var(--team-primary),0.25)]
        backdrop-blur-md
      "
    >
      {title && (
        <div className="mb-3 text-sm font-semibold text-[rgba(var(--team-primary),0.9)]">
          {title}
        </div>
      )}
      {children}
    </motion.div>
  );
}
{/* ===== KPI Grid ===== */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
  <DepthCard title="Win Rate">
    <div className="text-2xl font-bold text-white">78.9%</div>
    <div className="text-xs text-white/50">Regular Season</div>
  </DepthCard>

  <DepthCard title="Avg Points">
    <div className="text-2xl font-bold text-white">113.2</div>
    <div className="text-xs text-white/50">Per Game</div>
  </DepthCard>

  <DepthCard title="Net Rating">
    <div className="text-2xl font-bold text-white">+7.4</div>
    <div className="text-xs text-white/50">League Rank #2</div>
  </DepthCard>
</div>
