"use client";

import { forwardRef, type ReactNode, type Ref } from "react";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import type { KinetikProfileAccentKey } from "@/app/component/profile/edit/kinetikRankBadge";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  /** PRO プラン加入者 — 背景アニメ + 枠 glow */
  isPlanPro?: boolean;
  /** 背景アニメ（reduced motion 時 false） */
  animatePlanProBg?: boolean;
  /** 背景 FX バリエーション（省略時 aurora） */
  planProBgVariant?: ProfilePlanProBgVariant;
  /** Mobile PRO — 背景を見せるステージレイアウト */
  proMobileStage?: boolean;
  /** Web（横長 2 カラム）レイアウト */
  web?: boolean;
  /** 枠 accent — 背景図形色を tier に合わせる */
  profileAccent?: KinetikProfileAccentKey;
  /** false の間は atmos 背景を出さない（stats 確定前の accent チラつき防止） */
  planProBgAccentReady?: boolean;
};

function FrameCorners({ isPlanPro = false }: { isPlanPro?: boolean }) {
  const cornerClass = [
    "profile-kinetik-frame-corner",
    isPlanPro ? "profile-plan-pro-frame-corner" : "",
  ].join(" ");

  return (
    <>
      <span className={`${cornerClass} profile-kinetik-frame-corner--tl`} aria-hidden />
      <span className={`${cornerClass} profile-kinetik-frame-corner--tr`} aria-hidden />
      <span className={`${cornerClass} profile-kinetik-frame-corner--bl`} aria-hidden />
      <span className={`${cornerClass} profile-kinetik-frame-corner--br`} aria-hidden />
    </>
  );
}

/** PRO 枠 — 環境光のみ（枠スイープの常時アニメは廃止） */
function ProFrameDecor() {
  return <span className="profile-plan-pro-ambient" aria-hidden />;
}

const ProfileKinetikPanelFrame = forwardRef<HTMLElement, Props>(
  function ProfileKinetikPanelFrame(
    {
      children,
      className = "",
      as: frameTag = "div",
      isPlanPro = false,
      animatePlanProBg = true,
      planProBgVariant,
      proMobileStage = false,
      web = false,
      profileAccent = "default",
      planProBgAccentReady = true,
    },
    ref
  ) {
    const frameClass = [
      "profile-kinetik-panel min-w-0",
      isPlanPro ? PROFILE_PLAN_PRO_CLASS : "",
      proMobileStage ? "profile-plan-pro--mobile-stage" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const inner = (
      <>
        {isPlanPro ? (
          <ProfilePlanProBackgroundFx
            animate={animatePlanProBg}
            variant={planProBgVariant ?? PROFILE_PLAN_PRO_BG_DEFAULT}
            mobileBoost={proMobileStage}
            web={web}
            profileAccent={profileAccent}
            accentReady={planProBgAccentReady}
          />
        ) : null}
        {isPlanPro ? <ProFrameDecor /> : null}
        <FrameCorners isPlanPro={isPlanPro} />
        {children}
      </>
    );

    if (frameTag === "section") {
      return (
        <section ref={ref} className={frameClass}>
          {inner}
        </section>
      );
    }

    return (
      <div ref={ref as Ref<HTMLDivElement>} className={frameClass}>
        {inner}
      </div>
    );
  }
);

export default ProfileKinetikPanelFrame;
