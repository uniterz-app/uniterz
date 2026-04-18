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
  const slot =
    variant === "mobile"
      ? "h-14 w-14 sm:h-16 sm:w-16"
      : "h-14 w-14 sm:h-16 sm:w-16";

  return (
    <div className="mt-4 flex flex-wrap content-start gap-2">
      {badges.slice(0, sliceMax).map((b) => (
        <button
          key={b.id}
          type="button"
          className={`inline-flex ${slot} shrink-0 items-center justify-center overflow-hidden rounded-xl`}
          title={b.title}
        >
          {b.icon ? (
            <img
              src={b.icon}
              alt={b.title}
              className="h-full w-full object-contain p-0.5"
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
