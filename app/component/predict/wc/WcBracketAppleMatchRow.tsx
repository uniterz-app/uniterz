"use client";

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

function isWinnerFeedLabel(label: string): boolean {
  return /^W\d+$/.test(label.trim()) || /^RU\d+$/.test(label.trim());
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
  const display = (name || "—").toUpperCase();
  const qual = label.trim();
  const showQual = Boolean(qual && !isWinnerFeedLabel(qual));

  const rowClass = [
    "wc-bracket-match-row",
    compact ? "wc-bracket-match-row--compact" : "",
    selected ? "wc-bracket-match-row--selected" : "",
    pickable ? "wc-bracket-match-row--pickable" : "wc-bracket-match-row--dim",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {selected ? (
        <span className="wc-bracket-match-row__bar" aria-hidden />
      ) : (
        <span className="wc-bracket-match-row__bar-spacer" aria-hidden />
      )}

      {showQual ? (
        <span className="wc-bracket-match-row__qual">{qual}</span>
      ) : (
        <span className="wc-bracket-match-row__qual" aria-hidden />
      )}

      {teamId ? (
        <span
          className={[
            "wc-bracket-match-row__flag",
            compact ? "wc-bracket-match-row__flag--compact" : "",
          ].join(" ")}
        >
          <CountryFlag
            teamId={teamId}
            variant="inline"
            className="block! h-full! w-full! ring-0!"
          />
        </span>
      ) : (
        <span
          className={[
            "wc-bracket-match-row__flag-placeholder",
            compact ? "wc-bracket-match-row__flag-placeholder--compact" : "",
          ].join(" ")}
        >
          {qual || "—"}
        </span>
      )}

      <span className="wc-bracket-match-row__name">{display}</span>
    </>
  );

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
    ? (teamIdToCountryName(match.home.teamId, language) ??
      match.home.label ??
      "—")
    : match.home.label || "—";
  const awayName = match.away.teamId
    ? (teamIdToCountryName(match.away.teamId, language) ??
      match.away.label ??
      "—")
    : match.away.label || "—";

  const picked = match.pickedWinner;
  const pickable = match.ready;

  return (
    <div className="wc-bracket-match-card">
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
      <div className="wc-bracket-match-card__divider" aria-hidden />
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
