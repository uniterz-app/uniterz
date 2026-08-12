"use client";

import { useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import {
  playerCardName,
  sortRosterPlayers,
  type NbaRosterPlayer,
  type NbaRosterReport,
  type NbaRosterTeamBlock,
} from "@/lib/predict/nbaRoster";
import {
  injuryStatusByPlayerId,
  injuryStatusLabel,
  injuryStatusTone,
  type NbaInjuryReport,
} from "@/lib/predict/nbaInjuryReport";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  report: NbaRosterReport;
  /** Injury Report 由来。該当選手にステータスチップを出す */
  injuryReport?: NbaInjuryReport | null;
  className?: string;
};

const INJURY_CHIP: Record<string, string> = {
  out: "border-[#FF2D78]/70 bg-[#FF2D78]/20 text-[#FF8AB4]",
  doubt: "border-[#FF8A3D]/70 bg-[#FF8A3D]/18 text-[#FFB07A]",
  question: "border-[#F5C518]/70 bg-[#F5C518]/15 text-[#F5C518]",
  probable: "border-[#00E5FF]/60 bg-[#00E5FF]/12 text-[#00E5FF]",
  available: "border-[#2DFF6E]/50 bg-[#2DFF6E]/10 text-[#2DFF6E]",
  neutral: "border-white/25 bg-white/8 text-white/60",
};

const STAT_COLS = [
  { key: "gp", label: "GP" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "fg", label: "FG%" },
  { key: "fgm", label: "FGM" },
  { key: "fga", label: "FGA" },
  { key: "fg3", label: "3P%" },
  { key: "fg3m", label: "3PM" },
  { key: "fg3a", label: "3PA" },
  { key: "ft", label: "FT%" },
  { key: "ftm", label: "FTM" },
  { key: "fta", label: "FTA" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TO" },
] as const;

const EMPHASIS_KEYS = new Set(["pts", "fg", "fg3", "fga", "fg3a"]);

function teamFullLabel(teamId: string, fallback: string): string {
  return (NBA_TEAM_NAME_BY_ID[teamId] ?? fallback).toUpperCase();
}

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}

function fmt(n: number | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

/** 0–1 は ×100。すでに % ならそのまま */
function fmtPct(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const pct = n <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}`;
}

function InjuryChip({ status }: { status: string }) {
  const tone = injuryStatusTone(status);
  return (
    <span
      className={[
        nameOxanium.className,
        "shrink-0 rounded-[2px] border px-1 py-px text-[6px] font-extrabold uppercase tracking-[0.04em]",
        INJURY_CHIP[tone] ?? INJURY_CHIP.neutral,
      ].join(" ")}
    >
      {injuryStatusLabel(status)}
    </span>
  );
}

function playerStats(player: NbaRosterPlayer): string[] {
  return [
    String(player.gp),
    fmt(player.mpg),
    fmt(player.ppg),
    fmt(player.rpg),
    fmt(player.apg),
    fmtPct(player.fgPct),
    fmt(player.fgm),
    fmt(player.fga),
    fmtPct(player.fg3Pct),
    fmt(player.fg3m),
    fmt(player.fg3a),
    fmtPct(player.ftPct),
    fmt(player.ftm),
    fmt(player.fta),
    fmt(player.spg),
    fmt(player.bpg),
    fmt(player.tpg),
  ];
}

function IdentityCell({
  player,
  accent,
  injuryStatus,
  dim,
  header,
  onClick,
}: {
  player?: NbaRosterPlayer;
  accent: string;
  injuryStatus?: string;
  dim?: boolean;
  header?: boolean;
  onClick?: () => void;
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
  const jersey = p.jerseyNumber?.replace(/^#/, "") ?? "—";
  const stroke = dim ? "rgba(255,255,255,0.35)" : accent;
  const className = [
    "sticky left-0 z-[1] flex w-[9.75rem] shrink-0 items-center gap-1 border-r border-white/[0.08] bg-[rgba(8,10,16,0.98)] py-1.5 pr-1 text-left",
    dim ? "opacity-45" : "",
    onClick ? "transition-colors hover:bg-white/[0.06]" : "",
  ].join(" ");

  const content = (
    <>
      <span
        className={[
          nameOxanium.className,
          "relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden border bg-transparent text-[9px] font-extrabold tabular-nums",
        ].join(" ")}
        style={{
          borderColor: stroke,
          color: stroke,
        }}
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
        <span className="relative z-[1]">{jersey}</span>
      </span>
      <div className="flex min-w-0 items-center gap-0.5">
        <p
          className={[
            nameOxanium.className,
            "max-w-[5.25rem] truncate text-[11px] font-bold uppercase tracking-[0.03em] text-white",
          ].join(" ")}
        >
          {playerCardName(p)}
        </p>
        <p
          className={[
            resultStatsMetricNumClass,
            "shrink-0 text-[10px] text-white/55",
          ].join(" ")}
        >
          {p.position}
        </p>
        {injuryStatus ? <InjuryChip status={injuryStatus} /> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function StatsCells({
  values,
  header,
  dim,
}: {
  values?: string[];
  header?: boolean;
  dim?: boolean;
}) {
  if (header) {
    return (
      <div
        className={[
          nameOxanium.className,
          "flex items-center gap-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40",
        ].join(" ")}
      >
        {STAT_COLS.map((c) => (
          <span key={c.key} className="w-9 shrink-0 text-center">
            {c.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={["flex items-center gap-1.5 py-1.5", dim ? "opacity-45" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {(values ?? []).map((v, i) => (
        <p
          key={STAT_COLS[i]!.key}
          className={[
            resultStatsMetricNumClass,
            "w-9 shrink-0 text-center text-[12px] tabular-nums",
            EMPHASIS_KEYS.has(STAT_COLS[i]!.key) ? "text-white" : "text-white/78",
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

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function TeamRosterCard({
  block,
  injuryById,
  defaultOpen,
  mode = "matchup",
  onPlayerClick,
}: {
  block: NbaRosterTeamBlock;
  injuryById: Record<string, string>;
  defaultOpen: boolean;
  mode?: "matchup" | "detail";
  onPlayerClick?: (player: NbaRosterPlayer) => void;
}) {
  const isDetail = mode === "detail";
  const [open, setOpen] = useState(defaultOpen || isDetail);
  const sideLabel = block.side === "home" ? "HOME" : "AWAY";
  const players = sortRosterPlayers(block.players);
  const abbr = teamAbbr(block.teamId);
  const title = teamFullLabel(block.teamId, block.teamName);
  const footerLeft = isDetail
    ? "ROSTER SCAN…"
    : block.side === "home"
      ? "ACTIVE SCANNING…"
      : "ANALYZING ROSTER DATA…";
  const refCode = isDetail
    ? `REF: ${abbr}-ROSTER`
    : `REF: ${abbr}-24-${block.side === "home" ? "H" : "A"}`;
  const teamPrimary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", block.teamId);
  const border = hexToRgba(teamPrimary, 0.55);
  const fill = hexToRgba(teamPrimary, 0.05);
  const divider = hexToRgba(teamPrimary, 0.22);
  const expanded = isDetail ? true : open;

  const headerInner = (
    <>
      <HalftoneJerseyMark
        accent={teamPrimary}
        accentEnd={jerseySecondary}
        className="h-9 w-9 shrink-0"
        glow="none"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isDetail ? (
            <span
              className={[
                nameOxanium.className,
                "rounded-[2px] border bg-transparent px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em]",
              ].join(" ")}
              style={{
                borderColor: teamPrimary,
                color: teamPrimary,
              }}
            >
              {sideLabel}
            </span>
          ) : null}
          <p
            className={[
              nameOxanium.className,
              "min-w-0 truncate text-[12px] font-extrabold uppercase tracking-[0.06em] text-white",
            ].join(" ")}
          >
            {title}
          </p>
        </div>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[8px] font-bold uppercase tracking-[0.1em]",
          ].join(" ")}
          style={{ color: hexToRgba(teamPrimary, 0.9) }}
        >
          AVAILABILITY: {block.activeCount}/{block.rosterCount} ACTIVE
        </p>
      </div>
      {block.seed != null ? (
        <div className="shrink-0 text-right">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/35">
            SEED
          </p>
          <p
            className={[
              nameOxanium.className,
              "text-[18px] font-black leading-none",
            ].join(" ")}
            style={{ color: teamPrimary }}
          >
            #{block.seed}
          </p>
        </div>
      ) : null}
      {!isDetail ? <Chevron open={open} accent={teamPrimary} /> : null}
    </>
  );

  return (
    <section
      className="overflow-hidden rounded-lg border bg-[rgba(8,10,16,0.94)]"
      style={{
        borderColor: border,
        background: `linear-gradient(165deg, ${fill} 0%, rgba(8,10,16,0.96) 50%)`,
      }}
    >
      {isDetail ? (
        <div
          className="flex w-full items-center gap-2 px-2.5 py-2"
          style={{ borderBottom: expanded ? `1px solid ${divider}` : undefined }}
        >
          {headerInner}
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.03]"
          style={{ borderBottom: open ? `1px solid ${divider}` : undefined }}
        >
          {headerInner}
        </button>
      )}

      {expanded ? (
        <>
          <div className="overflow-x-auto pl-1.5 pr-2.5 pb-1.5 pt-1">
            <div className="min-w-max">
              <div className="mb-0.5 flex items-center rounded-[2px] bg-white/[0.04] pr-1">
                <IdentityCell accent={teamPrimary} header />
                <StatsCells header />
              </div>

              {players.map((p) => (
                <div
                  key={String(p.id)}
                  className="flex items-center border-b border-white/[0.06] last:border-b-0"
                >
                  <IdentityCell
                    player={p}
                    accent={teamPrimary}
                    injuryStatus={injuryById[String(p.id)]}
                    dim={p.dimmed}
                    onClick={
                      onPlayerClick
                        ? () => onPlayerClick(p)
                        : undefined
                    }
                  />
                  <StatsCells values={playerStats(p)} dim={p.dimmed} />
                </div>
              ))}
            </div>
          </div>

          <footer
            className="flex items-center justify-between gap-2 border-t px-2.5 py-1.5"
            style={{ borderColor: hexToRgba(teamPrimary, 0.35) }}
          >
            <p
              className={[
                nameOxanium.className,
                "text-[7px] font-bold uppercase tracking-[0.14em]",
              ].join(" ")}
              style={{ color: hexToRgba(teamPrimary, 0.85) }}
            >
              {footerLeft}
            </p>
            <p
              className={[
                nameOxanium.className,
                "text-[7px] font-bold uppercase tracking-[0.1em] text-white/35",
              ].join(" ")}
            >
              {refCode}
            </p>
          </footer>
        </>
      ) : null}
    </section>
  );
}

/** Team Detail 用 — 常時展開・選手タップで詳細へ */
export function NbaTeamRosterCard({
  block,
  injuryById = {},
  onPlayerClick,
}: {
  block: NbaRosterTeamBlock;
  injuryById?: Record<string, string>;
  onPlayerClick?: (player: NbaRosterPlayer) => void;
}) {
  return (
    <TeamRosterCard
      block={block}
      injuryById={injuryById}
      defaultOpen
      mode="detail"
      onPlayerClick={onPlayerClick}
    />
  );
}

/** NBA 予想ツール — Roster（チーム開閉 / スタッツ横スクロール） */
export default function NbaRosterPanel({
  report,
  injuryReport = null,
  className,
}: Props) {
  const injuryById = injuryReport
    ? injuryStatusByPlayerId(injuryReport)
    : {};

  return (
    <div className={["flex flex-col gap-2.5", className].filter(Boolean).join(" ")}>
      <TeamRosterCard
        block={report.home}
        injuryById={injuryById}
        defaultOpen
      />
      <TeamRosterCard
        block={report.away}
        injuryById={injuryById}
        defaultOpen={false}
      />
    </div>
  );
}
