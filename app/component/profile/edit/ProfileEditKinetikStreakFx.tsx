"use client";

import ProfileEditKinetikAvatar from "./ProfileEditKinetikAvatar";
import type { KinetikMenuAccentKey } from "./kinetikRankBadge";
import {
  getKinetikStreakTier,
  isKinetikWinStreakActive,
  type KinetikStreakTier,
  type KinetikStreakVariant,
} from "./kinetikStreakFx";

const STACK_LINE_WIDTHS = [14, 20, 26, 32];

function StreakFxOverlays({
  variant,
  tier,
}: {
  variant: KinetikStreakVariant;
  tier: KinetikStreakTier;
}) {
  if (tier <= 0) return null;

  if (variant === "edge-march") {
    return (
      <>
        <span
          className="profile-edit-kinetik-streak-march profile-edit-kinetik-streak-march--tl"
          aria-hidden
        />
        <span
          className="profile-edit-kinetik-streak-march profile-edit-kinetik-streak-march--br"
          aria-hidden
        />
        {tier >= 3 ? (
          <>
            <span
              className="profile-edit-kinetik-streak-march profile-edit-kinetik-streak-march--tl profile-edit-kinetik-streak-march--ghost"
              aria-hidden
            />
            <span
              className="profile-edit-kinetik-streak-march profile-edit-kinetik-streak-march--br profile-edit-kinetik-streak-march--ghost"
              aria-hidden
            />
          </>
        ) : null}
      </>
    );
  }

  if (variant === "corner-stack") {
    const lineCount = tier;
    return (
      <>
        <div className="profile-edit-kinetik-streak-stack profile-edit-kinetik-streak-stack--tl">
          {Array.from({ length: lineCount }).map((_, i) => (
            <span
              key={`tl-${i}`}
              className="profile-edit-kinetik-streak-stack__line"
              style={{
                width: STACK_LINE_WIDTHS[i] ?? 32,
                animationDelay: `${i * 0.18}s`,
              }}
              aria-hidden
            />
          ))}
        </div>
        <div className="profile-edit-kinetik-streak-stack profile-edit-kinetik-streak-stack--br">
          {Array.from({ length: lineCount }).map((_, i) => (
            <span
              key={`br-${i}`}
              className="profile-edit-kinetik-streak-stack__line"
              style={{
                width: STACK_LINE_WIDTHS[i] ?? 32,
                animationDelay: `${i * 0.18 + 0.35}s`,
              }}
              aria-hidden
            />
          ))}
        </div>
      </>
    );
  }

  return null;
}

export function ProfileEditKinetikAvatarWithStreak({
  variant,
  streak,
  accentKey = "default",
  photoURL,
  displayName,
  editable,
}: {
  variant: KinetikStreakVariant;
  streak: number;
  /** 連勝なし時: メニューbtn と同じ順位/ティア色 */
  accentKey?: KinetikMenuAccentKey;
  photoURL?: string | null;
  displayName: string;
  editable?: boolean;
  language?: "ja" | "en";
}) {
  const streakActive = isKinetikWinStreakActive(streak);
  const streakTier = getKinetikStreakTier(streak);

  const wrapClass = streakActive
    ? [
        `profile-edit-kinetik-avatar-wrap--${variant}`,
        `profile-edit-kinetik-avatar-wrap--tier-${streakTier}`,
      ]
    : [`profile-edit-kinetik-avatar-wrap--accent-${accentKey}`];

  return (
    <div className="profile-edit-kinetik-avatar-column shrink-0">
      <div
        className={[
          "profile-edit-kinetik-avatar-wrap",
          ...wrapClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ProfileEditKinetikAvatar
          photoURL={photoURL}
          displayName={displayName}
          editable={editable}
        />
        {streakActive ? (
          <StreakFxOverlays variant={variant} tier={streakTier} />
        ) : null}
      </div>
    </div>
  );
}
