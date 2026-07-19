"use client";

import { useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import {
  playerCardName,
  type NbaRosterPlayer,
} from "@/lib/predict/nbaRoster";
import type {
  LiveGameBoxPlayer,
  LiveGameBoxTeam,
  LiveGameStatsReport,
} from "@/lib/games/liveGameStats";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  report: LiveGameStatsReport;
};

const BOX_COLS = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TO" },
  { key: "fg", label: "FG" },
  { key: "fg3", label: "3P" },
  { key: "ft", label: "FT" },
  { key: "pm", label: "+/-" },
] as const;

const EMPHASIS = new Set(["pts", "fg", "fg3"]);

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function sortBoxPlayers(players: LiveGameBoxPlayer[]): LiveGameBoxPlayer[] {
  return [...players].sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.min - a.min;
  });
}

function boxValues(p: LiveGameBoxPlayer): string[] {
  const pm = p.plusMinus;
  return [
    String(p.min),
    String(p.pts),
    String(p.reb),
    String(p.ast),
    String(p.stl),
    String(p.blk),
    String(p.tov),
    p.fg,
    p.fg3,
    p.ft,
    pm > 0 ? `+${pm}` : String(pm),
  ];
}

function IdentityCell({
  player,
  accent,
  header,
}: {
  player?: LiveGameBoxPlayer;
  accent: string;
  header?: boolean;
}) {
  if (header) {
    return (
      <div
        className={[
          nameOxanium.className,
          "sticky left-0 z-[2] flex w-[9.75rem] shrink-0 items-center gap-1 border-r border-white/[0.08] bg-[rgba(12,14,20,0.98)] py-1 pr-1 text-[7px] font-bold uppercase tracking-[0.12em] text-white/40",
        ].join(" ")}
      >
        <span className="w-6 text-center">#</span>
        <span className="min-w-0">Player</span>
        <span className="ml-0.5">Pos</span>
      </div>
    );
  }

  const p = player!;
  const asRoster: Pick<NbaRosterPlayer, "firstName" | "lastName"> = p;

  return (
    <div className="sticky left-0 z-[1] flex w-[9.75rem] shrink-0 items-center gap-1 border-r border-white/[0.08] bg-[rgba(8,10,16,0.98)] py-1.5 pr-1">
      <span
        className={[
          nameOxanium.className,
          "relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden border bg-transparent text-[9px] font-extrabold tabular-nums",
        ].join(" ")}
        style={{ borderColor: accent, color: accent }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.08) 2px,
              rgba(255, 255, 255, 0.08) 3px
            )`,
          }}
        />
        <span className="relative z-[1]">{p.jerseyNumber}</span>
      </span>
      <div className="flex min-w-0 items-center gap-0.5">
        <p
          className={[
            nameOxanium.className,
            "max-w-[5.25rem] truncate text-[11px] font-bold uppercase tracking-[0.03em] text-white",
          ].join(" ")}
        >
          {playerCardName(asRoster)}
        </p>
        <p
          className={[
            resultStatsMetricNumClass,
            "shrink-0 text-[10px] text-white/55",
          ].join(" ")}
        >
          {p.position}
        </p>
      </div>
    </div>
  );
}

function StatsCells({
  values,
  header,
}: {
  values?: string[];
  header?: boolean;
}) {
  if (header) {
    return (
      <div
        className={[
          nameOxanium.className,
          "flex items-center gap-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40",
        ].join(" ")}
      >
        {BOX_COLS.map((c) => (
          <span key={c.key} className="w-9 shrink-0 text-center">
            {c.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 py-1.5">
      {(values ?? []).map((v, i) => (
        <p
          key={BOX_COLS[i]!.key}
          className={[
            resultStatsMetricNumClass,
            "w-9 shrink-0 text-center text-[12px] tabular-nums",
            EMPHASIS.has(BOX_COLS[i]!.key) ? "text-white" : "text-white/78",
          ].join(" ")}
        >
          {v}
        </p>
      ))}
    </div>
  );
}

function Chevron({ open, accent }: { open: boolean; accent: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 transition-transform duration-200"
      style={{
        color: accent,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeamBoxCard({
  block,
  defaultOpen,
}: {
  block: LiveGameBoxTeam;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const teamPrimary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", block.teamId);
  const border = hexToRgba(teamPrimary, 0.55);
  const fill = hexToRgba(teamPrimary, 0.05);
  const divider = hexToRgba(teamPrimary, 0.22);
  const sideLabel = block.side === "home" ? "HOME" : "AWAY";
  const players = sortBoxPlayers(block.players);

  return (
    <section
      className="overflow-hidden rounded-lg border bg-[rgba(8,10,16,0.94)]"
      style={{
        borderColor: border,
        background: `linear-gradient(165deg, ${fill} 0%, rgba(8,10,16,0.96) 50%)`,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.03]"
        style={{ borderBottom: open ? `1px solid ${divider}` : undefined }}
      >
        <HalftoneJerseyMark
          accent={teamPrimary}
          accentEnd={jerseySecondary}
          className="h-9 w-9 shrink-0"
          glow="none"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={[
                nameOxanium.className,
                "rounded-[2px] border bg-transparent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em]",
              ].join(" ")}
              style={{ borderColor: teamPrimary, color: teamPrimary }}
            >
              {sideLabel}
            </span>
            <p
              className={[
                nameOxanium.className,
                "min-w-0 truncate text-[12px] font-extrabold uppercase tracking-[0.06em] text-white",
              ].join(" ")}
            >
              {block.teamName}
            </p>
          </div>
        </div>
        <Chevron open={open} accent={teamPrimary} />
      </button>

      {open ? (
        <div className="overflow-x-auto">
          <div className="min-w-max px-2 pb-2">
            <div className="flex items-center border-b border-white/[0.06]">
              <IdentityCell accent={teamPrimary} header />
              <StatsCells header />
            </div>
            {players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center border-b border-white/[0.06] last:border-b-0"
              >
                <IdentityCell player={p} accent={teamPrimary} />
                <StatsCells values={boxValues(p)} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function LiveGameBoxScorePanel({ report }: Props) {
  return (
    <div className="space-y-3">
      <TeamBoxCard block={report.box.home} defaultOpen />
      <TeamBoxCard block={report.box.away} defaultOpen={false} />
    </div>
  );
}
