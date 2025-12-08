"use client";

import React from "react";
import type { UserBadge } from "../useUserBadges";

type Props = {
  badges: UserBadge[];
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
        <div
          key={b.id}
          className={`${size} rounded-full bg-white/10 flex items-center justify-center overflow-hidden`}
        >
          {b.icon ? (
            <img src={b.icon} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-white/70">{b.id}</span>
          )}
        </div>
      ))}
    </div>
  );
}
