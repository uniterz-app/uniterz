"use client";

import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { nameRajdhani } from "@/lib/fonts";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import type { ProfilePlanProNovaBgMeta } from "@/lib/profile/profilePlanProNovaBgVariants";

type Props = {
  variant: ProfilePlanProNovaBgMeta;
  selected?: boolean;
  onSelect?: () => void;
};

/** Nova 背景 — コンパクトプレビュー */
export default function ProfilePlanProNovaBgSwatch({
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
        "profile-plan-pro-nova-swatch group relative w-full overflow-hidden rounded-xl border text-left transition",
        PROFILE_PLAN_PRO_CLASS,
        "profile-kinetik-panel",
        selected
          ? "border-cyan-400/55 ring-1 ring-cyan-400/35"
          : "border-white/12 hover:border-cyan-400/28",
        onSelect ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 opacity-80"
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={[
              nameRajdhani.className,
              "text-[11px] font-semibold tracking-[0.14em] uppercase",
              selected ? "text-cyan-300" : "text-white/85",
            ].join(" ")}
          >
            {variant.label}
          </span>
          <span className="rounded border border-cyan-400/35 bg-cyan-400/12 px-1.5 py-px text-[9px] text-cyan-100/90">
            NEW
          </span>
        </div>
        <span className="mt-0.5 text-[10px] text-white/50">{variant.tag}</span>
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/45">
          {variant.description}
        </p>
      </div>
    </Tag>
  );
}
