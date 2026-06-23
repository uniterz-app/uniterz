"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import CountryFlag from "@/app/component/games/CountryFlag";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { matchScoreClass } from "@/lib/fonts";
import {
  formatWcPastResultDate,
  selectWcTeamPastResults,
  type WcTeamPastResultRow,
} from "@/lib/wc/wcSeasonGameRecord";
import { useWcSeasonGames } from "@/lib/wc/useWcSeasonGames";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  currentGameId?: string | null;
  season?: string | null;
  language: Language;
  isMobile: boolean;
};

const DEFAULT_SEASON = "2025-26";

type TeamSide = "home" | "away";

export default function WcPastResultsPanel({
  homeTeamId,
  awayTeamId,
  currentGameId,
  season,
  language,
  isMobile,
}: Props) {
  const m = t(language);
  const effectiveSeason = season ?? DEFAULT_SEASON;
  const { games, loading, error } = useWcSeasonGames(effectiveSeason);
  const [side, setSide] = useState<TeamSide>("home");

  useEffect(() => {
    setSide("home");
  }, [homeTeamId, awayTeamId, currentGameId]);

  const homeRows = useMemo(() => {
    if (games == null) return null;
    return selectWcTeamPastResults(games, homeTeamId, {
      excludeGameId: currentGameId,
    });
  }, [games, homeTeamId, currentGameId]);

  const awayRows = useMemo(() => {
    if (games == null) return null;
    return selectWcTeamPastResults(games, awayTeamId, {
      excludeGameId: currentGameId,
    });
  }, [games, awayTeamId, currentGameId]);

  const homeDisplay =
    teamIdToCountryName(homeTeamId, language === "ja" ? "ja" : "en") ?? homeTeamId;
  const awayDisplay =
    teamIdToCountryName(awayTeamId, language === "ja" ? "ja" : "en") ?? awayTeamId;

  if (isMobile) {
    const activeTeamId = side === "home" ? homeTeamId : awayTeamId;
    const activeLabel = side === "home" ? homeDisplay : awayDisplay;
    const activeRows = side === "home" ? homeRows : awayRows;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { side: "home" as const, teamId: homeTeamId, label: homeDisplay },
              { side: "away" as const, teamId: awayTeamId, label: awayDisplay },
            ] as const
          ).map((item) => {
            const active = side === item.side;
            return (
              <button
                key={item.side}
                type="button"
                onClick={() => setSide(item.side)}
                className={[
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-none border px-2 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                    : "border-white/10 bg-white/[0.035] text-white/70",
                ].join(" ")}
              >
                <CountryFlag
                  teamId={item.teamId}
                  variant="inline"
                  className="aspect-[4/3] h-[1.1rem] w-[1.45rem] shrink-0"
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <TeamResultsCard
          teamId={activeTeamId}
          label={activeLabel}
          rows={activeRows}
          loading={loading}
          error={error}
          language={language}
          emptyLabel={m.predict.pastResultsEmpty}
          loadFailedLabel={m.predict.standingsLoadFailed}
          isMobile
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2 bg-white/10"
        aria-hidden
      />
      <div className="grid grid-cols-2 gap-x-5">
        <TeamResultsCard
          teamId={homeTeamId}
          label={homeDisplay}
          rows={homeRows}
          loading={loading}
          error={error}
          language={language}
          emptyLabel={m.predict.pastResultsEmpty}
          loadFailedLabel={m.predict.standingsLoadFailed}
        />
        <TeamResultsCard
          teamId={awayTeamId}
          label={awayDisplay}
          rows={awayRows}
          loading={loading}
          error={error}
          language={language}
          emptyLabel={m.predict.pastResultsEmpty}
          loadFailedLabel={m.predict.standingsLoadFailed}
        />
      </div>
    </div>
  );
}

function summarizeRecord(rows: readonly WcTeamPastResultRow[]): string {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const row of rows) {
    if (row.outcome === "W") wins += 1;
    else if (row.outcome === "D") draws += 1;
    else losses += 1;
  }
  return `${wins}-${draws}-${losses}`;
}

function TeamResultsCard({
  teamId,
  label,
  rows,
  loading,
  error,
  language,
  emptyLabel,
  loadFailedLabel,
  isMobile = false,
}: {
  teamId: string;
  label: string;
  rows: WcTeamPastResultRow[] | null;
  loading: boolean;
  error: string | null;
  language: Language;
  emptyLabel: string;
  loadFailedLabel: string;
  isMobile?: boolean;
}) {
  const web = !isMobile;
  const recordLabel = rows && rows.length > 0 ? summarizeRecord(rows) : null;

  return (
    <div
      className={[
        "overflow-hidden border border-white/10 bg-white/[0.025] rounded-none",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-2.5 border-b border-white/10 bg-white/[0.03]",
          web ? "px-3.5 py-3" : "px-2.5 py-2.5",
        ].join(" ")}
      >
        <CountryFlag
          teamId={teamId}
          variant="inline"
          className={
            web ? "aspect-[4/3] h-[1.5rem] w-[2rem] shrink-0" : "aspect-[4/3] h-[1.25rem] w-[1.7rem] shrink-0"
          }
        />
        <div className="min-w-0 flex-1 truncate font-bold text-white">
          {label}
        </div>
        {recordLabel ? (
          <span
            className={[
              "shrink-0 font-semibold tabular-nums text-white/45",
              web ? "text-sm" : "text-[11px]",
            ].join(" ")}
          >
            {recordLabel}
          </span>
        ) : null}
      </div>

      <div className={web ? "px-1 py-1" : "px-0.5 py-0.5"}>
        {loading || rows == null ? (
          <ResultsSkeleton isMobile={isMobile} />
        ) : error ? (
          <EmptyNote isMobile={isMobile}>{loadFailedLabel}</EmptyNote>
        ) : rows.length === 0 ? (
          <EmptyNote isMobile={isMobile}>{emptyLabel}</EmptyNote>
        ) : (
          <ul>
            {rows.map((row) => (
              <ResultRow
                key={`${teamId}-${row.gameId}`}
                row={row}
                language={language}
                isMobile={isMobile}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  row,
  language,
  isMobile,
}: {
  row: WcTeamPastResultRow;
  language: Language;
  isMobile: boolean;
}) {
  const opponentName =
    teamIdToCountryName(row.opponentTeamId, language === "ja" ? "ja" : "en") ??
    row.opponentTeamId;

  const outcomeStyle =
    row.outcome === "W"
      ? {
          row: "border-l-emerald-400/80 bg-emerald-400/[0.07]",
          score: "text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.72)]",
        }
      : row.outcome === "L"
        ? {
            row: "border-l-rose-400/80 bg-rose-400/[0.07]",
            score: "text-rose-300 drop-shadow-[0_0_12px_rgba(251,113,133,0.72)]",
          }
        : {
            row: "border-l-cyan-300/45 bg-cyan-300/[0.05]",
            score: "text-cyan-100/90 drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]",
          };

  return (
    <li
      className={[
        "flex items-center gap-2 border-b border-white/5 border-l-2 last:border-b-0",
        outcomeStyle.row,
        isMobile ? "px-2 py-2.5" : "px-3 py-3",
      ].join(" ")}
    >
      <span
        className={[
          "w-9 shrink-0 tabular-nums text-white/40",
          isMobile ? "text-[11px]" : "text-xs",
        ].join(" ")}
      >
        {formatWcPastResultDate(row.startAtMs, language === "ja" ? "ja" : "en")}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <CountryFlag
          teamId={row.opponentTeamId}
          variant="inline"
          className={
            isMobile
              ? "aspect-[4/3] h-[1.05rem] w-[1.4rem] shrink-0"
              : "aspect-[4/3] h-[1.2rem] w-[1.6rem] shrink-0"
          }
        />
        <span
          className={[
            "min-w-0 truncate font-semibold text-white/88",
            isMobile ? "text-[12px]" : "text-sm",
          ].join(" ")}
        >
          {opponentName}
        </span>
      </div>
      <span
        className={[
          matchScoreClass,
          "shrink-0 tabular-nums",
          outcomeStyle.score,
          isMobile ? "text-sm" : "text-base",
        ].join(" ")}
      >
        {row.goalsFor}–{row.goalsAgainst}
      </span>
    </li>
  );
}

function EmptyNote({
  children,
  isMobile = true,
}: {
  children: ReactNode;
  isMobile?: boolean;
}) {
  return (
    <div
      className={[
        "text-white/55",
        isMobile ? "px-3 py-4 text-[12px]" : "px-4 py-5 text-sm",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ResultsSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className={isMobile ? "space-y-1 px-2 py-2" : "space-y-1 px-2 py-2.5"}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={[
            "w-full skeleton-scan rounded-none bg-white/[0.04]",
            isMobile ? "h-10" : "h-11",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
