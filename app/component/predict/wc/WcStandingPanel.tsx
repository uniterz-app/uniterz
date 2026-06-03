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

  const web = !isMobile;

  return (
    <div className={web ? "space-y-4" : "space-y-3"}>
      {/* グループ順位表 */}
      <section>
        <SectionTitle isMobile={isMobile}>
          {group
            ? `${m.wc.group} ${group.code}`
            : m.predict.groupStandings}
        </SectionTitle>

        {!group ? (
          <EmptyNote isMobile={isMobile}>
            {m.predict.standingsNotAvailable}
          </EmptyNote>
        ) : loading || rows == null ? (
          <SkeletonTable isMobile={isMobile} />
        ) : error ? (
          <EmptyNote isMobile={isMobile}>
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
        <SectionTitle isMobile={isMobile}>
          {m.predict.fifaRanking}
        </SectionTitle>
        <FifaRankCompare
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          language={language}
          isMobile={isMobile}
        />
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  isMobile = true,
}: {
  children: React.ReactNode;
  isMobile?: boolean;
}) {
  return (
    <div
      className={[
        "mb-1.5 font-bold uppercase tracking-[0.18em] text-white/55",
        isMobile ? "text-[11px]" : "text-sm",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function EmptyNote({
  children,
  isMobile = true,
}: {
  children: React.ReactNode;
  isMobile?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/3 text-white/65",
        isMobile ? "px-3 py-3 text-[12px]" : "px-4 py-3.5 text-sm",
      ].join(" ")}
    >
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
  const web = !isMobile;
  const thCell = web ? "px-2 py-2.5" : "px-1.5 py-1.5";
  const numCell = web ? "px-2 py-2.5 text-center tabular-nums" : "px-0.5 py-1.5 text-center tabular-nums";

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]",
        web ? "rounded-2xl" : "",
      ].join(" ")}
    >
      <table
        className={[
          "w-full table-fixed border-collapse text-white/85",
          web ? "text-base" : "text-[12px]",
        ].join(" ")}
      >
        <colgroup>
          <col className={web ? "w-[40px]" : "w-[28px]"} />
          <col />
          <col className={web ? "w-[40px]" : "w-[28px]"} />
          <col className={web ? "w-[36px]" : "w-[24px]"} />
          <col className={web ? "w-[36px]" : "w-[24px]"} />
          <col className={web ? "w-[36px]" : "w-[24px]"} />
          {!isMobile && <col className={web ? "w-[52px]" : "w-[40px]"} />}
          <col className={web ? "w-[48px]" : "w-[34px]"} />
        </colgroup>
        <thead>
          <tr
            className={[
              "border-b border-white/10 bg-white/[0.02] font-bold uppercase tracking-[0.12em] text-white/50",
              web ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            <th className={`${thCell} text-left`}>#</th>
            <th className={`${thCell} text-left`}>{m.predict.team}</th>
            <th className={`${numCell}`}>P</th>
            <th className={`${numCell}`}>W</th>
            <th className={`${numCell}`}>D</th>
            <th className={`${numCell}`}>L</th>
            {!isMobile && <th className={`${numCell}`}>GD</th>}
            <th
              className={`${numCell} font-extrabold text-white/90`}
            >
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
                <td
                  className={[
                    web ? "px-2 py-2.5" : "px-1.5 py-1.5",
                    "text-left tabular-nums text-white/55",
                  ].join(" ")}
                >
                  {idx + 1}
                </td>
                <td
                  className={[
                    "overflow-visible text-left",
                    web ? "px-2 py-2.5" : "px-1 py-1.5",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex items-center overflow-visible",
                      web ? "gap-2.5" : "gap-1.5",
                    ].join(" ")}
                  >
                    <CountryFlag
                      teamId={r.teamId}
                      variant="inline"
                      className={
                        web ? "h-[1.6rem] w-[2.15rem]" : undefined
                      }
                    />
                    <span
                      className={[
                        "truncate font-semibold",
                        web ? "text-base" : "text-[12px]",
                        highlighted ? "text-white" : "text-white/85",
                      ].join(" ")}
                    >
                      {teamIdToCountryName(r.teamId, language === "ja" ? "ja" : "en") ?? r.teamId}
                    </span>
                  </div>
                </td>
                <td className={numCell}>{r.played}</td>
                <td className={numCell}>{r.wins}</td>
                <td className={numCell}>{r.draws}</td>
                <td className={numCell}>{r.losses}</td>
                {!isMobile && (
                  <td
                    className={[
                      numCell,
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
                <td
                  className={`${numCell} font-extrabold text-white`}
                >
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
  const web = !isMobile;
  return (
    <div
      className={[
        "space-y-1.5 rounded-xl border border-white/10 bg-white/[0.025]",
        web ? "space-y-2 p-3" : "p-2",
      ].join(" ")}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={[
            "w-full animate-pulse rounded-md bg-white/[0.05]",
            web ? "h-9" : "h-6",
          ].join(" ")}
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
  isMobile,
}: {
  homeTeamId: string;
  awayTeamId: string;
  language: Language;
  isMobile: boolean;
}) {
  const home = getWcTeamProfile(homeTeamId);
  const away = getWcTeamProfile(awayTeamId);
  const web = !isMobile;

  return (
    <div className={web ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-2"}>
      <FifaRankCard
        teamId={homeTeamId}
        rank={home?.fifaRank}
        prevRank={home?.fifaRankPrev}
        language={language}
        web={web}
      />
      <FifaRankCard
        teamId={awayTeamId}
        rank={away?.fifaRank}
        prevRank={away?.fifaRankPrev}
        language={language}
        web={web}
      />
    </div>
  );
}

function FifaRankCard({
  teamId,
  rank,
  prevRank,
  language,
  web = false,
}: {
  teamId: string;
  rank: number | undefined;
  prevRank: number | undefined;
  language: Language;
  web?: boolean;
}) {
  const name = teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ?? teamId;
  const diff =
    rank != null && prevRank != null ? prevRank - rank : null;

  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/[0.025]",
        web ? "p-3.5" : "p-2.5",
      ].join(" ")}
    >
      <div className={web ? "flex items-center gap-2.5" : "flex items-center gap-2"}>
        <CountryFlag
          teamId={teamId}
          variant="inline"
          className={web ? "h-[1.75rem] w-[2.35rem]" : "h-[1.5rem] w-[2rem]"}
        />
        <div
          className={[
            "min-w-0 flex-1 truncate font-bold text-white",
            web ? "text-sm" : "text-[12px]",
          ].join(" ")}
        >
          {name}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={[
            "font-semibold uppercase tracking-wider text-white/55",
            web ? "text-xs" : "text-[11px]",
          ].join(" ")}
        >
          FIFA
        </span>
        <span
          className={[
            "font-extrabold tabular-nums text-white",
            web ? "text-3xl" : "text-2xl",
          ].join(" ")}
        >
          {rank != null ? `#${rank}` : "—"}
        </span>
        {diff != null && diff !== 0 ? (
          <span
            className={[
              "ml-auto font-bold",
              web ? "text-xs" : "text-[11px]",
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
