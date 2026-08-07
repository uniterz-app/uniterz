"use client";

import type { LiveGameStatsReport } from "@/lib/games/liveGameStats";
import { nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";

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

  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#e8edf5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#e8edf5";

  const colTemplate = `minmax(2.75rem,auto) repeat(${ls.periods.length}, minmax(0,1fr)) minmax(2.5rem,auto)`;

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
        {ls.home.map((v, i) => (
          <span
            key={`h-${ls.periods[i]}`}
            className={[
              nameOxanium.className,
              "text-center text-[15px] font-extrabold tabular-nums text-white/88",
            ].join(" ")}
            style={{ transform: "skewX(-6deg)" }}
          >
            {cell(v)}
          </span>
        ))}
        <span
          className={[
            nameOxanium.className,
            "text-center text-[16px] font-extrabold tabular-nums text-white",
          ].join(" ")}
          style={{ transform: "skewX(-6deg)" }}
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
        {ls.away.map((v, i) => (
          <span
            key={`a-${ls.periods[i]}`}
            className={[
              nameOxanium.className,
              "text-center text-[15px] font-extrabold tabular-nums text-white/88",
            ].join(" ")}
            style={{ transform: "skewX(-6deg)" }}
          >
            {cell(v)}
          </span>
        ))}
        <span
          className={[
            nameOxanium.className,
            "text-center text-[16px] font-extrabold tabular-nums text-white",
          ].join(" ")}
          style={{ transform: "skewX(-6deg)" }}
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
        backgroundColor: "transparent",
      }}
    >
      {body}
    </div>
  );
}

