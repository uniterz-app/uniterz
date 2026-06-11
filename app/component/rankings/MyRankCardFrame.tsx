"use client";

import type { ReactNode } from "react";

/** MyRankCard 外枠 — スクショ準拠（直角・紫→ライムの縁 + コーナー装飾） */
export function MyRankCardFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["my-rank-card-frame relative", className].join(" ")}>
      <div aria-hidden className="my-rank-card-frame__grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="my-rank-card-frame__edge pointer-events-none absolute inset-0" />
      <div aria-hidden className="my-rank-card-frame__corner-tl pointer-events-none absolute left-0 top-0" />
      <div aria-hidden className="my-rank-card-frame__corner-tr pointer-events-none absolute right-0 top-0" />
      <div aria-hidden className="my-rank-card-frame__corner-bl pointer-events-none absolute bottom-0 left-0" />
      <div aria-hidden className="my-rank-card-frame__corner-br pointer-events-none absolute bottom-0 right-0" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
