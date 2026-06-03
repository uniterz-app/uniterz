"use client";

import { useMemo } from "react";
import CountryFlag from "@/app/component/games/CountryFlag";
import {
  computeGroupStandings,
  type WcStandingRow,
} from "@/lib/wc/computeGroupStandings";
import { getWcGroupForTeam } from "@/lib/wc/groups";
import { getWcTeamProfile } from "@/lib/wc/teams";
import { useWcSeasonGames } from "@/lib/wc/useWcSeasonGames";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  /** "2025-26" など。未指定なら "2025-26" にフォールバック */
  season?: string | null;
  language: Language;
  isMobile: boolean;
};

const DEFAULT_SEASON = "2025-26";

export default function WcStandingPanel({
  homeTeamId,
  awayTeamId,
  season,
  language,
  isMobile,
}: Props) {
  const m = t(language);
  const effectiveSeason = season ?? DEFAULT_SEASON;
  const group = useMemo(() => {
    return (
      getWcGroupForTeam(homeTeamId) ?? getWcGroupForTeam(awayTeamId) ?? null
    );
  }, [homeTeamId, awayTeamId]);

  const { games, loading, error } = useWcSeasonGames(effectiveSeason);

  const rows: WcStandingRow[] | null = useMemo(() => {
    if (!group) return null;
    if (games == null) return null;
    return computeGroupStandings(group.teamIds, games);
  }, [group, games]);

  const highlightSet = useMemo(
    () => new Set([homeTeamId, awayTeamId]),
    [homeTeamId, awayTeamId],
  );

  return (
    <div className="space-y-3">
      {/* グループ順位表 */}
      <section>
        <SectionTitle>
          {group
            ? `${m.wc.group} ${group.code}`
            : m.predict.groupStandings}
        </SectionTitle>

        {!group ? (
          <EmptyNote>
            {m.predict.standingsNotAvailable}
          </EmptyNote>
        ) : loading || rows == null ? (
          <SkeletonTable isMobile={isMobile} />
        ) : error ? (
          <EmptyNote>
            {m.predict.standingsLoadFailed}
          </EmptyNote>
        ) : (
          <StandingsTable
            rows={rows}
            highlightSet={highlightSet}
            language={language}
            isMobile={isMobile}
          />
        )}
      </section>

      {/* FIFA ランク比較 */}
      <section>
        <SectionTitle>
          {m.predict.fifaRanking}
        </SectionTitle>
        <FifaRankCompare
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          language={language}
        />
      </section>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
      {children}
    </div>
  );
}

function EmptyNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 px-3 py-3 text-[12px] text-white/65">
      {children}
    </div>
  );
}

function StandingsTable({
  rows,
  highlightSet,
  language,
  isMobile,
}: {
  rows: WcStandingRow[];
  highlightSet: Set<string>;
  language: Language;
  isMobile: boolean;
}) {
  const m = t(language);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <table className="w-full table-fixed border-collapse text-[12px] text-white/85">
        <colgroup>
          <col className="w-[28px]" />
          <col />
          <col className="w-[28px]" />
          <col className="w-[24px]" />
          <col className="w-[24px]" />
          <col className="w-[24px]" />
          {!isMobile && <col className="w-[40px]" />}
          <col className="w-[34px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
            <th className="px-1.5 py-1.5 text-left">#</th>
            <th className="px-1 py-1.5 text-left">{m.predict.team}</th>
            <th className="px-0.5 py-1.5 text-center">P</th>
            <th className="px-0.5 py-1.5 text-center">W</th>
            <th className="px-0.5 py-1.5 text-center">D</th>
            <th className="px-0.5 py-1.5 text-center">L</th>
            {!isMobile && (
              <th className="px-0.5 py-1.5 text-center">GD</th>
            )}
            <th className="px-1 py-1.5 text-center font-extrabold text-white/85">
              {m.wc.wcPoints}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const highlighted = highlightSet.has(r.teamId);
            return (
              <tr
                key={r.teamId}
                className={[
                  "border-b border-white/5 last:border-b-0",
                  highlighted ? "bg-cyan-300/8" : "",
                ].join(" ")}
              >
                <td className="px-1.5 py-1.5 text-left text-white/55 tabular-nums">
                  {idx + 1}
                </td>
                <td className="overflow-visible px-1 py-1.5">
                  <div className="flex items-center gap-1.5 overflow-visible">
                    <CountryFlag
                      teamId={r.teamId}
                      variant="inline"
                    />
                    <span
                      className={[
                        "truncate text-[12px] font-semibold",
                        highlighted ? "text-white" : "text-white/85",
                      ].join(" ")}
                    >
                      {teamIdToCountryName(r.teamId, language === "ja" ? "ja" : "en") ?? r.teamId}
                    </span>
                  </div>
                </td>
                <td className="px-0.5 py-1.5 text-center tabular-nums">
                  {r.played}
                </td>
                <td className="px-0.5 py-1.5 text-center tabular-nums">
                  {r.wins}
                </td>
                <td className="px-0.5 py-1.5 text-center tabular-nums">
                  {r.draws}
                </td>
                <td className="px-0.5 py-1.5 text-center tabular-nums">
                  {r.losses}
                </td>
                {!isMobile && (
                  <td
                    className={[
                      "px-0.5 py-1.5 text-center tabular-nums",
                      r.goalDiff > 0
                        ? "text-emerald-300/85"
                        : r.goalDiff < 0
                          ? "text-rose-300/85"
                          : "text-white/65",
                    ].join(" ")}
                  >
                    {formatGoalDiff(r.goalDiff)}
                  </td>
                )}
                <td className="px-1 py-1.5 text-center font-extrabold tabular-nums text-white">
                  {r.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonTable({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.025] p-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-6 w-full animate-pulse rounded-md bg-white/[0.05]"
          style={{ opacity: isMobile ? 0.7 : 1 }}
        />
      ))}
    </div>
  );
}

function formatGoalDiff(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function FifaRankCompare({
  homeTeamId,
  awayTeamId,
  language,
}: {
  homeTeamId: string;
  awayTeamId: string;
  language: Language;
}) {
  const home = getWcTeamProfile(homeTeamId);
  const away = getWcTeamProfile(awayTeamId);

  return (
    <div className="grid grid-cols-2 gap-2">
      <FifaRankCard
        teamId={homeTeamId}
        rank={home?.fifaRank}
        prevRank={home?.fifaRankPrev}
        language={language}
      />
      <FifaRankCard
        teamId={awayTeamId}
        rank={away?.fifaRank}
        prevRank={away?.fifaRankPrev}
        language={language}
      />
    </div>
  );
}

function FifaRankCard({
  teamId,
  rank,
  prevRank,
  language,
}: {
  teamId: string;
  rank: number | undefined;
  prevRank: number | undefined;
  language: Language;
}) {
  const name = teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ?? teamId;
  const diff =
    rank != null && prevRank != null ? prevRank - rank : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="flex items-center gap-2">
        <CountryFlag
          teamId={teamId}
          variant="inline"
          className="h-[1.5rem] w-[2rem]"
        />
        <div className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">
          {name}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          FIFA
        </span>
        <span className="text-2xl font-extrabold tabular-nums text-white">
          {rank != null ? `#${rank}` : "—"}
        </span>
        {diff != null && diff !== 0 ? (
          <span
            className={[
              "ml-auto text-[11px] font-bold",
              diff > 0 ? "text-emerald-400" : "text-rose-400",
            ].join(" ")}
          >
            {diff > 0 ? "▲" : "▼"}
            {Math.abs(diff)}
          </span>
        ) : diff === 0 ? (
          <span className="ml-auto text-[11px] text-white/45">—</span>
        ) : null}
      </div>
    </div>
  );
}
