"use client";

import { useEffect, useMemo } from "react";
import CountryFlag from "@/app/component/games/CountryFlag";
import type { WcGoalScorerPick } from "@/lib/wc/goalScorer";
import {
  isWcGoalScorerPickValidForPredictedScore,
  wcGoalScorerEligibleTeamIds,
} from "@/lib/wc/goalScorer";
import {
  buildGoalScorerSquadSections,
  resolveGoalScorerPlayerClub,
  type GoalScorerSquadRow,
  type GoalScorerSquadSections,
} from "@/lib/wc/squadGoalScorerDisplay";
import { readTournamentGoalCount } from "@/lib/wc/aggregateTournamentGoalCounts";
import { useWcTournamentGoalCounts } from "@/lib/wc/useWcTournamentGoalCounts";
import WcTournamentGoalBallStack from "@/app/component/predict/wc/WcTournamentGoalBallStack";
import { getWcSquad } from "@/lib/wc/squads";
import { findSquadPlayer } from "@/lib/wc/squadTypes";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeLabel: string;
  awayLabel: string;
  predictedScore: { home: number; away: number } | null;
  value: WcGoalScorerPick | null;
  onChange: (next: WcGoalScorerPick | null) => void;
  language: Language;
  isMobile?: boolean;
};

type TeamColumnProps = {
  teamId: string;
  label: string;
  sections: GoalScorerSquadSections;
  value: WcGoalScorerPick | null;
  onPick: (playerId: string, teamId: string) => void;
  isMobile: boolean;
  goalCounts: ReadonlyMap<string, number> | null;
};

function PlayerRowButton({
  row,
  teamId,
  selected,
  isMobile,
  tournamentGoals,
  onPick,
}: {
  row: GoalScorerSquadRow;
  teamId: string;
  selected: boolean;
  isMobile: boolean;
  tournamentGoals: number;
  onPick: () => void;
}) {
  const { player, isStarter } = row;
  const { club, leagueIso2 } = resolveGoalScorerPlayerClub(player);

  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        "w-full rounded-lg text-left transition",
        isMobile ? "px-2 py-1.5" : "px-2.5 py-2",
        selected
          ? "bg-cyan-500/22 text-cyan-50 ring-1 ring-cyan-400/35"
          : "hover:bg-white/6",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span
          className={[
            "min-w-0 truncate font-medium",
            isMobile ? "text-xs leading-tight" : "text-sm",
            selected
              ? "text-cyan-50"
              : isStarter
                ? "text-white/92"
                : "text-white/52",
          ].join(" ")}
        >
          {player.name}
        </span>
        <span
          className={[
            "shrink-0 uppercase tracking-wide",
            isMobile ? "text-[9px]" : "text-[10px]",
            selected ? "text-cyan-200/55" : "text-white/35",
          ].join(" ")}
        >
          {player.pos}
        </span>
      </div>
      {club ? (
        <div
          className={[
            "mt-0.5 flex min-w-0 items-center gap-1",
            selected ? "text-cyan-100/55" : "text-white/42",
          ].join(" ")}
        >
          {leagueIso2 ? (
            <CountryFlag
              iso2={leagueIso2}
              decorative
              variant="inline"
              className={
                isMobile
                  ? "aspect-[4/3] w-[0.85rem] shrink-0"
                  : "aspect-[4/3] w-[0.95rem] shrink-0"
              }
            />
          ) : null}
          <span
            className={[
              "min-w-0 truncate",
              isMobile ? "text-[10px]" : "text-[11px]",
            ].join(" ")}
          >
            {club}
          </span>
          <WcTournamentGoalBallStack count={tournamentGoals} />
        </div>
      ) : tournamentGoals > 0 ? (
        <div className="mt-0.5 flex min-w-0 items-center">
          <WcTournamentGoalBallStack count={tournamentGoals} />
        </div>
      ) : null}
    </button>
  );
}

function SquadPlayerList({
  rows,
  teamId,
  value,
  isMobile,
  goalCounts,
  onPick,
}: {
  rows: GoalScorerSquadRow[];
  teamId: string;
  value: WcGoalScorerPick | null;
  isMobile: boolean;
  goalCounts: ReadonlyMap<string, number> | null;
  onPick: (playerId: string, teamId: string) => void;
}) {
  return (
    <>
      {rows.map((row) => {
        const selected =
          value?.playerId === row.player.id && value.teamId === teamId;
        return (
          <PlayerRowButton
            key={row.player.id}
            row={row}
            teamId={teamId}
            selected={selected}
            isMobile={isMobile}
            tournamentGoals={readTournamentGoalCount(
              goalCounts,
              teamId,
              row.player.id
            )}
            onPick={() => onPick(row.player.id, teamId)}
          />
        );
      })}
    </>
  );
}

function TeamPlayerColumn({
  teamId,
  label,
  sections,
  value,
  onPick,
  isMobile,
  goalCounts,
}: TeamColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/25">
      <div
        className={[
          "flex min-w-0 items-center gap-1.5 border-b border-white/8",
          isMobile ? "px-2 py-2" : "gap-2 px-3 py-2.5",
        ].join(" ")}
      >
        <CountryFlag
          teamId={teamId}
          variant="inline"
          className={[
            "aspect-[4/3] shrink-0",
            isMobile ? "h-4 w-[1.35rem]" : "h-[1.15rem] w-[1.55rem]",
          ].join(" ")}
        />
        <span
          className={[
            "min-w-0 truncate font-semibold text-white/88",
            isMobile ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {label}
        </span>
      </div>
      <div
        className={[
          "overflow-y-auto overscroll-contain",
          isMobile ? "max-h-44 p-1" : "max-h-48 p-1.5",
        ].join(" ")}
      >
        {sections.starters.length === 0 && sections.bench.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-white/40">—</p>
        ) : (
          <div className="grid gap-0.5">
            <SquadPlayerList
              rows={sections.starters}
              teamId={teamId}
              value={value}
              isMobile={isMobile}
              goalCounts={goalCounts}
              onPick={onPick}
            />
            {sections.hasLineupSplit && sections.bench.length > 0 ? (
              <div
                className={[
                  "border-t border-white/12",
                  isMobile ? "my-1" : "my-1.5",
                ].join(" ")}
                role="separator"
                aria-hidden
              />
            ) : null}
            <SquadPlayerList
              rows={sections.bench}
              teamId={teamId}
              value={value}
              isMobile={isMobile}
              goalCounts={goalCounts}
              onPick={onPick}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WcGoalScorerPicker({
  homeTeamId,
  awayTeamId,
  homeLabel,
  awayLabel,
  predictedScore,
  value,
  onChange,
  language,
  isMobile = false,
}: Props) {
  const m = t(language);
  const { goalCounts } = useWcTournamentGoalCounts();

  const homeSquad = useMemo(
    () => (homeTeamId ? getWcSquad(homeTeamId) ?? [] : []),
    [homeTeamId]
  );
  const awaySquad = useMemo(
    () => (awayTeamId ? getWcSquad(awayTeamId) ?? [] : []),
    [awayTeamId]
  );

  const eligibleTeamIds = useMemo(() => {
    if (!predictedScore) return [];
    return wcGoalScorerEligibleTeamIds(
      predictedScore,
      homeTeamId,
      awayTeamId
    );
  }, [predictedScore, homeTeamId, awayTeamId]);

  const teams = useMemo(
    () =>
      [
        homeTeamId && eligibleTeamIds.includes(homeTeamId)
          ? {
              teamId: homeTeamId,
              label: homeLabel,
              sections: buildGoalScorerSquadSections(homeSquad, homeTeamId),
            }
          : null,
        awayTeamId && eligibleTeamIds.includes(awayTeamId)
          ? {
              teamId: awayTeamId,
              label: awayLabel,
              sections: buildGoalScorerSquadSections(awaySquad, awayTeamId),
            }
          : null,
      ].filter(Boolean) as Array<{
        teamId: string;
        label: string;
        sections: GoalScorerSquadSections;
      }>,
    [
      homeTeamId,
      awayTeamId,
      homeLabel,
      awayLabel,
      homeSquad,
      awaySquad,
      eligibleTeamIds,
    ]
  );

  useEffect(() => {
    if (!value) return;
    if (
      !isWcGoalScorerPickValidForPredictedScore(
        value,
        predictedScore,
        homeTeamId,
        awayTeamId
      )
    ) {
      onChange(null);
    }
  }, [value, predictedScore, homeTeamId, awayTeamId, onChange]);

  const selectedName = useMemo(() => {
    if (!value) return null;
    const squad =
      value.teamId === homeTeamId
        ? homeSquad
        : value.teamId === awayTeamId
          ? awaySquad
          : [];
    return findSquadPlayer(squad, value.playerId)?.name ?? null;
  }, [value, homeTeamId, awayTeamId, homeSquad, awaySquad]);

  const selectedTeamLabel =
    value?.teamId === homeTeamId
      ? homeLabel
      : value?.teamId === awayTeamId
        ? awayLabel
        : null;

  const selectedTeamId = value?.teamId ?? null;

  const unavailableHint = !predictedScore
    ? m.predict.wcGoalScorerNeedsScore
    : eligibleTeamIds.length === 0
      ? m.predict.wcGoalScorerZeroZero
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white/88">
          {m.predict.wcGoalScorerTitle}
        </div>
        <span className="text-xs font-medium text-cyan-200/70">
          {m.predict.wcGoalScorerBonusHint}
        </span>
      </div>

      {value && selectedName ? (
        <div
          className={[
            "flex items-center justify-between gap-3 rounded-xl border border-cyan-400/30 bg-cyan-950/25 px-3 py-2.5",
            isMobile ? "" : "px-4 py-3",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {selectedTeamId ? (
              <CountryFlag
                teamId={selectedTeamId}
                variant="inline"
                className="aspect-[4/3] h-[1.2rem] w-[1.65rem] shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-cyan-50">
                {selectedName}
              </div>
              {selectedTeamLabel ? (
                <div className="truncate text-xs text-white/50">
                  {selectedTeamLabel}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 text-xs text-white/50 underline-offset-2 hover:text-white/75 hover:underline"
            onClick={() => onChange(null)}
          >
            {m.predict.wcGoalScorerClear}
          </button>
        </div>
      ) : unavailableHint ? (
        <p className="text-xs text-white/45">{unavailableHint}</p>
      ) : (
        <p className="text-xs text-white/45">
          {m.predict.wcGoalScorerPlaceholder}
        </p>
      )}

      {teams.length > 0 ? (
        <div className={["grid grid-cols-1", isMobile ? "gap-2" : "gap-3"].join(" ")}>
          {teams.map((team) => (
            <TeamPlayerColumn
              key={team.teamId}
              teamId={team.teamId}
              label={team.label}
              sections={team.sections}
              value={value}
              onPick={(playerId, teamId) => onChange({ playerId, teamId })}
              isMobile={isMobile}
              goalCounts={goalCounts}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
