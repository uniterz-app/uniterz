"use client";

import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { nameRajdhani } from "@/lib/fonts";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import type { ProfilePlanProBgVariantMeta } from "@/lib/profile/profilePlanProBgVariants";

type Props = {
  variant: ProfilePlanProBgVariantMeta;
  /** 現行バッジ */
  isCurrent?: boolean;
  /** クリックで選択（プレビュー用） */
  selected?: boolean;
  onSelect?: () => void;
};

/** PRO 背景のみのコンパクトプレビュー */
export default function ProfilePlanProBgSwatch({
  variant,
  isCurrent = false,
  selected = false,
  onSelect,
}: Props) {
  const Tag = onSelect ? "button" : "div";

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={[
        "profile-plan-pro-bg-swatch group relative w-full overflow-hidden rounded-xl border text-left transition",
        PROFILE_PLAN_PRO_CLASS,
        "profile-kinetik-panel",
        selected
          ? "border-cyan-400/55 ring-1 ring-cyan-400/35"
          : "border-white/12 hover:border-cyan-400/30",
        onSelect ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <ProfilePlanProBackgroundFx variant={variant.id} />

      {/* 枠コーナー（本番と同じ雰囲気） */}
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

      <div className="profile-plan-pro-bg-swatch__label relative z-[1] flex min-h-[120px] flex-col justify-end p-3 sm:min-h-[140px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={[
              nameRajdhani.className,
              "text-[11px] font-semibold tracking-[0.14em] uppercase",
              selected || isCurrent ? "text-cyan-300" : "text-white/75",
            ].join(" ")}
          >
            {variant.label}
          </span>
          {isCurrent ? (
            <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-px text-[9px] text-cyan-200/85">
              現行
            </span>
          ) : null}
          {variant.isNew ? (
            <span className="rounded border border-purple-400/35 bg-purple-400/12 px-1.5 py-px text-[9px] text-purple-200/90">
              NEW
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/40">
          {variant.description}
        </p>
      </div>
    </Tag>
  );
}
