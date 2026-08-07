"use client";

import { useMemo, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import CountryFlag from "@/app/component/games/CountryFlag";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import {
  averageRecentGameLogs,
  ageFromBirthDate,
  availabilityStatusColor,
  formatAvailabilityStatus,
  formatBirthDateLabel,
  formatContractSeasonLabel,
  formatFgLine,
  formatPhysique,
  formatSalaryUsd,
  formatTeamHistory,
  getNbaPlayerDetailPreview,
  nbaCountryNameToIso2,
  type NbaPlayerGameLog,
  type NbaPlayerShotZone,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  SHOT_ZONE_BASKET,
  SHOT_ZONE_GLOW_R,
  SHOT_ZONE_LABEL_POS,
  SHOT_ZONE_PAINT,
  SHOT_ZONE_RA_R,
  SHOT_ZONE_VB_H,
  SHOT_ZONE_VB_MIN_Y,
  SHOT_ZONE_VB_W,
  formatShotZoneMakes,
  shotCourtFreeThrowCirclePath,
  shotCourtTop,
  shotZonePathAboveBreak3Fill,
  shotZonePathLeftCorner3,
  shotZonePathMidRange,
  shotZonePathPaint,
  shotZonePathRightCorner3,
  shotZoneThreePointLine,
  shotZoneViewBox,
  zoneEfficiencyColor,
  zoneFgPctColor,
} from "@/lib/predict/nbaShotZoneCourtGeometry";

type Props = {
  playerId?: string;
  language?: "ja" | "en";
};

function formatDraftHero(
  year: number | null,
  round: number | null,
  number: number | null
): string {
  if (year == null) return "—";
  const pick = number != null ? `#${number}` : "—";
  const r = round != null ? `R${round}` : "";
  return r ? `${year} ${r} ${pick}` : `${year} ${pick}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(124,255,107,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(124,255,107,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

function zoneById(
  zones: NbaPlayerShotZone[],
  id: NbaPlayerShotZone["id"]
): NbaPlayerShotZone | undefined {
  return zones.find((z) => z.id === id);
}

function ShotZoneHeat({
  zones,
  accent,
}: {
  zones: NbaPlayerShotZone[];
  accent: string;
}) {
  const ra = zoneById(zones, "restricted");
  const paint = zoneById(zones, "paint");
  const mid = zoneById(zones, "mid");
  const lc3 = zoneById(zones, "left_corner_3");
  const rc3 = zoneById(zones, "right_corner_3");
  const ab3 = zoneById(zones, "above_break_3");
  const baselineY = SHOT_ZONE_PAINT.y + SHOT_ZONE_PAINT.h;
  const top = shotCourtTop();
  const line = "rgba(255,255,255,0.28)";
  const colorOf = (z?: NbaPlayerShotZone) => zoneFgPctColor(z?.fgPct ?? 0.35);
  const glowZones = (
    [
      ["above_break_3", ab3],
      ["mid", mid],
      ["left_corner_3", lc3],
      ["right_corner_3", rc3],
      ["paint", paint],
      ["restricted", ra],
    ] as const
  ).map(([id, z]) => ({ id, color: colorOf(z) }));
  const entries = [
    ["above_break_3", ab3],
    ["mid", mid],
    ["left_corner_3", lc3],
    ["right_corner_3", rc3],
    ["paint", paint],
    ["restricted", ra],
  ] as const;
  const pathFor = (id: NbaPlayerShotZone["id"]) => {
    if (id === "above_break_3") return shotZonePathAboveBreak3Fill();
    if (id === "mid") return shotZonePathMidRange();
    if (id === "left_corner_3") return shotZonePathLeftCorner3();
    if (id === "right_corner_3") return shotZonePathRightCorner3();
    return shotZonePathPaint();
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(accent, 0.8) }}
        >
          Shot Chart
        </h2>
        <div
          className="h-px flex-1"
          style={{ backgroundColor: hexToRgba(accent, 0.35) }}
        />
      </div>
      <p
        className={`${nameOxanium.className} text-[9px] font-bold tracking-[0.14em]`}
        style={{ color: hexToRgba(accent, 0.65) }}
      >
        2024-25 SEASON
      </p>
      <div
        className="relative overflow-hidden border bg-[#04040a]"
        style={{ borderColor: hexToRgba(accent, 0.45) }}
      >
        <svg viewBox={shotZoneViewBox()} className="h-auto w-full">
          <defs>
            <pattern
              id="jerseyPixel"
              patternUnits="userSpaceOnUse"
              width={7}
              height={7}
            >
              <circle
                cx={2.2}
                cy={2.2}
                r={1.15}
                fill="rgba(255,255,255,0.14)"
              />
            </pattern>
            {glowZones.map(({ id, color }) => {
              const pos = SHOT_ZONE_LABEL_POS[id];
              const r = SHOT_ZONE_GLOW_R[id];
              return (
                <radialGradient
                  key={id}
                  id={`zg-${id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fx={pos.x}
                  fy={pos.y}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                  <stop offset="45%" stopColor={color} stopOpacity={0.36} />
                  <stop offset="78%" stopColor={color} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </radialGradient>
              );
            })}
          </defs>
          <rect
            x={0}
            y={SHOT_ZONE_VB_MIN_Y}
            width={SHOT_ZONE_VB_W}
            height={SHOT_ZONE_VB_H}
            fill="#04040a"
          />
          <path d={shotZonePathAboveBreak3Fill()} fill="url(#zg-above_break_3)" />
          <path d={shotZonePathMidRange()} fill="url(#zg-mid)" />
          <path d={shotZonePathLeftCorner3()} fill="url(#zg-left_corner_3)" />
          <path d={shotZonePathRightCorner3()} fill="url(#zg-right_corner_3)" />
          <path d={shotZonePathPaint()} fill="url(#zg-paint)" />
          <circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="url(#zg-restricted)"
          />
          {(
            [
              "above_break_3",
              "mid",
              "left_corner_3",
              "right_corner_3",
              "paint",
            ] as const
          ).map((id) => (
            <path
              key={`px-${id}`}
              d={pathFor(id)}
              fill="url(#jerseyPixel)"
              opacity={0.55}
            />
          ))}
          <circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="url(#jerseyPixel)"
            opacity={0.65}
          />
          {glowZones.map(({ id, color }) =>
            id === "restricted" ? (
              <circle
                key={`e-${id}`}
                cx={SHOT_ZONE_BASKET.x}
                cy={SHOT_ZONE_BASKET.y}
                r={SHOT_ZONE_RA_R}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.35}
              />
            ) : (
              <path
                key={`e-${id}`}
                d={pathFor(id)}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.28}
              />
            )
          )}
          <rect
            x={10}
            y={top}
            width={SHOT_ZONE_VB_W - 20}
            height={baselineY - top}
            fill="none"
            stroke={line}
            strokeWidth={1.4}
          />
          <rect
            x={SHOT_ZONE_PAINT.x}
            y={SHOT_ZONE_PAINT.y}
            width={SHOT_ZONE_PAINT.w}
            height={SHOT_ZONE_PAINT.h}
            fill="none"
            stroke={line}
            strokeWidth={1.2}
          />
          <path
            d={shotCourtFreeThrowCirclePath()}
            fill="none"
            stroke={line}
            strokeWidth={1.2}
          />
          <circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="none"
            stroke={line}
            strokeWidth={1.1}
          />
          <circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y + 8}
            r={7}
            fill="none"
            stroke={hexToRgba(accent, 0.7)}
            strokeWidth={1.4}
          />
          <line
            x1={SHOT_ZONE_BASKET.x - 26}
            y1={baselineY - 5}
            x2={SHOT_ZONE_BASKET.x + 26}
            y2={baselineY - 5}
            stroke={line}
            strokeWidth={2}
          />
          <path
            d={shotZoneThreePointLine()}
            fill="none"
            stroke={line}
            strokeWidth={1.5}
          />
          {entries.map(([id, z]) => {
            if (!z) return null;
            const pos = SHOT_ZONE_LABEL_POS[id];
            const title = z.short;
            return (
              <g key={id} className={nameOxanium.className}>
                <text
                  x={pos.x}
                  y={pos.y - 17}
                  fill="rgba(255,255,255,0.42)"
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  letterSpacing={0.8}
                >
                  {title}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 8}
                  fill="#ffffff"
                  fontSize={26}
                  fontWeight={800}
                  textAnchor="middle"
                >
                  {Math.round(z.fgPct * 100)}%
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 27}
                  fill="rgba(255,255,255,0.55)"
                  fontSize={14}
                  fontWeight={600}
                  textAnchor="middle"
                >
                  {formatShotZoneMakes(z)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center justify-center gap-2">
        <span
          className={`${nameOxanium.className} text-[9px] font-bold tracking-wider text-white/40`}
        >
          20%
        </span>
        <div className="flex h-2 w-44 overflow-hidden">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span
              key={t}
              className="h-full flex-1"
              style={{ backgroundColor: zoneEfficiencyColor(t) }}
            />
          ))}
        </div>
        <span
          className={`${nameOxanium.className} text-[9px] font-bold tracking-wider text-white/40`}
        >
          80%
        </span>
      </div>
    </section>
  );
}

function RecentWindowCompare({ logs }: { logs: NbaPlayerGameLog[] }) {
  const l5 = averageRecentGameLogs(logs, 5);
  const l10 = averageRecentGameLogs(logs, 10);
  if (!l5 || !l10) return null;
  const hot = "#FCD34D";

  const rows: Array<{
    label: string;
    left: string;
    right: string;
    leftN: number;
    rightN: number;
  }> = [
    {
      label: "PTS",
      left: l5.pts.toFixed(1),
      right: l10.pts.toFixed(1),
      leftN: l5.pts,
      rightN: l10.pts,
    },
    {
      label: "REB",
      left: l5.reb.toFixed(1),
      right: l10.reb.toFixed(1),
      leftN: l5.reb,
      rightN: l10.reb,
    },
    {
      label: "AST",
      left: l5.ast.toFixed(1),
      right: l10.ast.toFixed(1),
      leftN: l5.ast,
      rightN: l10.ast,
    },
    {
      label: "FG%",
      left: `${(l5.fgPct * 100).toFixed(1)}%`,
      right: `${(l10.fgPct * 100).toFixed(1)}%`,
      leftN: l5.fgPct,
      rightN: l10.fgPct,
    },
    {
      label: "3PT%",
      left: `${(l5.fg3Pct * 100).toFixed(1)}%`,
      right: `${(l10.fg3Pct * 100).toFixed(1)}%`,
      leftN: l5.fg3Pct,
      rightN: l10.fg3Pct,
    },
  ];

  return (
    <div className="space-y-0.5 border-b border-white/10 px-2.5 py-2.5">
      <div className="mb-1 flex items-center">
        <span
          className={`${nameOxanium.className} flex-1 text-center text-[11px] font-extrabold tracking-[0.14em]`}
          style={{ color: hot }}
        >
          LAST 5
        </span>
        <span className="w-[52px]" />
        <span
          className={`${nameOxanium.className} flex-1 text-center text-[11px] font-extrabold tracking-[0.14em]`}
          style={{ color: hot }}
        >
          LAST 10
        </span>
      </div>
      {rows.map((row) => {
        const leftWin = row.leftN > row.rightN;
        const rightWin = row.rightN > row.leftN;
        return (
          <div
            key={row.label}
            className="flex items-center border-b border-white/[0.06] py-1.5"
          >
            <span
              className={`${nameOxanium.className} flex-1 pr-2 text-right text-[16px] font-extrabold tabular-nums`}
              style={{
                color: leftWin ? hot : "rgba(255,255,255,0.88)",
              }}
            >
              {row.left}
            </span>
            <span
              className={`${nameOxanium.className} w-[52px] text-center text-[11px] font-bold tracking-wider text-white/55`}
            >
              {row.label}
            </span>
            <span
              className={`${nameOxanium.className} flex-1 pl-2 text-left text-[16px] font-extrabold tabular-nums`}
              style={{
                color: rightWin ? hot : "rgba(255,255,255,0.88)",
              }}
            >
              {row.right}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GameLogs({
  logs,
  accent,
}: {
  logs: NbaPlayerGameLog[];
  accent: string;
}) {
  const [open, setOpen] = useState(true);
  const wins = logs.filter((g) => g.result === "W").length;
  const losses = logs.length - wins;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          className={`${nameOxanium.className} flex-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40`}
        >
          Game Logs (Last {logs.length})
        </span>
        <span
          className={`${nameOxanium.className} text-[13px] font-extrabold tabular-nums text-white`}
        >
          {wins}-{losses}
        </span>
        <span style={{ color: accent }}>{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div
          className="overflow-hidden border bg-black/40"
          style={{ borderColor: hexToRgba(accent, 0.3) }}
        >
          <RecentWindowCompare logs={logs} />
          <div
            className={`${nameOxanium.className} flex items-center gap-1.5 border-b px-2 py-1.5 text-[9px] font-bold tracking-wider text-white/35`}
            style={{ borderBottomColor: hexToRgba(accent, 0.14) }}
          >
            <span className="w-9">DATE</span>
            <span className="min-w-0 flex-1">GAME</span>
            <span className="w-4 text-center" />
            <span className="w-8 shrink-0 text-right">MIN</span>
            <span className="w-7 shrink-0 text-right">PTS</span>
            <span className="w-11 shrink-0 text-right">R/A</span>
            <span className="w-12 shrink-0 text-right">FG</span>
          </div>
          {logs.map((log, i) => (
            <div
              key={log.gameId}
              className="flex items-center gap-1.5 px-2 py-2.5 text-[12px]"
              style={
                i < logs.length - 1
                  ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                  : undefined
              }
            >
              <span className="w-9 text-white/40">{log.dateLabel}</span>
              <span className={`${nameOxanium.className} min-w-0 flex-1 font-bold text-white/90`}>
                {log.home ? "vs" : "@"} {log.oppAbbr}
              </span>
              <span
                className={`${nameOxanium.className} w-4 text-center font-extrabold ${
                  log.result === "W" ? "text-cyan-300" : "text-pink-400"
                }`}
              >
                {log.result}
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums text-white/70">
                {Math.round(log.min)}m
              </span>
              <span
                className={`${nameOxanium.className} w-7 shrink-0 text-right text-[14px] font-extrabold tabular-nums text-white`}
              >
                {log.pts}
              </span>
              <span className="w-11 shrink-0 text-right tabular-nums text-white/70">
                {log.reb}/{log.ast}
              </span>
              <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/55">
                {formatFgLine(log.fgm, log.fga)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Player Detail 叩き台（モック）— IDカード型ヘッダー */
export default function NbaPlayerDetailPanel({
  playerId,
  language = "ja",
}: Props) {
  const isJa = language === "ja";
  const detail = useMemo(
    () => getNbaPlayerDetailPreview(playerId),
    [playerId]
  );
  const currentSalary = detail.contract?.seasons[0] ?? null;
  const fullName = `${detail.firstName} ${detail.lastName}`.toUpperCase();
  const jerseyNum = detail.jerseyNumber.replace(/^#/, "") || "—";
  const jerseyPrimary = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", detail.teamId);
  const seasonShown = detail.seasonMetrics.filter((m) =>
    ["pts", "reb", "ast", "stl", "blk", "tov", "fg_pct", "fg3_pct", "ft_pct"].includes(
      m.id
    )
  );

  return (
    <div className="space-y-4 pb-24 text-white">
      {/* ID CARD */}
      <div
        className="flex min-h-[148px] overflow-hidden border bg-[#050808]"
        style={{ borderColor: jerseyPrimary }}
      >
        <div
          className="relative flex w-[112px] shrink-0 items-center justify-center border-r bg-[#0a0a0c]"
          style={{
            borderRightColor: jerseyPrimary,
            backgroundImage: `repeating-linear-gradient(28deg, ${jerseyPrimary}48 0 1px, transparent 1px 10px)`,
          }}
        >
          <div className="relative h-[72px] w-[72px]">
            <HalftoneJerseyMark
              accent={jerseyPrimary}
              accentEnd={jerseySecondary}
              className="h-[72px] w-[72px]"
              glow="soft"
            />
            <span
              className={`${nameOxanium.className} pointer-events-none absolute inset-x-0 top-[28px] text-center font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] ${
                jerseyNum.length >= 3 ? "text-[15px]" : "text-[22px]"
              }`}
              style={{ transform: "skewX(-6deg)" }}
            >
              {jerseyNum}
            </span>
          </div>
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3">
          <h1
            className={`${nameOxanium.className} truncate text-[20px] font-extrabold tracking-wide text-white`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {fullName}
          </h1>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {(
              [
                ["POSITION", detail.position],
                ["EXP", `${detail.experienceYears} YRS`],
                ["PHYSIQUE", formatPhysique(detail.height, detail.weight)],
                ["TEAM", detail.teamAbbr],
                ["COUNTRY", detail.country ?? "—"],
                [
                  "DRAFT",
                  formatDraftHero(
                    detail.draftYear,
                    detail.draftRound,
                    detail.draftNumber
                  ),
                ],
              ] as const
            ).map(([label, value]) => {
              const countryIso =
                label === "COUNTRY"
                  ? nbaCountryNameToIso2(detail.country)
                  : null;
              return (
                <div key={label}>
                  <p
                    className={`${nameOxanium.className} text-[8px] font-bold uppercase tracking-[0.12em] text-white/40`}
                  >
                    {label}
                  </p>
                  <p
                    className={`${nameOxanium.className} flex items-center gap-1.5 truncate text-[12px] font-extrabold text-white`}
                    style={{ transform: "skewX(-6deg)" }}
                  >
                    <span className="truncate">{value}</span>
                    {countryIso ? (
                      <CountryFlag
                        iso2={countryIso.toLowerCase()}
                        variant="profileInline"
                        alt={detail.country ?? undefined}
                        className="shrink-0"
                      />
                    ) : null}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {detail.availability.status !== "active" ? (
        <div
          className="space-y-1 border px-3.5 py-2.5"
          style={{
            borderColor: hexToRgba(
              availabilityStatusColor(detail.availability.status),
              0.55
            ),
            backgroundColor: "rgba(8,8,12,0.55)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`${nameOxanium.className} text-[14px] font-extrabold tracking-[0.14em]`}
              style={{
                color: availabilityStatusColor(detail.availability.status),
                transform: "skewX(-8deg)",
              }}
            >
              {formatAvailabilityStatus(detail.availability.status)}
            </span>
            {detail.availability.returnEstimate ? (
              <span
                className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-wide`}
                style={{
                  color: hexToRgba(
                    availabilityStatusColor(detail.availability.status),
                    0.85
                  ),
                }}
              >
                {detail.availability.returnEstimate}
              </span>
            ) : null}
          </div>
          <p
            className={`${nameOxanium.className} text-[12px] font-semibold text-white/70`}
            style={{ transform: "skewX(-4deg)" }}
          >
            {detail.availability.reason ??
              (isJa ? "詳細なし" : "No detail")}
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(jerseyPrimary, 0.75) }}
        >
          Season Averages
        </h2>
        <div
          className="grid grid-cols-3 overflow-hidden border bg-black/50"
          style={{ borderColor: hexToRgba(jerseyPrimary, 0.4) }}
        >
          {seasonShown.map((m) => (
            <div
              key={m.id}
              className="px-2.5 py-3"
              style={{
                borderBottom: `1px solid ${hexToRgba(jerseyPrimary, 0.15)}`,
                borderRight: `1px solid ${hexToRgba(jerseyPrimary, 0.15)}`,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                  {m.short}
                </span>
                <span
                  className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  style={{
                    color:
                      m.leagueRank <= 10
                        ? jerseyPrimary
                        : "rgba(255,255,255,0.35)",
                  }}
                >
                  #{m.leagueRank}
                </span>
              </div>
              <p className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}>
                {m.display}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(jerseyPrimary, 0.75) }}
        >
          Advanced
        </h2>
        <div
          className="flex overflow-hidden border bg-black/50"
          style={{ borderColor: hexToRgba(jerseyPrimary, 0.4) }}
        >
          {detail.advancedMetrics.map((m, i) => (
            <div
              key={m.id}
              className="min-w-0 flex-1 px-2 py-3"
              style={
                i < detail.advancedMetrics.length - 1
                  ? { borderRight: `1px solid ${hexToRgba(jerseyPrimary, 0.15)}` }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                  {m.short}
                </span>
                <span
                  className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  style={{
                    color:
                      m.leagueRank <= 10
                        ? jerseyPrimary
                        : "rgba(255,255,255,0.35)",
                  }}
                >
                  #{m.leagueRank}
                </span>
              </div>
              <p className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}>
                {m.display}
              </p>
              <p className="mt-1 text-[9px] leading-snug text-white/40">
                {isJa ? m.hintJa : m.hintEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <ShotZoneHeat zones={detail.shotZones} accent={jerseyPrimary} />
      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <GameLogs logs={detail.gameLogs} accent={jerseyPrimary} />

      {detail.contract && currentSalary ? (
        <>
          <div
            className="h-px"
            style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
          />
          <section className="space-y-3">
            <h2
              className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
              style={{ color: hexToRgba(jerseyPrimary, 0.75) }}
            >
              Contract
            </h2>
            <div
              className="space-y-2 border bg-black/45 p-3.5"
              style={{ borderColor: hexToRgba(jerseyPrimary, 0.3) }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
                    {isJa ? "今季年俸" : "This Season"}
                  </p>
                  <p className={`${nameOxanium.className} text-[26px] font-extrabold`}>
                    {formatSalaryUsd(currentSalary.baseSalary)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
                    Rank
                  </p>
                  <p
                    className={`${nameOxanium.className} text-[22px] font-extrabold`}
                    style={{ color: jerseyPrimary }}
                  >
                    #{currentSalary.salaryRank}
                  </p>
                </div>
              </div>
              <p className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wide text-white/60`}>
                {detail.contract.contractType}
                {" · "}
                {isJa ? "残" : "REM"} {detail.contract.yearsRemaining} YR
                {" · "}
                FA {detail.contract.freeAgencyYear}
                {detail.contract.freeAgencyType
                  ? ` ${detail.contract.freeAgencyType}`
                  : ""}
              </p>
              <p
                className={`${nameOxanium.className} text-[12px] font-extrabold`}
                style={{ color: jerseyPrimary }}
              >
                {isJa ? "総額" : "TOTAL"}{" "}
                {formatSalaryUsd(detail.contract.totalValue)}
                {"  ·  "}
                {isJa ? "残保証" : "GUAR."}{" "}
                {formatSalaryUsd(detail.contract.remainingGuaranteed)}
              </p>
              <div className="mt-1">
                {detail.contract.seasons.map((s, i) => (
                  <div
                    key={s.season}
                    className="flex items-center gap-2.5 py-1.5"
                    style={
                      i < detail.contract!.seasons.length - 1
                        ? {
                            borderBottom: `1px solid ${hexToRgba(jerseyPrimary, 0.12)}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={`${nameOxanium.className} w-12 text-[12px] font-bold tracking-wide text-white/45`}
                    >
                      {formatContractSeasonLabel(s.season)}
                    </span>
                    <span
                      className={`${nameOxanium.className} flex-1 text-[14px] font-extrabold tabular-nums text-white/90`}
                    >
                      {formatSalaryUsd(s.baseSalary)}
                    </span>
                    {s.option ? (
                      <span
                        className={`${nameOxanium.className} w-7 text-right text-[11px] font-extrabold tracking-wide`}
                        style={{ color: jerseyPrimary }}
                      >
                        {s.option}
                      </span>
                    ) : (
                      <span className="w-7" />
                    )}
                  </div>
                ))}
              </div>
              {detail.contract.notes.length > 0 ? (
                <p
                  className={`${nameOxanium.className} text-[11px] leading-tight`}
                  style={{ color: hexToRgba(jerseyPrimary, 0.55) }}
                >
                  {detail.contract.notes[0]}
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <section className="space-y-3">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(jerseyPrimary, 0.75) }}
        >
          Awards
        </h2>
        <div
          className="overflow-hidden border bg-black/40"
          style={{ borderColor: hexToRgba(jerseyPrimary, 0.25) }}
        >
          {(detail.awards.length > 0
            ? detail.awards.map((a) => [a.label, `× ${a.count}`] as const)
            : [["—", isJa ? "なし" : "None"] as const]
          ).map(([label, value], i, arr) => (
            <div
              key={`${label}-${i}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
              style={
                i < arr.length - 1
                  ? {
                      borderBottom: `1px solid ${hexToRgba(jerseyPrimary, 0.12)}`,
                    }
                  : undefined
              }
            >
              <span
                className={`${nameOxanium.className} text-[11px] font-bold tracking-wide text-white/85`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {label}
              </span>
              <span
                className={`${nameOxanium.className} text-right text-[13px] font-extrabold`}
                style={{ color: jerseyPrimary, transform: "skewX(-6deg)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <section className="space-y-3">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(jerseyPrimary, 0.75) }}
        >
          More
        </h2>
        <div
          className="overflow-hidden border bg-black/40"
          style={{ borderColor: hexToRgba(jerseyPrimary, 0.25) }}
        >
          {(
            [
              [
                isJa ? "年齢" : "AGE",
                ageFromBirthDate(detail.birthDate) != null
                  ? String(ageFromBirthDate(detail.birthDate))
                  : "—",
              ],
              [isJa ? "生年月日" : "BORN", formatBirthDateLabel(detail.birthDate)],
              ["COLLEGE", detail.college ?? "—"],
              ["TEAM", detail.teamName],
              [
                isJa ? "経歴" : "HISTORY",
                formatTeamHistory(detail.teamHistory),
              ],
            ] as const
          ).map(([label, value], i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
              style={
                i < arr.length - 1
                  ? {
                      borderBottom: `1px solid ${hexToRgba(jerseyPrimary, 0.12)}`,
                    }
                  : undefined
              }
            >
              <span
                className={`${nameOxanium.className} text-[11px] font-bold tracking-wide text-white/85`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {label}
              </span>
              <span
                className={`${nameOxanium.className} text-right text-[13px] font-extrabold text-white/90`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p
        className={`${nameOxanium.className} text-center text-[9px] font-bold uppercase tracking-[0.14em]`}
        style={{ color: hexToRgba(jerseyPrimary, 0.4) }}
      >
        {detail.asOfLabel} · Preview
      </p>
    </div>
  );
}
