"use client";

import type { LiveGameStatsReport } from "@/lib/games/liveGameStats";
import { nameOxanium } from "@/lib/fonts";
import { matchupTeamUiAccent } from "@/lib/team-colors";

type Props = {
  report: LiveGameStatsReport;
  /** true なら外枠カードなし（親カードに埋め込み） */
  embedded?: boolean;
};

function cell(v: number | null): string {
  return v == null ? "—" : String(v);
}

/** Web ラインスコア（Q1–Q4… + T） */
export default function LiveGameLineScorePanel({
  report,
  embedded = false,
}: Props) {
  const ls = report.lineScore;
  if (!ls || ls.periods.length === 0) return null;

  const homeColor = matchupTeamUiAccent(
    "nba",
    report.home.teamId,
    report.home.teamId,
    report.away.teamId
  );
  const awayColor = matchupTeamUiAccent(
    "nba",
    report.away.teamId,
    report.home.teamId,
    report.away.teamId
  );

  const homeWins = report.home.score > report.away.score;
  const awayWins = report.away.score > report.home.score;

  const colTemplate = `minmax(2.75rem,auto) repeat(${ls.periods.length}, minmax(0,1fr)) minmax(2.75rem,auto)`;

  const body = (
    <>
      <div
        className="grid items-center gap-x-1"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span className="min-w-0" />
        {ls.periods.map((p) => (
          <span
            key={p}
            className={[
              nameOxanium.className,
              "text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white/42",
            ].join(" ")}
          >
            {p}
          </span>
        ))}
        <span
          className={[
            nameOxanium.className,
            "text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white/55",
          ].join(" ")}
        >
          T
        </span>
      </div>

      <div
        className="mt-1.5 grid items-center gap-x-1 border-b border-white/[0.08] pb-1.5"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span
          className={[
            nameOxanium.className,
            "truncate text-[13px] font-extrabold uppercase tracking-[0.06em]",
          ].join(" ")}
          style={{ color: homeColor }}
        >
          {report.home.abbr}
        </span>
        {ls.home.map((v, i) => {
          const opp = ls.away[i];
          const wins =
            v != null && opp != null && Number.isFinite(v) && Number.isFinite(opp)
              ? v > opp
              : false;
          return (
            <span
              key={`h-${ls.periods[i]}`}
              className={[
                nameOxanium.className,
                "text-center text-[18px] font-extrabold tabular-nums",
              ].join(" ")}
              style={{
                color: wins ? homeColor : "rgba(255,255,255,0.88)",
                transform: "skewX(-6deg)",
              }}
            >
              {cell(v)}
            </span>
          );
        })}
        <span
          className={[
            nameOxanium.className,
            "text-center text-[19px] font-extrabold tabular-nums",
          ].join(" ")}
          style={{
            color: homeWins ? homeColor : "#fff",
            transform: "skewX(-6deg)",
          }}
        >
          {report.home.score}
        </span>
      </div>

      <div
        className="mt-1.5 grid items-center gap-x-1"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span
          className={[
            nameOxanium.className,
            "truncate text-[13px] font-extrabold uppercase tracking-[0.06em]",
          ].join(" ")}
          style={{ color: awayColor }}
        >
          {report.away.abbr}
        </span>
        {ls.away.map((v, i) => {
          const opp = ls.home[i];
          const wins =
            v != null && opp != null && Number.isFinite(v) && Number.isFinite(opp)
              ? v > opp
              : false;
          return (
            <span
              key={`a-${ls.periods[i]}`}
              className={[
                nameOxanium.className,
                "text-center text-[18px] font-extrabold tabular-nums",
              ].join(" ")}
              style={{
                color: wins ? awayColor : "rgba(255,255,255,0.88)",
                transform: "skewX(-6deg)",
              }}
            >
              {cell(v)}
            </span>
          );
        })}
        <span
          className={[
            nameOxanium.className,
            "text-center text-[19px] font-extrabold tabular-nums",
          ].join(" ")}
          style={{
            color: awayWins ? awayColor : "#fff",
            transform: "skewX(-6deg)",
          }}
        >
          {report.away.score}
        </span>
      </div>
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <div
      className="overflow-hidden border px-3 py-2.5"
      style={{
        borderColor: "rgba(255,255,255,0.22)",
        backgroundColor: "#000",
      }}
    >
      {body}
    </div>
  );
}
