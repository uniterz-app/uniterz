"use client";

import { forwardRef, type ReactNode, type Ref } from "react";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import {
  KINETIK_FLIP_EAR,
  ProfileKinetikFlipEar,
  ProfileKinetikFlipEarTopEdges,
  useProfileKinetikFlipEar,
} from "@/app/component/profile/ui/ProfileKinetikFlipEar";
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
    const flipEar = useProfileKinetikFlipEar();

    const frameClass = [
      "profile-kinetik-panel min-w-0",
      isPlanPro ? PROFILE_PLAN_PRO_CLASS : "",
      proMobileStage ? "profile-plan-pro--mobile-stage" : "",
      flipEar ? "profile-kinetik-panel--flip-ear" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const inner = (
      <>
        {flipEar ? <ProfileKinetikFlipEarTopEdges /> : null}
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
        {children}
      </>
    );

    const frame =
      frameTag === "section" ? (
        <section ref={ref} className={frameClass}>
          {inner}
        </section>
      ) : (
        <div ref={ref as Ref<HTMLDivElement>} className={frameClass}>
          {inner}
        </div>
      );

    if (!flipEar) return frame;

    return (
      <div
        className="relative w-full min-w-0"
        style={{ paddingTop: KINETIK_FLIP_EAR.lipPx }}
      >
        <ProfileKinetikFlipEar />
        {frame}
      </div>
    );
  }
);

export default ProfileKinetikPanelFrame;
