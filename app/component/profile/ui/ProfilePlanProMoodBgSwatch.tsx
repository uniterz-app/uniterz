"use client";

import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { nameRajdhani } from "@/lib/fonts";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import type { ProfilePlanProMoodBgMeta } from "@/lib/profile/profilePlanProMoodBgVariants";

type Props = {
  variant: ProfilePlanProMoodBgMeta;
  selected?: boolean;
  onSelect?: () => void;
};

/** ムード背景 — コンパクトプレビュー */
export default function ProfilePlanProMoodBgSwatch({
  variant,
  selected = false,
  onSelect,
}: Props) {
  const Tag = onSelect ? "button" : "div";

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={[
        "profile-plan-pro-mood-swatch group relative w-full overflow-hidden rounded-xl border text-left transition",
        PROFILE_PLAN_PRO_CLASS,
        "profile-kinetik-panel",
        selected
          ? "border-white/45 ring-1 ring-white/25"
          : "border-white/12 hover:border-white/28",
        onSelect ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: variant.swatch }}
        aria-hidden
      />
      <ProfilePlanProBackgroundFx variant={variant.id} animate />

      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tl"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tr"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--bl"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--br"
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-[120px] flex-col justify-end p-3 sm:min-h-[140px]">
        <span
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.14em] uppercase",
            selected ? "text-white" : "text-white/85",
          ].join(" ")}
        >
          {variant.label}
        </span>
        <span className="mt-0.5 text-[10px] text-white/50">{variant.tag}</span>
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/45">
          {variant.description}
        </p>
      </div>
    </Tag>
  );
}
