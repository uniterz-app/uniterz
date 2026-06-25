"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import type { Language } from "@/lib/i18n/language";
import type { WcInputMatchView } from "@/lib/wc/wc-bracket-input-display";

type Props = {
  match: WcInputMatchView;
  language?: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
};

function TeamPickButton({
  teamId,
  label,
  name,
  selected,
  disabled,
  onClick,
}: {
  teamId: string | null;
  label: string;
  name: string;
  selected: boolean;
  disabled: boolean;
  onClick?: () => void;
}) {
  const canPick = Boolean(teamId && onClick && !disabled);

  return (
    <button
      type="button"
      disabled={!canPick}
      onClick={onClick}
      className={[
        "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition",
        selected
          ? "border-cyan-400/90 bg-cyan-400/12 shadow-[0_0_16px_rgba(34,211,238,0.28)]"
          : "border-white/14 bg-white/[0.04] hover:border-white/28 hover:bg-white/[0.07]",
        !canPick ? "cursor-default opacity-55" : "active:scale-[0.98]",
      ].join(" ")}
    >
      {teamId ? (
        <CountryFlag
          teamId={teamId}
          className="aspect-[4/3] w-[3.25rem] sm:w-[3.75rem]"
        />
      ) : (
        <span className="flex aspect-[4/3] w-[3.25rem] items-center justify-center rounded-md bg-white/8 text-[10px] font-bold tracking-wider text-white/45 sm:w-[3.75rem]">
          {label || "TBD"}
        </span>
      )}
      <span className="max-w-full truncate text-[11px] font-semibold text-white/90">
        {name}
      </span>
    </button>
  );
}

export default function WcBracketMatchPickRow({
  match,
  language = "ja",
  onPick,
}: Props) {
  if (!match.ready) return null;

  const homeName =
    (match.home.teamId
      ? teamIdToCountryName(match.home.teamId, language)
      : null) ??
    match.home.label ??
    "—";
  const awayName =
    (match.away.teamId
      ? teamIdToCountryName(match.away.teamId, language)
      : null) ??
    match.away.label ??
    "—";

  const picked = match.pickedWinner;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.14em] text-cyan-300/75">
          {match.matchId}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TeamPickButton
          teamId={match.home.teamId}
          label={match.home.label}
          name={homeName}
          selected={Boolean(
            picked && match.home.teamId && picked === match.home.teamId
          )}
          disabled={!match.home.teamId}
          onClick={
            match.home.teamId
              ? () => onPick(match.matchId, match.home.teamId!)
              : undefined
          }
        />
        <span className="shrink-0 text-[10px] font-black tracking-wider text-white/35">
          VS
        </span>
        <TeamPickButton
          teamId={match.away.teamId}
          label={match.away.label}
          name={awayName}
          selected={Boolean(
            picked && match.away.teamId && picked === match.away.teamId
          )}
          disabled={!match.away.teamId}
          onClick={
            match.away.teamId
              ? () => onPick(match.matchId, match.away.teamId!)
              : undefined
          }
        />
      </div>
    </div>
  );
}
