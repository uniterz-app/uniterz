"use client";

import type { CSSProperties, InputHTMLAttributes } from "react";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { PREDICT_OVERLAY_SCORE_INPUT_CLASS } from "@/lib/ui/predictOverlayCyber";

/** Score prediction パネルのチーム名 — マッチカードと同系（Oxanium SemiBold） */
const overlayTeamNameStyle: CSSProperties = {
  fontFamily: nameOxanium.style.fontFamily,
  fontWeight: 600,
  letterSpacing: "0.05em",
  transform: "skewX(-6deg)",
  color: "#F8FAFC",
};

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
  const sideLabel = side === "home" ? "HOME" : "AWAY";
  const teamName = englishHudTeamName(teamId, label);
  const title = `${sideLabel}: ${teamName}`;

  return (
    <label className="group flex min-w-0 flex-1 flex-col gap-1.5">
      <span
        className={[
          nameOxanium.className,
          "px-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45",
        ].join(" ")}
      >
        {sideLabel}
      </span>
      <span
        className={[
          nameOxanium.className,
          "truncate px-0.5 text-[13px] font-semibold uppercase leading-tight md:text-[14px]",
        ].join(" ")}
        style={overlayTeamNameStyle}
        title={title}
      >
        {teamName}
      </span>

      <span
        className="relative block overflow-hidden bg-black transition-[border-color] duration-150 group-focus-within:border-white/70"
        style={{
          border: "1px solid rgba(255,255,255,0.55)",
          borderRadius: 0,
          background: "#000",
        }}
      >
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
            nameBebas.className,
            "relative z-[1] w-full bg-transparent px-3 py-2.5 text-center text-[18px] font-normal uppercase leading-none tracking-[0.08em] outline-none md:text-[18px]",
          ].join(" ")}
          style={{
            caretColor: "#ffffff",
            color: "#ffffff",
            transform: "skewX(-6deg)",
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
