"use client";

import React from "react";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";

export type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

type Props = {
  badges: ResolvedBadge[];
  variant: "mobile" | "web";
};

export default function BadgeGrid({ badges, variant }: Props) {
  if (!badges || badges.length === 0) return null;

  const sliceMax = variant === "mobile" ? 10 : 10;
  const cols = variant === "mobile" ? "grid-cols-5" : "grid-cols-10";
  const size = variant === "mobile" ? "w-10 h-10" : "w-12 h-12";

  return (
    <div className={`mt-4 grid ${cols} gap-2`}>
      {badges.slice(0, sliceMax).map((b) => (
        <button
          key={b.id}
          className={`${size} rounded-xl overflow-hidden bg-white/10`}
          title={b.title}
        >
          {b.icon ? (
            <img
              src={b.icon}
              alt={b.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60">
              {b.title}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
