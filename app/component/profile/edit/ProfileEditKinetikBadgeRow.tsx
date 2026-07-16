"use client";

import type { ResolvedBadge } from "@/lib/profile/useProfileBadges";
import {
  proBridgeBadgeEnterDelayMs,
  proBridgeBadgeFloatDelayMs,
  resolveProBridgeBadgeLayout,
  shouldProBridgeBadgeNudgeScroll,
  shouldProBridgeBadgeScroll,
} from "@/lib/profile/profileBadgeBridgeLayout";

const PRO_BRIDGE_FLOAT_PHASE_STAGGER = 5;

type Props = {
  badges: ResolvedBadge[];
  layout: "web" | "mobile";
  onBadgeClick?: (badge: ResolvedBadge) => void;
  /** 名前行に横並びで入れる */
  inline?: boolean;
  /** PRO カード — bio と STATS の間 */
  variant?: "default" | "proBridge";
};

const PRO_BRIDGE_COUNT_CLASS: Record<
  ReturnType<typeof resolveProBridgeBadgeLayout>,
  string
> = {
  one: "profile-edit-kinetik-badge-row--count-one",
  two: "profile-edit-kinetik-badge-row--count-two",
  three: "profile-edit-kinetik-badge-row--count-three",
  four: "profile-edit-kinetik-badge-row--count-four",
  scroll: "profile-edit-kinetik-badge-row--count-scroll",
};

export default function ProfileEditKinetikBadgeRow({
  badges,
  layout,
  onBadgeClick,
  inline = false,
  variant = "default",
}: Props) {
  const isProBridge = variant === "proBridge";
  const visibleBadges = badges.slice(0, 10);
  const proBridgeLayout = resolveProBridgeBadgeLayout(visibleBadges.length);
  const proBridgeScroll = shouldProBridgeBadgeScroll(visibleBadges.length);
  const proBridgeNudge = shouldProBridgeBadgeNudgeScroll(visibleBadges.length);

  const slot = isProBridge
    ? layout === "mobile"
      ? "h-14 w-14 sm:h-16 sm:w-16"
      : "h-16 w-16 sm:h-[72px] sm:w-[72px]"
    : inline
      ? layout === "mobile"
        ? "h-9 w-9 sm:h-10 sm:w-10"
        : "h-10 w-10 sm:h-11 sm:w-11"
      : layout === "mobile"
        ? "h-11 w-11 sm:h-12 sm:w-12"
        : "h-14 w-14 sm:h-[56px] sm:w-[56px] md:h-[60px] md:w-[60px]";

  const thumbClass = isProBridge ? "" : "profile-edit-kinetik-badge-thumb";

  const row = (
    <div
      className={[
        "profile-edit-kinetik-badge-row flex content-start gap-1.5",
        isProBridge
          ? [
              "profile-edit-kinetik-badge-row--pro-bridge",
              proBridgeScroll ? "flex-nowrap" : "flex-wrap",
              PRO_BRIDGE_COUNT_CLASS[proBridgeLayout],
            ].join(" ")
          : "flex-wrap",
        inline ? "min-h-0 items-center" : isProBridge ? "min-h-14 sm:min-h-16" : "min-h-11 sm:min-h-12",
        badges.length === 0 && !inline ? "items-center" : "",
      ].join(" ")}
    >
      {visibleBadges.length > 0 ? (
        visibleBadges.map((badge, index) => {
          const badgeButton = (
            <button
              type="button"
              title={badge.title}
              className={[
                "profile-edit-kinetik-badge-float inline-flex shrink-0 items-center justify-center overflow-visible transition",
                isProBridge ? "" : "rounded-md",
                thumbClass,
                slot,
                onBadgeClick ? "cursor-pointer hover:opacity-85" : "cursor-default",
              ].join(" ")}
              style={
                isProBridge
                  ? ({
                      animationDelay: `${proBridgeBadgeFloatDelayMs(index) + (index % PRO_BRIDGE_FLOAT_PHASE_STAGGER) * 80}ms`,
                    } as const)
                  : undefined
              }
              onClick={() => onBadgeClick?.(badge)}
              disabled={!onBadgeClick}
            >
              {badge.icon ? (
                <img
                  src={badge.icon}
                  alt={badge.title}
                  className={[
                    "h-full w-full object-contain",
                    isProBridge ? "" : "p-0.5",
                  ].join(" ")}
                />
              ) : (
                <span className="truncate px-0.5 text-center text-[8px] leading-tight text-white/55">
                  {badge.title}
                </span>
              )}
            </button>
          );

          if (!isProBridge) {
            return <span key={badge.id}>{badgeButton}</span>;
          }

          return (
            <div
              key={badge.id}
              className="profile-edit-kinetik-badge-enter-wrap shrink-0"
              style={{ animationDelay: `${proBridgeBadgeEnterDelayMs(index)}ms` }}
            >
              {badgeButton}
            </div>
          );
        })
      ) : (
        <span className="sr-only">Badges</span>
      )}
    </div>
  );

  if (!isProBridge) {
    return row;
  }

  if (!proBridgeScroll) {
    return (
      <div
        className="profile-edit-kinetik-badge-row-scroll profile-edit-kinetik-badge-row-scroll--pro-bridge profile-edit-kinetik-badge-row-scroll--pro-bridge-static"
        aria-label="配布バッジ"
      >
        {row}
      </div>
    );
  }

  return (
    <div
      className={[
        "profile-edit-kinetik-badge-row-scroll profile-edit-kinetik-badge-row-scroll--pro-bridge",
        layout === "web" ? "profile-edit-kinetik-badge-row-scroll--web" : "",
        proBridgeNudge ? "profile-edit-kinetik-badge-row-scroll--pro-bridge-nudge" : "",
        "profile-edit-kinetik-badge-row-scroll--overflow",
      ].join(" ")}
      aria-label="配布バッジ"
    >
      {row}
    </div>
  );
}
