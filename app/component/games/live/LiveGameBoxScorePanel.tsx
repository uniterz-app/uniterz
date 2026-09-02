"use client";

import { useMemo, useState } from "react";
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
  liveGameBoxColumnValues,
  liveGameBoxColumns,
  liveGameBoxHasAdvancedData,
  type LiveGameBoxScoreMode,
} from "@/lib/games/liveGameBoxScoreColumns";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  report: LiveGameStatsReport;
};

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
          "sticky left-0 z-[2] flex w-[11rem] shrink-0 items-center gap-1.5 border-r border-white/[0.08] bg-[rgba(12,14,20,0.98)] py-1.5 pr-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40",
        ].join(" ")}
      >
        <span className="w-7 text-center">#</span>
        <span className="min-w-0">Player</span>
        <span className="ml-0.5">Pos</span>
      </div>
    );
  }

  const p = player!;
  const asRoster: Pick<NbaRosterPlayer, "firstName" | "lastName"> = p;

  return (
    <div className="sticky left-0 z-[1] flex w-[11rem] shrink-0 items-center gap-1.5 border-r border-white/[0.08] bg-[rgba(8,10,16,0.98)] py-2 pr-1.5">
      <span
        className={[
          nameOxanium.className,
          "relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden border bg-transparent text-[11px] font-extrabold tabular-nums",
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
      <div className="flex min-w-0 items-center gap-1">
        <p
          className={[
            nameOxanium.className,
            "max-w-[6rem] truncate text-[13px] font-bold uppercase tracking-[0.03em] text-white",
          ].join(" ")}
          style={{ transform: "skewX(-6deg)" }}
        >
          {playerCardName(asRoster)}
        </p>
        <p
          className={[
            nameOxanium.className,
            "shrink-0 text-[11px] text-white/55",
          ].join(" ")}
        >
          {p.position}
        </p>
      </div>
    </div>
  );
}

function StatsCells({
  columns,
  values,
  header,
}: {
  columns: ReturnType<typeof liveGameBoxColumns>;
  values?: string[];
  header?: boolean;
}) {
  if (header) {
    return (
      <div
        className={[
          nameOxanium.className,
          "flex items-center gap-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40",
        ].join(" ")}
      >
        {columns.map((c) => (
          <span key={c.key} className="w-10 shrink-0 text-center">
            {c.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      {(values ?? []).map((v, i) => {
        const col = columns[i];
        if (!col) return null;
        return (
          <p
            key={col.key}
            className={[
              nameOxanium.className,
              "w-10 shrink-0 text-center text-[14px] font-extrabold tabular-nums",
              col.emphasis ? "text-white" : "text-white/78",
            ].join(" ")}
            style={{ transform: "skewX(-6deg)" }}
          >
            {v}
          </p>
        );
      })}
    </div>
  );
}

function TeamBoxCard({
  block,
  defaultOpen,
  mode,
}: {
  block: LiveGameBoxTeam;
  defaultOpen: boolean;
  mode: LiveGameBoxScoreMode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const teamPrimary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", block.teamId);
  const border = hexToRgba(teamPrimary, 0.55);
  const divider = hexToRgba(teamPrimary, 0.22);
  const sideLabel = block.side === "home" ? "HOME" : "AWAY";
  const players = sortBoxPlayers(block.players);
  const columns = liveGameBoxColumns(mode);

  return (
    <section
      className="overflow-hidden border bg-transparent"
      style={{ borderColor: border }}
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 transition-transform duration-200"
          style={{
            color: teamPrimary,
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
      </button>

      {open ? (
        <div className="overflow-x-auto">
          <div className="min-w-max px-2 pb-2">
            <div className="flex items-center border-b border-white/[0.06]">
              <IdentityCell accent={teamPrimary} header />
              <StatsCells columns={columns} header />
            </div>
            {players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center border-b border-white/[0.06] last:border-b-0"
              >
                <IdentityCell player={p} accent={teamPrimary} />
                <StatsCells
                  columns={columns}
                  values={liveGameBoxColumnValues(p, mode)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BoxScoreModeToggle({
  mode,
  onChange,
  advancedAvailable,
}: {
  mode: LiveGameBoxScoreMode;
  onChange: (mode: LiveGameBoxScoreMode) => void;
  advancedAvailable: boolean;
}) {
  const tabs: { id: LiveGameBoxScoreMode; label: string }[] = [
    { id: "basic", label: "BASIC" },
    { id: "advanced", label: "ADVANCED" },
  ];
  return (
    <div className="flex items-center justify-end gap-1.5">
      {tabs.map((tab) => {
        const active = mode === tab.id;
        const disabled = tab.id === "advanced" && !advancedAvailable;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={[
              nameOxanium.className,
              "rounded-[2px] border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] transition-colors",
              active
                ? "border-[#00F5FF] bg-[#00F5FF] text-[#050508]"
                : "border-white/25 bg-transparent text-white/55",
              disabled ? "cursor-not-allowed opacity-35" : "hover:border-white/45",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function LiveGameBoxScorePanel({ report }: Props) {
  const allPlayers = useMemo(
    () => [...report.box.home.players, ...report.box.away.players],
    [report.box.home.players, report.box.away.players]
  );
  const advancedAvailable = liveGameBoxHasAdvancedData(allPlayers);
  const [mode, setMode] = useState<LiveGameBoxScoreMode>("basic");

  return (
    <div className="space-y-2.5">
      <BoxScoreModeToggle
        mode={mode}
        onChange={setMode}
        advancedAvailable={advancedAvailable}
      />
      <div className="space-y-3">
        <TeamBoxCard block={report.box.home} defaultOpen mode={mode} />
        <TeamBoxCard block={report.box.away} defaultOpen={false} mode={mode} />
      </div>
    </div>
  );
}
