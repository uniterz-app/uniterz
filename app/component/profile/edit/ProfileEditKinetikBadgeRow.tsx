"use client";

import type { ResolvedBadge } from "@/lib/profile/useProfileBadges";

type Props = {
  badges: ResolvedBadge[];
  layout: "web" | "mobile";
  onBadgeClick?: (badge: ResolvedBadge) => void;
};

export default function ProfileEditKinetikBadgeRow({
  badges,
  layout,
  onBadgeClick,
}: Props) {
  const slot =
    layout === "mobile"
      ? "h-11 w-11 sm:h-12 sm:w-12"
      : "h-14 w-14 sm:h-[56px] sm:w-[56px] md:h-[60px] md:w-[60px]";

  return (
    <div
      className={[
        "profile-edit-kinetik-badge-row flex min-h-11 flex-wrap content-start gap-1.5 sm:min-h-12",
        badges.length === 0 ? "items-center" : "",
      ].join(" ")}
    >
      {badges.length > 0 ? (
        badges.slice(0, 10).map((badge) => (
          <button
            key={badge.id}
            type="button"
            title={badge.title}
            className={[
              "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md transition",
              slot,
              onBadgeClick
                ? "cursor-pointer hover:opacity-85"
                : "cursor-default",
            ].join(" ")}
            onClick={() => onBadgeClick?.(badge)}
            disabled={!onBadgeClick}
          >
            {badge.icon ? (
              <img
                src={badge.icon}
                alt={badge.title}
                className="h-full w-full object-contain p-0.5"
              />
            ) : (
              <span className="truncate px-0.5 text-center text-[8px] leading-tight text-white/55">
                {badge.title}
              </span>
            )}
          </button>
        ))
      ) : (
        <span className="sr-only">Badges</span>
      )}
    </div>
  );
}
