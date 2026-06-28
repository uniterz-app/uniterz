"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import type { Language } from "@/lib/i18n/language";
import type { WcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
import {
  WC_BRACKET_MATCH_CARD_CLASS,
  WC_BRACKET_MATCH_CARD_DIVIDER_CLASS,
  WC_BRACKET_MATCH_ROW_BAR_CLASS,
  WC_BRACKET_MATCH_ROW_BAR_SPACER_CLASS,
  wcBracketMatchRowClass,
  wcBracketMatchRowFlagClass,
  wcBracketMatchRowFlagPlaceholderClass,
  wcBracketMatchRowNameClass,
  wcBracketMatchRowQualClass,
} from "@/app/component/predict/wc/wcBracketMatchRowClasses";

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

  const rowClass = wcBracketMatchRowClass({ compact, selected, pickable });

  const inner = (
    <>
      {selected ? (
        <span className={WC_BRACKET_MATCH_ROW_BAR_CLASS} aria-hidden />
      ) : (
        <span className={WC_BRACKET_MATCH_ROW_BAR_SPACER_CLASS} aria-hidden />
      )}

      {showQual ? (
        <span className={wcBracketMatchRowQualClass(compact)}>{qual}</span>
      ) : (
        <span className={wcBracketMatchRowQualClass(compact)} aria-hidden />
      )}

      {teamId ? (
        <span className={wcBracketMatchRowFlagClass(compact)}>
          <CountryFlag
            teamId={teamId}
            variant="inline"
            className="block h-full w-full ring-0"
          />
        </span>
      ) : (
        <span className={wcBracketMatchRowFlagPlaceholderClass(compact)}>
          {qual || "—"}
        </span>
      )}

      <span className={wcBracketMatchRowNameClass({ compact, selected })}>
        {display}
      </span>
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
    ? (teamIdToCountryName(match.home.teamId, "en") ??
      match.home.label ??
      "—")
    : match.home.label || "—";
  const awayName = match.away.teamId
    ? (teamIdToCountryName(match.away.teamId, "en") ??
      match.away.label ??
      "—")
    : match.away.label || "—";

  const picked = match.pickedWinner;
  const pickable = match.ready;

  return (
    <div className={WC_BRACKET_MATCH_CARD_CLASS}>
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
      <div className={WC_BRACKET_MATCH_CARD_DIVIDER_CLASS} aria-hidden />
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
