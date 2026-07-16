"use client";

import { nameOxanium } from "@/lib/fonts";

type Props = {
  children: string;
  compact?: boolean;
  className?: string;
  /** TRON 映画風 — シアン/バイオレットのレイヤーグリッチ */
  variant?: "plain" | "tron";
};

export default function ProfileEditKinetikGlitchTitle({
  children,
  compact = false,
  className = "",
  variant = "plain",
}: Props) {
  if (variant === "tron") {
    return (
      <p
        className={[
          "profile-edit-kinetik-glitch-title",
          compact ? "profile-edit-kinetik-glitch-title--compact" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className="profile-edit-kinetik-glitch-title__layer profile-edit-kinetik-glitch-title__layer--violet"
          aria-hidden
        >
          {children}
        </span>
        <span
          className="profile-edit-kinetik-glitch-title__layer profile-edit-kinetik-glitch-title__layer--cyan"
          aria-hidden
        >
          {children}
        </span>
        <span className="profile-edit-kinetik-glitch-title__main">{children}</span>
      </p>
    );
  }

  return (
    <p
      className={[
        nameOxanium.className,
        "truncate font-bold uppercase tracking-[0.12em] text-white/88",
        compact ? "text-[10px]" : "text-[11px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
