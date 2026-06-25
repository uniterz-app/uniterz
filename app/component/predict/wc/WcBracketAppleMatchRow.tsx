"use client";

import { Check } from "lucide-react";
import CountryFlag from "@/app/component/games/CountryFlag";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import type { Language } from "@/lib/i18n/language";
import type { WcInputMatchView } from "@/lib/wc/wc-bracket-input-display";

type Props = {
  match: WcInputMatchView;
  language?: Language;
  compact?: boolean;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
};

function slotRankClass(label: string, compact?: boolean) {
  const len = label.length;
  if (compact) {
    const width = len > 5 ? "w-9" : len > 3 ? "w-7" : "w-5";
    const size =
      len <= 2 ? "text-[9px]" : len <= 4 ? "text-[8px]" : "text-[7px] leading-none";
    return `${width} ${size}`;
  }
  const width = len > 5 ? "w-10" : len > 3 ? "w-8" : "w-6";
  const size =
    len <= 2 ? "text-[10px]" : len <= 4 ? "text-[9px]" : "text-[8px] leading-none";
  return `${width} ${size}`;
}

function TeamRow({
  teamId,
  label,
  name,
  selected,
  pickable,
  compact,
  onPick,
}: {
  teamId: string | null;
  label: string;
  name: string;
  selected: boolean;
  pickable: boolean;
  compact?: boolean;
  onPick?: () => void;
}) {
  const display = name || "—";
  const flagSize = compact ? "h-5 w-5" : "h-7 w-7";
  const textSize = compact ? "text-[11px]" : "text-[14px]";
  const pad = compact ? "gap-1.5 px-2 py-2" : "gap-2.5 px-4 py-3";
  const qual = label.trim();

  const inner = (
    <>
      {qual ? (
        <span
          className={[
            "shrink-0 text-center font-bold tabular-nums text-white/42",
            slotRankClass(qual, compact),
          ].join(" ")}
        >
          {qual}
        </span>
      ) : null}
      {teamId ? (
        <CountryFlag
          teamId={teamId}
          variant="inline"
          className={`${flagSize} shrink-0 w-auto! aspect-square rounded-[2px]`}
        />
      ) : (
        <span
          className={`${flagSize} shrink-0 rounded-[2px] bg-white/8`}
          aria-hidden
        />
      )}
      <span
        className={`min-w-0 flex-1 truncate text-left font-medium text-white/92 ${textSize}`}
      >
        {display}
      </span>
      {selected ? (
        <Check
          className={compact ? "h-3 w-3 shrink-0 text-cyan-400" : "h-4 w-4 shrink-0 text-cyan-400"}
          strokeWidth={3}
        />
      ) : (
        <span className={compact ? "w-3 shrink-0" : "w-4 shrink-0"} aria-hidden />
      )}
    </>
  );

  const rowClass = [
    `flex min-w-0 w-full items-center ${pad} transition`,
    selected ? "bg-cyan-400/10" : "hover:bg-white/4",
    pickable ? "cursor-pointer active:bg-cyan-400/14" : "opacity-45",
  ].join(" ");

  if (pickable && teamId && onPick) {
    return (
      <button type="button" onClick={onPick} className={rowClass}>
        {inner}
      </button>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}

export default function WcBracketAppleMatchRow({
  match,
  language = "ja",
  compact = false,
  onPick,
}: Props) {
  const homeName = match.home.teamId
    ? (teamIdToCountryName(match.home.teamId, language) ?? "—")
    : "—";
  const awayName = match.away.teamId
    ? (teamIdToCountryName(match.away.teamId, language) ?? "—")
    : "—";

  const picked = match.pickedWinner;
  const pickable = match.ready;

  return (
    <div
      className={[
        "min-w-0 overflow-hidden rounded-xl border border-white/8 bg-white/6",
        compact ? "rounded-lg" : "rounded-2xl",
      ].join(" ")}
    >
      <TeamRow
        teamId={match.home.teamId}
        label={match.home.label}
        name={homeName}
        selected={Boolean(
          picked && match.home.teamId && picked === match.home.teamId
        )}
        pickable={pickable && Boolean(match.home.teamId)}
        compact={compact}
        onPick={
          match.home.teamId
            ? () => onPick(match.matchId, match.home.teamId!)
            : undefined
        }
      />
      <div className="h-px shrink-0 bg-white/7" aria-hidden />
      <TeamRow
        teamId={match.away.teamId}
        label={match.away.label}
        name={awayName}
        selected={Boolean(
          picked && match.away.teamId && picked === match.away.teamId
        )}
        pickable={pickable && Boolean(match.away.teamId)}
        compact={compact}
        onPick={
          match.away.teamId
            ? () => onPick(match.matchId, match.away.teamId!)
            : undefined
        }
      />
    </div>
  );
}
