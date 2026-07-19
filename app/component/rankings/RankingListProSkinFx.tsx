"use client";

/**
 * ランキング行用 Pro Skin — プロフィールと同じパターン生成を流用
 * 横長行向けに cover クロップ + 可読性ウォッシュ（タイルなし）
 */

import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { getProfilePlanProAtmosHexUrl, getProfilePlanProAtmosHudUrl } from "@/lib/profile/profilePlanProAtmosBg";
import {
  getProfilePlanProBeastHudUrl,
  getProfilePlanProBeastSkinUrl,
} from "@/lib/profile/profilePlanProBeastPattern";
import { isProfilePlanProBeastBgVariant } from "@/lib/profile/profilePlanProBeastBgVariants";
import {
  getProfilePlanProFormHudUrl,
  getProfilePlanProFormSkinUrl,
} from "@/lib/profile/profilePlanProFormPattern";
import { isProfilePlanProFormBgVariant } from "@/lib/profile/profilePlanProFormBgVariants";
import {
  getProfilePlanProScaleHudUrl,
  getProfilePlanProScaleSkinUrl,
} from "@/lib/profile/profilePlanProScalePattern";
import { isProfilePlanProScaleBgVariant } from "@/lib/profile/profilePlanProScaleBgVariants";
import "@/app/component/rankings/rankingListProSkinFx.css";

export type RankingListProSkinIntensity = "subtle" | "medium";

type Props = {
  variant: ProfilePlanProBgVariant;
  intensity?: RankingListProSkinIntensity;
};

function SkinLayer({
  className,
  backgroundImage,
}: {
  className: string;
  backgroundImage: string;
}) {
  return (
    <div
      className={["ranking-list-pro-skin-fx__layer", className].join(" ")}
      style={{ backgroundImage }}
      aria-hidden
    />
  );
}

export default function RankingListProSkinFx({
  variant,
  intensity = "medium",
}: Props) {
  const rootClass = [
    "ranking-list-pro-skin-fx",
    `ranking-list-pro-skin-fx--${intensity}`,
    `ranking-list-pro-skin-fx--${variant}`,
  ].join(" ");

  if (isProfilePlanProScaleBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SkinLayer
          className="ranking-list-pro-skin-fx__skin"
          backgroundImage={getProfilePlanProScaleSkinUrl(variant)}
        />
        <SkinLayer
          className="ranking-list-pro-skin-fx__hud"
          backgroundImage={getProfilePlanProScaleHudUrl(variant)}
        />
        <div className="ranking-list-pro-skin-fx__wash" />
      </div>
    );
  }

  if (isProfilePlanProBeastBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SkinLayer
          className="ranking-list-pro-skin-fx__skin"
          backgroundImage={getProfilePlanProBeastSkinUrl(variant)}
        />
        <SkinLayer
          className="ranking-list-pro-skin-fx__hud"
          backgroundImage={getProfilePlanProBeastHudUrl(variant)}
        />
        <div className="ranking-list-pro-skin-fx__wash" />
      </div>
    );
  }

  if (isProfilePlanProFormBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SkinLayer
          className="ranking-list-pro-skin-fx__skin"
          backgroundImage={getProfilePlanProFormSkinUrl(variant)}
        />
        <SkinLayer
          className="ranking-list-pro-skin-fx__hud"
          backgroundImage={getProfilePlanProFormHudUrl(variant)}
        />
        <div className="ranking-list-pro-skin-fx__wash" />
      </div>
    );
  }

  return (
    <div className={rootClass} aria-hidden>
      <SkinLayer
        className="ranking-list-pro-skin-fx__skin"
        backgroundImage={getProfilePlanProAtmosHexUrl("default")}
      />
      <SkinLayer
        className="ranking-list-pro-skin-fx__hud ranking-list-pro-skin-fx__hud--atmos"
        backgroundImage={getProfilePlanProAtmosHudUrl("default")}
      />
      <div
        className={[
          "ranking-list-pro-skin-fx__atmos-tint",
          variant === "parallax"
            ? "ranking-list-pro-skin-fx__atmos-tint--parallax"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <div className="ranking-list-pro-skin-fx__wash" />
    </div>
  );
}
