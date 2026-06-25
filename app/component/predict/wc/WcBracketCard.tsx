"use client";

import { getTeamPrimaryColor } from "@/lib/team-colors";
import { teamIdToWcCountry } from "@/lib/wc/wcCountry";
import type { WcMatchHitStatus } from "@/lib/wc/wc-knockout-bracket-utils";

type Props = {
  teamId?: string | null;
  label?: string;
  side?: "left" | "right";
  hitStatus?: WcMatchHitStatus;
  isPickedWinner?: boolean;
  interactive?: boolean;
  onPick?: () => void;
  className?: string;
};

const SCALE = 0.38;
const CARD_W = 148 * SCALE;
const CARD_H = 64 * SCALE;

function displayText(teamId: string | null | undefined, label?: string) {
  const id = String(teamId ?? "").trim();
  if (id) {
    const c = teamIdToWcCountry(id);
    if (c?.iso2) return c.iso2.toUpperCase().replace("GB-", "");
    return id.replace(/^wc-/, "").toUpperCase().slice(0, 3);
  }
  return (label ?? "TBD").toUpperCase();
}

export default function WcBracketCard({
  teamId,
  label,
  side = "left",
  hitStatus = "pending",
  isPickedWinner = false,
  interactive = false,
  onPick,
  className = "",
}: Props) {
  const text = displayText(teamId, label);
  const primary = teamId
    ? (getTeamPrimaryColor("wc", teamId) ?? "#1e3a5f")
    : "#334155";

  const border =
    hitStatus === "hit"
      ? "rgba(34,211,238,0.95)"
      : hitStatus === "miss"
        ? "rgba(248,113,113,0.5)"
        : isPickedWinner
          ? "rgba(251,146,60,0.85)"
          : "rgba(255,255,255,0.18)";

  const glow =
    hitStatus === "hit"
      ? "0 0 10px rgba(34,211,238,0.45)"
      : isPickedWinner
        ? "0 0 8px rgba(251,146,60,0.35)"
        : "none";

  const shellClass = [
    "relative flex items-center overflow-hidden rounded-[4px] border",
    side === "right" ? "justify-end" : "justify-start",
    interactive && onPick
      ? "cursor-pointer transition active:scale-[0.97] hover:brightness-110"
      : "",
    className,
  ].join(" ");

  const shellStyle = {
    width: CARD_W,
    height: CARD_H,
    borderColor: border,
    boxShadow: glow,
    background: `linear-gradient(135deg, ${primary}ee 0%, rgba(8,12,20,0.92) 100%)`,
  };

  const labelEl = (
    <span
      className="px-1.5 font-black tracking-[0.08em] text-white"
      style={{ fontSize: 11, textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
    >
      {text}
    </span>
  );

  if (interactive && onPick) {
    return (
      <button type="button" onClick={onPick} className={shellClass} style={shellStyle}>
        {labelEl}
      </button>
    );
  }

  return (
    <div className={shellClass} style={shellStyle}>
      {labelEl}
    </div>
  );
}

export { CARD_W as WC_BRACKET_CARD_W, CARD_H as WC_BRACKET_CARD_H };
