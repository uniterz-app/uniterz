"use client";

import type { InputHTMLAttributes } from "react";
import { matchScoreClass, nameOxanium } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { PREDICT_OVERLAY_SCORE_INPUT_CLASS } from "@/lib/ui/predictOverlayCyber";

type SideField = {
  side: "home" | "away";
  label: string;
  teamId?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "placeholder" | "readOnly" | "disabled" | "className"
  >;
};

type Props = {
  home: Omit<SideField, "side">;
  away: Omit<SideField, "side">;
  className?: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function inferLeague(teamId: string): League {
  if (teamId.startsWith("nba-")) return "nba";
  if (teamId.startsWith("wc-")) return "wc";
  if (teamId.startsWith("pl-")) return "pl";
  if (teamId.startsWith("bj-") || teamId.startsWith("b1-")) return "bj";
  return "j1";
}

function sideAccent(
  teamId: string | null | undefined,
  side: "home" | "away"
): string {
  if (teamId) {
    return softenTeamUiColor(
      getTeamJerseyPrimaryColor(inferLeague(teamId), teamId)
    );
  }
  return side === "home" ? "#00F5FF" : "#B388FF";
}

/** HUD 用英語チーム名（例: LAKERS）。NBA は nickname のみ。 */
function englishHudTeamName(
  teamId: string | null | undefined,
  fallbackLabel: string
): string {
  if (teamId?.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full).toUpperCase();
  }
  if (/^[A-Za-z0-9 .'\-]+$/.test(fallbackLabel.trim())) {
    return fallbackLabel.trim().toUpperCase();
  }
  if (teamId) {
    const slug = teamId.replace(/^(nba|wc|j1|bj|pl)-/, "");
    if (slug) return slug.replace(/-/g, " ").toUpperCase();
  }
  return fallbackLabel.toUpperCase();
}

function ScoreField({
  side,
  label,
  teamId,
  value,
  onChange,
  placeholder = "0",
  readOnly,
  disabled,
  inputProps,
}: SideField) {
  const primary = sideAccent(teamId, side);
  const border = hexToRgba(primary, 0.55);
  const fill = hexToRgba(primary, 0.07);
  const inset = hexToRgba(primary, 0.28);
  const sideLabel = side === "home" ? "HOME" : "AWAY";
  const teamName = englishHudTeamName(teamId, label);
  const title = `${sideLabel}: ${teamName}`;

  return (
    <label className="group flex min-w-0 flex-1 flex-col gap-1.5">
      <span
        className={[
          nameOxanium.className,
          "truncate px-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em]",
        ].join(" ")}
        title={title}
      >
        <span className="text-white/90">{sideLabel}:</span>
        <span style={{ color: hexToRgba(primary, 0.95) }}>{teamName}</span>
      </span>

      <span
        className="relative block overflow-hidden transition-[border-color,box-shadow] duration-150 group-focus-within:brightness-110"
        style={{
          transform: "skewX(-12deg)",
          border: `1px solid ${border}`,
          background: `linear-gradient(180deg, ${fill} 0%, rgba(6,11,18,0.94) 55%, rgba(3,7,14,0.97) 100%)`,
          boxShadow: `inset 0 1px 0 ${inset}`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.18) 2px,
              rgba(0, 0, 0, 0.18) 3px
            )`,
          }}
        />
        <input
          type="number"
          inputMode="numeric"
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          aria-label={title}
          className={[
            PREDICT_OVERLAY_SCORE_INPUT_CLASS,
            matchScoreClass,
            "relative z-[1] w-full bg-transparent px-3 py-2.5 text-center text-[18px] font-black leading-none outline-none md:text-[20px]",
          ].join(" ")}
          style={{
            transform: "skewX(12deg)",
            caretColor: primary,
            color: "#F0FDFF",
          }}
          {...inputProps}
        />
      </span>
    </label>
  );
}

/** 予想オーバーレイ用スコア入力 — Pro Insight / Team Stats と同系の斜め HUD */
export default function PredictOverlayScoreFields({
  home,
  away,
  className,
}: Props) {
  return (
    <div
      className={["relative z-1 flex items-end gap-2 md:gap-2.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      <ScoreField side="home" {...home} />
      <span
        className={[
          nameOxanium.className,
          "mb-3 shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/28",
        ].join(" ")}
        aria-hidden
      >
        –
      </span>
      <ScoreField side="away" {...away} />
    </div>
  );
}
