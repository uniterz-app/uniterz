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

type Lang = "ja" | "en";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  /** "2025-26" など。未指定なら "2025-26" にフォールバック */
  season?: string | null;
  language: Lang;
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
  const isEn = language === "en";
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
        <SectionTitle isEn={isEn}>
          {group
            ? isEn
              ? `Group ${group.code}`
              : `グループ ${group.code}`
            : isEn
              ? "Group Standings"
              : "グループ順位"}
        </SectionTitle>

        {!group ? (
          <EmptyNote isEn={isEn}>
            {isEn
              ? "This match is not part of a defined group stage."
              : "この試合はグループステージ対象外です。"}
          </EmptyNote>
        ) : loading || rows == null ? (
          <SkeletonTable isMobile={isMobile} />
        ) : error ? (
          <EmptyNote isEn={isEn}>
            {isEn
              ? "Failed to load standings."
              : "順位表の取得に失敗しました。"}
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
        <SectionTitle isEn={isEn}>
          {isEn ? "FIFA World Ranking" : "FIFA ランキング"}
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
  isEn: boolean;
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
  isEn: boolean;
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
  language: Lang;
  isMobile: boolean;
}) {
  const isEn = language === "en";
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
            <th className="px-1 py-1.5 text-left">{isEn ? "Team" : "チーム"}</th>
            <th className="px-0.5 py-1.5 text-center">P</th>
            <th className="px-0.5 py-1.5 text-center">W</th>
            <th className="px-0.5 py-1.5 text-center">D</th>
            <th className="px-0.5 py-1.5 text-center">L</th>
            {!isMobile && (
              <th className="px-0.5 py-1.5 text-center">GD</th>
            )}
            <th className="px-1 py-1.5 text-center font-extrabold text-white/85">
              {isEn ? "Pts" : "勝点"}
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
                <td className="px-1 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <CountryFlag
                      teamId={r.teamId}
                      className="w-[1.5rem] h-[1rem] shrink-0"
                    />
                    <span
                      className={[
                        "truncate text-[12px] font-semibold",
                        highlighted ? "text-white" : "text-white/85",
                      ].join(" ")}
                    >
                      {teamIdToCountryName(r.teamId, language) ?? r.teamId}
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
  language: Lang;
}) {
  const isEn = language === "en";
  const home = getWcTeamProfile(homeTeamId);
  const away = getWcTeamProfile(awayTeamId);

  return (
    <div className="grid grid-cols-2 gap-2">
      <FifaRankCard
        teamId={homeTeamId}
        rank={home?.fifaRank}
        prevRank={home?.fifaRankPrev}
        sideLabel={isEn ? "HOME" : "ホーム"}
        language={language}
      />
      <FifaRankCard
        teamId={awayTeamId}
        rank={away?.fifaRank}
        prevRank={away?.fifaRankPrev}
        sideLabel={isEn ? "AWAY" : "アウェイ"}
        language={language}
      />
    </div>
  );
}

function FifaRankCard({
  teamId,
  rank,
  prevRank,
  sideLabel,
  language,
}: {
  teamId: string;
  rank: number | undefined;
  prevRank: number | undefined;
  sideLabel: string;
  language: Lang;
}) {
  const name = teamIdToCountryName(teamId, language) ?? teamId;
  const diff =
    rank != null && prevRank != null ? prevRank - rank : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="flex items-center gap-2">
        <CountryFlag teamId={teamId} className="w-[2rem] h-[1.35rem]" />
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/55">
            {sideLabel}
          </div>
          <div className="truncate text-[12px] font-bold text-white">
            {name}
          </div>
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
