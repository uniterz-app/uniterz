"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import type { KinetikProfileAccentKey } from "@/app/component/profile/edit/kinetikRankBadge";
import {
  getProfilePlanProAtmosHexUrl,
  getProfilePlanProAtmosHexUrlWeb,
  getProfilePlanProAtmosHudUrl,
  getProfilePlanProAtmosHudUrlWeb,
} from "@/lib/profile/profilePlanProAtmosBg";
import { isProfilePlanProGeoBgVariant } from "@/lib/profile/profilePlanProGeoBgVariants";
import { getProfilePlanProHexLayoutPatterns } from "@/lib/profile/profilePlanProHexLayoutPattern";
import {
  getProfilePlanProHexLayoutId,
  isProfilePlanProHexBgVariant,
} from "@/lib/profile/profilePlanProHexBgVariants";
import { isProfilePlanProMoodBgVariant } from "@/lib/profile/profilePlanProMoodBgVariants";
import { isProfilePlanProNovaBgVariant } from "@/lib/profile/profilePlanProNovaBgVariants";
import { isProfilePlanProBeastBgVariant } from "@/lib/profile/profilePlanProBeastBgVariants";
import {
  getProfilePlanProBeastHudUrl,
  getProfilePlanProBeastSkinUrl,
} from "@/lib/profile/profilePlanProBeastPattern";
import { isProfilePlanProCosmosBgVariant } from "@/lib/profile/profilePlanProCosmosBgVariants";
import {
  getProfilePlanProCosmosHudUrl,
  getProfilePlanProCosmosSkinUrl,
} from "@/lib/profile/profilePlanProCosmosPattern";
import { isProfilePlanProLabBgVariant } from "@/lib/profile/profilePlanProLabBgVariants";
import {
  getProfilePlanProLabHudUrl,
  getProfilePlanProLabSkinUrl,
} from "@/lib/profile/profilePlanProLabPattern";
import { isProfilePlanProFormBgVariant } from "@/lib/profile/profilePlanProFormBgVariants";
import {
  getProfilePlanProFormHudUrl,
  getProfilePlanProFormHudUrlWeb,
  getProfilePlanProFormSkinUrl,
  getProfilePlanProFormSkinUrlWeb,
} from "@/lib/profile/profilePlanProFormPattern";
import { isProfilePlanProScaleBgVariant } from "@/lib/profile/profilePlanProScaleBgVariants";
import {
  getProfilePlanProScaleHudUrl,
  getProfilePlanProScaleSkinUrl,
} from "@/lib/profile/profilePlanProScalePattern";
import { PROFILE_PLAN_PRO_BG } from "@/lib/profile/profilePlanVisual";

type Props = {
  variant?: ProfilePlanProBgVariant;
  animate?: boolean;
  /** Mobile ステージ — FX を強調 */
  mobileBoost?: boolean;
  /** Web（横長 2 カラム）レイアウト — 横長用の図形に切替 */
  web?: boolean;
  /** 枠 accent — 図形色を tier に合わせる */
  profileAccent?: KinetikProfileAccentKey;
  /** false の間は背景を出さない（stats 確定前の accent チラつき防止） */
  accentReady?: boolean;
};

const ATMOS_ENTER_EASE = [0.22, 0.61, 0.36, 1] as const;

/** パターン層 — 初回のみまばらに浮き出し（ループなし）
 * filter は使わない（background-image の SVG データ URL と相性が悪く、絵柄が消えることがある） */
function SparseEnterLayer({
  animate,
  delayMs = 0,
  className,
  style,
  children,
}: {
  animate: boolean;
  delayMs?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const shouldEnter = animate && reduceMotion !== true;

  return (
    <motion.div
      className={className}
      style={style}
      initial={
        shouldEnter
          ? { opacity: 0, y: 10, scale: 0.96 }
          : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.88,
        delay: shouldEnter ? delayMs / 1000 : 0,
        ease: ATMOS_ENTER_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}


function DepthVignette({ className = "" }: { className?: string }) {
  return <div className={`profile-plan-pro-bg__vignette ${className}`.trim()} aria-hidden />;
}

/** atmos — accent 確定後にマウントし、即入場（1回のみ） */
function AtmosEnterLayers({
  rootClass,
  web,
  profileAccent,
  animate,
  accentReady,
}: {
  rootClass: string;
  web: boolean;
  profileAccent: KinetikProfileAccentKey;
  animate: boolean;
  accentReady: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const shouldEnter = animate && reduceMotion !== true;

  if (!accentReady) return null;

  const hidden = {
    opacity: 0,
    scale: PROFILE_PLAN_PRO_BG.atmosEnterScaleFrom,
    y: PROFILE_PLAN_PRO_BG.atmosEnterYOffsetPx,
  };
  const shown = { opacity: 1, scale: 1, y: 0 };

  const enterTransition = {
    duration: PROFILE_PLAN_PRO_BG.atmosEnterMs / 1000,
    ease: ATMOS_ENTER_EASE,
  };

  const hexBg = web
    ? getProfilePlanProAtmosHexUrlWeb(profileAccent)
    : getProfilePlanProAtmosHexUrl(profileAccent);
  const hudBg = web
    ? getProfilePlanProAtmosHudUrlWeb(profileAccent)
    : getProfilePlanProAtmosHudUrl(profileAccent);

  return (
    <div className={rootClass} aria-hidden>
      <motion.div
        className="profile-plan-pro-bg__atmos-hex"
        style={{ backgroundImage: hexBg }}
        initial={shouldEnter ? hidden : false}
        animate={shown}
        transition={enterTransition}
      />
      <motion.div
        className="profile-plan-pro-bg__atmos-hud"
        style={{ backgroundImage: hudBg }}
        initial={shouldEnter ? hidden : false}
        animate={shown}
        transition={{
          ...enterTransition,
          delay: shouldEnter ? PROFILE_PLAN_PRO_BG.atmosEnterHudDelayMs / 1000 : 0,
        }}
      />
    </div>
  );
}

/** PRO プラン加入者カード — 背景 FX */
export default function ProfilePlanProBackgroundFx({
  variant = PROFILE_PLAN_PRO_BG_DEFAULT,
  animate = true,
  mobileBoost = false,
  web = false,
  profileAccent = "default",
  accentReady = true,
}: Props) {
  const isScale = isProfilePlanProScaleBgVariant(variant);
  const isBeast = isProfilePlanProBeastBgVariant(variant);
  const isCosmos = isProfilePlanProCosmosBgVariant(variant);
  const isLab = isProfilePlanProLabBgVariant(variant);
  const isForm = isProfilePlanProFormBgVariant(variant);
  // 常時ループ用 --animate は使わない（枠スイープ含む無限アニメを止める）。
  // 入場は SparseEnterLayer / AtmosEnterLayers の 1 回のみ。
  const rootClass = [
    "profile-plan-pro-bg",
    `profile-plan-pro-bg--${variant}`,
    isScale ? "profile-plan-pro-bg--scale" : "",
    isBeast ? "profile-plan-pro-bg--beast" : "",
    isCosmos ? "profile-plan-pro-bg--cosmos" : "",
    isLab ? "profile-plan-pro-bg--lab" : "",
    isForm ? "profile-plan-pro-bg--form" : "",
    mobileBoost ? "profile-plan-pro-bg--mobile-boost" : "",
    web ? "profile-plan-pro-bg--web" : "",
    "pointer-events-none absolute inset-0 overflow-hidden",
    "profile-plan-pro-bg--static",
    animate ? "profile-plan-pro-bg--enter" : "",
  ].join(" ");

  if (variant === "atmos") {
    return (
      <AtmosEnterLayers
        rootClass={rootClass}
        web={web}
        profileAccent={profileAccent}
        animate={animate}
        accentReady={accentReady}
      />
    );
  }

  if (isProfilePlanProMoodBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__mood-base" />
        <div className="profile-plan-pro-bg__mood-blob profile-plan-pro-bg__mood-blob--a" />
        <div className="profile-plan-pro-bg__mood-blob profile-plan-pro-bg__mood-blob--b" />
        <div className="profile-plan-pro-bg__mood-blob profile-plan-pro-bg__mood-blob--c" />
        <div className="profile-plan-pro-bg__mood-overlay" />
        {variant === "mood-arctic" || variant === "mood-lavender" ? (
          <div className="profile-plan-pro-bg__mood-grain" aria-hidden />
        ) : null}
        <DepthVignette className="profile-plan-pro-bg__vignette--mood" />
      </div>
    );
  }

  if (isProfilePlanProGeoBgVariant(variant)) {
    if (isProfilePlanProHexBgVariant(variant)) {
      const layoutId = getProfilePlanProHexLayoutId(variant);
      const patterns = getProfilePlanProHexLayoutPatterns(layoutId);
      // タイル反復せず 1 枚をパネル全体に引き伸ばす（継ぎ目防止）
      const singleStyle = {
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      } as const;

      return (
        <div className={rootClass} aria-hidden>
          <div className="profile-plan-pro-bg__geo-base" />
          <div
            className="profile-plan-pro-bg__geo-pattern profile-plan-pro-bg__geo-pattern--depth"
            style={{
              ...singleStyle,
              backgroundImage: patterns.depth,
            }}
          />
          <div
            className="profile-plan-pro-bg__geo-pattern profile-plan-pro-bg__geo-pattern--hex"
            style={{
              ...singleStyle,
              backgroundImage: patterns.pattern,
            }}
          />
          <div className="profile-plan-pro-bg__geo-glow" />
          <DepthVignette className="profile-plan-pro-bg__vignette--geo" />
        </div>
      );
    }

    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__geo-base" />
        <div className="profile-plan-pro-bg__geo-pattern" />
        <div className="profile-plan-pro-bg__geo-glow" />
        <DepthVignette className="profile-plan-pro-bg__vignette--geo" />
      </div>
    );
  }

  if (isProfilePlanProNovaBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__nova-base" />
        <div className="profile-plan-pro-bg__nova-grid" />
        <div className="profile-plan-pro-bg__nova-orb profile-plan-pro-bg__nova-orb--a" />
        <div className="profile-plan-pro-bg__nova-orb profile-plan-pro-bg__nova-orb--b" />
        <div className="profile-plan-pro-bg__nova-orb profile-plan-pro-bg__nova-orb--c" />
        <div className="profile-plan-pro-bg__nova-fx" />
        <div className="profile-plan-pro-bg__nova-overlay" />
        <DepthVignette className="profile-plan-pro-bg__vignette--nova" />
      </div>
    );
  }

  if (isProfilePlanProScaleBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={40}
          className="profile-plan-pro-bg__scale-skin"
          style={{ backgroundImage: getProfilePlanProScaleSkinUrl(variant) }}
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={180}
          className="profile-plan-pro-bg__scale-hud"
          style={{ backgroundImage: getProfilePlanProScaleHudUrl(variant) }}
        />
      </div>
    );
  }

  if (isProfilePlanProBeastBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={40}
          className="profile-plan-pro-bg__beast-skin"
          style={{ backgroundImage: getProfilePlanProBeastSkinUrl(variant) }}
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={180}
          className="profile-plan-pro-bg__beast-hud"
          style={{ backgroundImage: getProfilePlanProBeastHudUrl(variant) }}
        />
      </div>
    );
  }

  if (isProfilePlanProCosmosBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={40}
          className="profile-plan-pro-bg__cosmos-skin"
          style={{ backgroundImage: getProfilePlanProCosmosSkinUrl(variant) }}
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={180}
          className="profile-plan-pro-bg__cosmos-hud"
          style={{ backgroundImage: getProfilePlanProCosmosHudUrl(variant) }}
        />
      </div>
    );
  }

  if (isProfilePlanProLabBgVariant(variant)) {
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={40}
          className="profile-plan-pro-bg__lab-skin"
          style={{ backgroundImage: getProfilePlanProLabSkinUrl(variant) }}
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={180}
          className="profile-plan-pro-bg__lab-hud"
          style={{ backgroundImage: getProfilePlanProLabHudUrl(variant) }}
        />
      </div>
    );
  }

  if (isProfilePlanProFormBgVariant(variant)) {
    const formSkin = web
      ? getProfilePlanProFormSkinUrlWeb(variant)
      : getProfilePlanProFormSkinUrl(variant);
    const formHud = web
      ? getProfilePlanProFormHudUrlWeb(variant)
      : getProfilePlanProFormHudUrl(variant);
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={40}
          className="profile-plan-pro-bg__form-skin"
          style={{ backgroundImage: formSkin }}
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={180}
          className="profile-plan-pro-bg__form-hud"
          style={{ backgroundImage: formHud }}
        />
      </div>
    );
  }

  if (variant === "tunnel") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__tunnel-wrap">
          <div className="profile-plan-pro-bg__tunnel-floor" />
        </div>
        <div className="profile-plan-pro-bg__tunnel-fog" />
        <DepthVignette className="profile-plan-pro-bg__vignette--tunnel" />
      </div>
    );
  }

  if (variant === "parallax") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <SparseEnterLayer
          animate={animate}
          delayMs={0}
          className="profile-plan-pro-bg__layer profile-plan-pro-bg__layer--far"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={120}
          className="profile-plan-pro-bg__layer profile-plan-pro-bg__layer--mid"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={240}
          className="profile-plan-pro-bg__layer profile-plan-pro-bg__layer--near"
        />
        <DepthVignette className="profile-plan-pro-bg__vignette--parallax" />
      </div>
    );
  }

  if (variant === "depth-field") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__dots profile-plan-pro-bg__dots--far" />
        <div className="profile-plan-pro-bg__dots profile-plan-pro-bg__dots--mid" />
        <div className="profile-plan-pro-bg__dots profile-plan-pro-bg__dots--near" />
        <DepthVignette className="profile-plan-pro-bg__vignette--depth" />
      </div>
    );
  }

  if (variant === "sonar") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__sonar-ring profile-plan-pro-bg__sonar-ring--1" />
        <div className="profile-plan-pro-bg__sonar-ring profile-plan-pro-bg__sonar-ring--2" />
        <div className="profile-plan-pro-bg__sonar-ring profile-plan-pro-bg__sonar-ring--3" />
        <div className="profile-plan-pro-bg__sonar-ring profile-plan-pro-bg__sonar-ring--4" />
        <div className="profile-plan-pro-bg__sonar-sweep" />
        <DepthVignette className="profile-plan-pro-bg__vignette--sonar" />
      </div>
    );
  }

  if (variant === "orbit") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__orbit profile-plan-pro-bg__orbit--a" />
        <div className="profile-plan-pro-bg__orbit profile-plan-pro-bg__orbit--b" />
        <div className="profile-plan-pro-bg__orbit profile-plan-pro-bg__orbit--c" />
        <div className="profile-plan-pro-bg__orbit-core" />
        <DepthVignette className="profile-plan-pro-bg__vignette--orbit" />
      </div>
    );
  }

  if (variant === "light-shaft") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <SparseEnterLayer
          animate={animate}
          delayMs={0}
          className="profile-plan-pro-bg__shaft profile-plan-pro-bg__shaft--a"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={140}
          className="profile-plan-pro-bg__shaft profile-plan-pro-bg__shaft--b"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={280}
          className="profile-plan-pro-bg__shaft profile-plan-pro-bg__shaft--c"
        />
        <DepthVignette className="profile-plan-pro-bg__vignette--shaft" />
      </div>
    );
  }

  if (variant === "stack") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__stack profile-plan-pro-bg__stack--1" />
        <div className="profile-plan-pro-bg__stack profile-plan-pro-bg__stack--2" />
        <div className="profile-plan-pro-bg__stack profile-plan-pro-bg__stack--3" />
        <div className="profile-plan-pro-bg__stack profile-plan-pro-bg__stack--4" />
        <DepthVignette className="profile-plan-pro-bg__vignette--stack" />
      </div>
    );
  }

  if (variant === "wormhole") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__wormhole profile-plan-pro-bg__wormhole--outer" />
        <div className="profile-plan-pro-bg__wormhole profile-plan-pro-bg__wormhole--inner" />
        <div className="profile-plan-pro-bg__wormhole-core" />
        <DepthVignette className="profile-plan-pro-bg__vignette--wormhole" />
      </div>
    );
  }

  if (variant === "hex-depth") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__hex-depth-horizon" />
        <div className="profile-plan-pro-bg__hex-depth-wrap">
          <div className="profile-plan-pro-bg__hex-depth-floor" />
        </div>
        <DepthVignette className="profile-plan-pro-bg__vignette--hex" />
      </div>
    );
  }

  if (variant === "starfield") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__starfield">
          <div className="profile-plan-pro-bg__starfield-layer profile-plan-pro-bg__starfield-layer--far" />
          <div className="profile-plan-pro-bg__starfield-layer profile-plan-pro-bg__starfield-layer--mid" />
          <div className="profile-plan-pro-bg__starfield-layer profile-plan-pro-bg__starfield-layer--near" />
        </div>
        <DepthVignette className="profile-plan-pro-bg__vignette--starfield" />
      </div>
    );
  }

  if (variant === "isometric") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__iso-wrap">
          <div className="profile-plan-pro-bg__iso-floor" />
        </div>
        <div className="profile-plan-pro-bg__iso-horizon" />
        <DepthVignette className="profile-plan-pro-bg__vignette--iso" />
      </div>
    );
  }

  if (variant === "topography") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__topo-wrap">
          <div className="profile-plan-pro-bg__topo-ring profile-plan-pro-bg__topo-ring--1" />
          <div className="profile-plan-pro-bg__topo-ring profile-plan-pro-bg__topo-ring--2" />
          <div className="profile-plan-pro-bg__topo-ring profile-plan-pro-bg__topo-ring--3" />
          <div className="profile-plan-pro-bg__topo-ring profile-plan-pro-bg__topo-ring--4" />
          <div className="profile-plan-pro-bg__topo-ring profile-plan-pro-bg__topo-ring--5" />
        </div>
        <DepthVignette className="profile-plan-pro-bg__vignette--topo" />
      </div>
    );
  }

  if (variant === "wire-cage") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__wire-cage-wrap">
          <div className="profile-plan-pro-bg__wire-cage profile-plan-pro-bg__wire-cage--a" />
          <div className="profile-plan-pro-bg__wire-cage profile-plan-pro-bg__wire-cage--b" />
          <div className="profile-plan-pro-bg__wire-cage profile-plan-pro-bg__wire-cage--c" />
          <div className="profile-plan-pro-bg__wire-cage-core" />
        </div>
        <DepthVignette className="profile-plan-pro-bg__vignette--wire" />
      </div>
    );
  }

  if (variant === "circuit") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <div className="profile-plan-pro-bg__circuit-wrap">
          <div className="profile-plan-pro-bg__circuit-floor" />
          <div className="profile-plan-pro-bg__circuit-node profile-plan-pro-bg__circuit-node--1" />
          <div className="profile-plan-pro-bg__circuit-node profile-plan-pro-bg__circuit-node--2" />
          <div className="profile-plan-pro-bg__circuit-node profile-plan-pro-bg__circuit-node--3" />
        </div>
        <DepthVignette className="profile-plan-pro-bg__vignette--circuit" />
      </div>
    );
  }

  if (variant === "cloud-volume") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__base-depth" />
        <SparseEnterLayer
          animate={animate}
          delayMs={0}
          className="profile-plan-pro-bg__cloud profile-plan-pro-bg__cloud--a"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={130}
          className="profile-plan-pro-bg__cloud profile-plan-pro-bg__cloud--b"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={260}
          className="profile-plan-pro-bg__cloud profile-plan-pro-bg__cloud--c"
        />
        <DepthVignette className="profile-plan-pro-bg__vignette--cloud" />
      </div>
    );
  }

  if (variant === "holo") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__wash" />
        <div className="profile-plan-pro-bg__holo-sheen" />
        <DepthVignette />
      </div>
    );
  }

  if (variant === "grain") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__wash profile-plan-pro-bg__wash--dim" />
        <div className="profile-plan-pro-bg__grain" />
        <div className="profile-plan-pro-bg__aurora profile-plan-pro-bg__aurora--cyan profile-plan-pro-bg__aurora--faint" />
        <DepthVignette />
      </div>
    );
  }

  if (variant === "prism") {
    return (
      <div className={rootClass} aria-hidden>
        <div className="profile-plan-pro-bg__wash" />
        <div className="profile-plan-pro-bg__prism profile-plan-pro-bg__prism--tl" />
        <div className="profile-plan-pro-bg__prism profile-plan-pro-bg__prism--br" />
        <DepthVignette />
      </div>
    );
  }

  if (variant === "mesh") {
    return (
      <div className={rootClass} aria-hidden>
        <SparseEnterLayer
          animate={animate}
          delayMs={0}
          className="profile-plan-pro-bg__mesh profile-plan-pro-bg__mesh--cyan"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={150}
          className="profile-plan-pro-bg__mesh profile-plan-pro-bg__mesh--purple"
        />
        <SparseEnterLayer
          animate={animate}
          delayMs={300}
          className="profile-plan-pro-bg__mesh profile-plan-pro-bg__mesh--magenta"
        />
        <DepthVignette className="profile-plan-pro-bg__vignette--soft" />
      </div>
    );
  }

  // aurora（デフォルト）
  return (
    <div className={rootClass} aria-hidden>
      <div className="profile-plan-pro-bg__wash" />
      <SparseEnterLayer
        animate={animate}
        delayMs={40}
        className="profile-plan-pro-bg__aurora profile-plan-pro-bg__aurora--cyan"
      />
      <SparseEnterLayer
        animate={animate}
        delayMs={200}
        className="profile-plan-pro-bg__aurora profile-plan-pro-bg__aurora--purple"
      />
      <DepthVignette />
    </div>
  );
}
