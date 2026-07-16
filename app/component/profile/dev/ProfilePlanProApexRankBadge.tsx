"use client";

import { nameOxanium } from "@/lib/fonts";
import { parseKinetikApexRankLabel } from "@/lib/profile/kinetikMetricDisplay";
import type { ProfilePlanProApexRankVariant } from "@/lib/profile/profilePlanProApexRankVariants";
import "./profilePlanProApexRankVariants.css";

type Props = {
  variant: ProfilePlanProApexRankVariant;
  rankLabel: string;
  language?: "ja" | "en";
  /** 現状案 — globals.css の HUD Corner */
  isPlanPro?: boolean;
  className?: string;
};

/** PRO 総合 1 位バッジ — デザイン案レンダラ */
export default function ProfilePlanProApexRankBadge({
  variant,
  rankLabel,
  language = "ja",
  isPlanPro = true,
  className = "",
}: Props) {
  const parsed = parseKinetikApexRankLabel(rankLabel, language);
  const num = "suffix" in parsed ? parsed.num : parsed.hash.replace(/^#/, "");
  const suffix = "suffix" in parsed ? parsed.suffix : undefined;
  const padNum = num.padStart(2, "0");
  const readoutIndex = (() => {
    const raw = rankLabel.replace(/^#/, "").replace(/位$/, "").trim();
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? String(n).padStart(2, "0") : "01";
  })();
  const root = [nameOxanium.className, "profile-apex-rank", className]
    .filter(Boolean)
    .join(" ");

  if (variant === "hud-corner" || variant === "readout") {
    const index = readoutIndex;
    return (
      <span
        className={[
          root,
          "profile-edit-kinetik-metric-rank--readout",
          isPlanPro ? "profile-plan-pro-metric-rank--readout" : "",
        ].join(" ")}
      >
        <span className="profile-edit-kinetik-metric-rank-readout">
          <span className="profile-edit-kinetik-metric-rank-readout__label">
            RANK
          </span>
          <span className="profile-edit-kinetik-metric-rank-readout__dot">·</span>
          <span className="profile-edit-kinetik-metric-rank-readout__num">
            {index}
          </span>
        </span>
      </span>
    );
  }

  if (variant === "slant-chip") {
    const text =
      language === "ja" ? `${num}${suffix ?? ""}` : parsed.hash ?? `#${num}`;
    return (
      <span className={`${root} profile-apex-rank--slant`}>
        <span className="profile-apex-rank--slant__inner">
          <span className="profile-apex-rank--slant__text">{text}</span>
        </span>
      </span>
    );
  }

  if (variant === "hud-frame") {
    return (
      <span className={`${root} profile-apex-rank--frame`}>
        <span className="profile-apex-rank--frame__num">{num}</span>
        {suffix ? (
          <span className="profile-apex-rank--frame__suffix">{suffix}</span>
        ) : null}
      </span>
    );
  }

  if (variant === "slash") {
    return (
      <span className={`${root} profile-apex-rank--slash`}>
        <span className="profile-apex-rank--slash__bar">/</span>
        <span className="profile-apex-rank--slash__core">
          <span>{padNum}</span>
          {suffix ? (
            <span className="profile-apex-rank--slash__suffix">{suffix}</span>
          ) : null}
        </span>
        <span className="profile-apex-rank--slash__bar">/</span>
      </span>
    );
  }

  if (variant === "glass-pill") {
    return (
      <span className={`${root} profile-apex-rank--pill`}>
        <span className="profile-apex-rank--pill__bar" aria-hidden />
        <span className="profile-apex-rank--pill__row">
          <span className="profile-apex-rank--pill__num">{num}</span>
          {suffix ? (
            <span className="profile-apex-rank--pill__suffix">{suffix}</span>
          ) : null}
        </span>
      </span>
    );
  }

  if (variant === "crest") {
    return (
      <span className={`${root} profile-apex-rank--crest`}>
        <span className="profile-apex-rank--crest__chev" aria-hidden>
          ‹‹
        </span>
        <span className="profile-apex-rank--crest__row">
          <span className="profile-apex-rank--crest__num">{num}</span>
          {suffix ? (
            <span className="profile-apex-rank--crest__suffix">{suffix}</span>
          ) : null}
        </span>
        <span className="profile-apex-rank--crest__chev" aria-hidden>
          ››
        </span>
      </span>
    );
  }

  return (
    <span className={`${root} profile-apex-rank--underline`}>
      <span className="profile-apex-rank--underline__row">
        <span className="profile-apex-rank--underline__num">{num}</span>
        {suffix ? (
          <span className="profile-apex-rank--underline__suffix">{suffix}</span>
        ) : null}
      </span>
      <span className="profile-apex-rank--underline__line" aria-hidden />
    </span>
  );
}
