"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  formatCareerSeasonLabel,
  formatContractSeasonLabel,
  formatFgLine,
  formatPhysique,
  formatSalaryUsd,
  formatTeamHistory,
  getNbaPlayerDetailPreview,
  NBA_PLAYER_DETAIL_SEASON_SHOWN,
  nbaCountryNameToIso2,
  type NbaPlayerCareerSeasonBoard,
  type NbaPlayerCareerSeasonRow,
  type NbaPlayerGameLog,
  type NbaPlayerShotZone,
  type NbaPlayerVenueSplit,
  type NbaPlayerVsOpponentSample,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  isPlayerDetailRankShown,
  isPlayerDetailSalaryRankShown,
} from "@/lib/predict/nbaPlayerDetailHowTheyPlay";
import { CyberNoDataLabel } from "@/app/component/common/CyberNoDataLabel";
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
import NbaPlayerHowTheyPlay from "@/app/component/playerDetail/NbaPlayerHowTheyPlay";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "@/lib/nba/usePlayerStatLeadersBundle";
import { useNbaPlayerDetailLiveOverlay } from "@/lib/nba/playerDetail/useNbaPlayerDetailLiveOverlay";
import { formatNbaPlayerDisplayName } from "@/lib/nba/formatNbaPlayerListName";

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

/** セクション見出し — チームカラーではなく白で統一 */
const SECTION_HEADING_CLASS = `${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-white`;

/** 未接続セクション用 — 枠は残し、既存 CyberNoDataLabel を中央に */
function PlayerDetailSectionNoData({ accent }: { accent: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[88px] items-center justify-center border bg-black/45 px-3 py-7"
      style={{ borderColor: hexToRgba(accent, 0.3) }}
    >
      <CyberNoDataLabel variant="chart" />
    </div>
  );
}
const TABLE_CELL_SKEW = { transform: "skewX(-6deg)" } as const;

function SkewText({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block" style={TABLE_CELL_SKEW}>
      {children}
    </span>
  );
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
  if (zones.length === 0) {
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className={SECTION_HEADING_CLASS}>SHOT CHART</h2>
          <div className="h-px flex-1 bg-white/35" />
        </div>
        <PlayerDetailSectionNoData accent={accent} />
      </section>
    );
  }
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
        <h2 className={SECTION_HEADING_CLASS}>SHOT CHART</h2>
        <div className="h-px flex-1 bg-white/35" />
      </div>
      <p
        className={`${nameOxanium.className} text-[9px] font-bold tracking-[0.14em] text-white/65`}
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

function fmtPerGame(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtPctBref(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(3).replace(/^0/, "");
}

const CAREER_SEASON_COLS: Array<{
  key: string;
  label: string;
  align?: "left" | "right";
  width: string;
  render: (row: NbaPlayerCareerSeasonRow) => string;
}> = [
  {
    key: "season",
    label: "Season",
    align: "left",
    width: "w-[64px]",
    render: (r) => formatCareerSeasonLabel(r.seasonStart),
  },
  {
    key: "age",
    label: "Age",
    align: "left",
    width: "w-7",
    render: (r) => String(r.age),
  },
  {
    key: "teamAbbr",
    label: "TEAM",
    align: "left",
    width: "w-10",
    render: (r) => r.teamAbbr,
  },
  {
    key: "games",
    label: "G",
    width: "w-7",
    render: (r) => String(r.games),
  },
  {
    key: "gamesStarted",
    label: "GS",
    width: "w-7",
    render: (r) =>
      r.gamesStarted == null ? "—" : String(r.gamesStarted),
  },
  {
    key: "min",
    label: "MP",
    width: "w-9",
    render: (r) => fmtPerGame(r.min),
  },
  {
    key: "pts",
    label: "PTS",
    width: "w-9",
    render: (r) => fmtPerGame(r.pts),
  },
  {
    key: "reb",
    label: "REB",
    width: "w-9",
    render: (r) => fmtPerGame(r.reb),
  },
  {
    key: "ast",
    label: "AST",
    width: "w-9",
    render: (r) => fmtPerGame(r.ast),
  },
  {
    key: "fgm",
    label: "FG",
    width: "w-8",
    render: (r) => fmtPerGame(r.fgm),
  },
  {
    key: "fga",
    label: "FGA",
    width: "w-9",
    render: (r) => fmtPerGame(r.fga),
  },
  {
    key: "fgPct",
    label: "FG%",
    width: "w-10",
    render: (r) => fmtPctBref(r.fgPct),
  },
  {
    key: "fg3m",
    label: "3P",
    width: "w-8",
    render: (r) => fmtPerGame(r.fg3m),
  },
  {
    key: "fg3a",
    label: "3PA",
    width: "w-9",
    render: (r) => fmtPerGame(r.fg3a),
  },
  {
    key: "fg3Pct",
    label: "3P%",
    width: "w-10",
    render: (r) => fmtPctBref(r.fg3Pct),
  },
  {
    key: "ftm",
    label: "FT",
    width: "w-8",
    render: (r) => fmtPerGame(r.ftm),
  },
  {
    key: "fta",
    label: "FTA",
    width: "w-9",
    render: (r) => fmtPerGame(r.fta),
  },
  {
    key: "ftPct",
    label: "FT%",
    width: "w-10",
    render: (r) => fmtPctBref(r.ftPct),
  },
  {
    key: "stl",
    label: "STL",
    width: "w-8",
    render: (r) => fmtPerGame(r.stl),
  },
  {
    key: "blk",
    label: "BLK",
    width: "w-8",
    render: (r) => fmtPerGame(r.blk),
  },
  {
    key: "tov",
    label: "TOV",
    width: "w-8",
    render: (r) => fmtPerGame(r.tov),
  },
];

function SeasonHistoryTable({
  regular,
  playoffs,
  accent,
  currentSeasonStart = 2025,
}: {
  regular: NbaPlayerCareerSeasonRow[];
  playoffs: NbaPlayerCareerSeasonRow[];
  accent: string;
  currentSeasonStart?: number;
}) {
  const [board, setBoard] = useState<NbaPlayerCareerSeasonBoard>("regular");
  /** 新しいシーズンを上（ingest も降順。表示で reverse しない） */
  const rows = [...(board === "regular" ? regular : playoffs)].sort(
    (a, b) => b.seasonStart - a.seasonStart
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={SECTION_HEADING_CLASS}>Season Averages · Career</h2>
        <div
          className="flex overflow-hidden border"
          style={{ borderColor: hexToRgba(accent, 0.35) }}
        >
          {(
            [
              ["regular", "Regular"],
              ["playoffs", "Playoffs"],
            ] as const
          ).map(([id, label]) => {
            const active = board === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBoard(id)}
                className={`${nameOxanium.className} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide`}
                style={{
                  backgroundColor: active ? accent : "transparent",
                  color: active ? "#050508" : "rgba(255,255,255,0.55)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <PlayerDetailSectionNoData accent={accent} />
      ) : (
        <div
          className="overflow-x-auto border bg-black/45"
          style={{ borderColor: hexToRgba(accent, 0.35) }}
        >
          <div className="min-w-max">
            <div
              className={`${nameOxanium.className} flex items-center gap-x-1 border-b px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40`}
              style={{ borderBottomColor: hexToRgba(accent, 0.18) }}
            >
              {CAREER_SEASON_COLS.map((col) => (
                <span
                  key={col.key}
                  className={`${col.width} shrink-0 ${
                    col.align === "left" ? "text-left" : "text-right"
                  }`}
                >
                  <SkewText>{col.label}</SkewText>
                </span>
              ))}
            </div>
            {rows.map((row, i) => {
              const isCurrent = row.seasonStart === currentSeasonStart;
              return (
                <div
                  key={`${board}-${row.seasonStart}-${row.teamAbbr}`}
                  className={`${nameOxanium.className} flex items-center gap-x-1 px-2 py-3 text-[14px] tabular-nums`}
                  style={{
                    backgroundColor: isCurrent
                      ? hexToRgba(accent, 0.12)
                      : "transparent",
                    borderBottom:
                      i < rows.length - 1
                        ? `1px solid ${hexToRgba(accent, 0.1)}`
                        : undefined,
                  }}
                >
                  {CAREER_SEASON_COLS.map((col) => {
                    const value = col.render(row);
                    const emphasize =
                      col.key === "season" ||
                      col.key === "pts" ||
                      col.key === "teamAbbr";
                    return (
                      <span
                        key={col.key}
                        className={`${col.width} shrink-0 ${
                          col.align === "left" ? "text-left" : "text-right"
                        } ${
                          emphasize
                            ? "font-extrabold text-white"
                            : "font-semibold text-white/75"
                        }`}
                      >
                        <SkewText>{value}</SkewText>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function fmtSplitNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function PlayerVenueSplitsSection({
  splits,
  accent,
  isJa,
}: {
  splits: NbaPlayerVenueSplit[];
  accent: string;
  isJa: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className={SECTION_HEADING_CLASS}>
        {isJa ? "ホーム / アウェイ" : "Home / Away"}
      </h2>
      {splits.length === 0 ? (
        <PlayerDetailSectionNoData accent={accent} />
      ) : (
      <div
        className="overflow-hidden border bg-black/50"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        <div
          className={`${nameOxanium.className} grid grid-cols-6 gap-0 border-b px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40`}
          style={{ borderBottomColor: hexToRgba(accent, 0.18) }}
        >
          <span />
          <span className="text-right">
            <SkewText>GP</SkewText>
          </span>
          <span className="text-right">
            <SkewText>PTS</SkewText>
          </span>
          <span className="text-right">
            <SkewText>REB</SkewText>
          </span>
          <span className="text-right">
            <SkewText>AST</SkewText>
          </span>
          <span className="text-right">
            <SkewText>+/-</SkewText>
          </span>
        </div>
        {splits.map((row, i) => (
          <div
            key={row.venue}
            className={`${nameOxanium.className} grid grid-cols-6 gap-0 px-2 py-2 text-[14px] font-semibold tabular-nums text-white/85`}
            style={
              i < splits.length - 1
                ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                : undefined
            }
          >
            <span className="font-extrabold uppercase text-white">
              <SkewText>
                {row.venue === "home" ? "HOME" : "AWAY"}
              </SkewText>
            </span>
            <span className="text-right">
              <SkewText>{row.games}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.pts)}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.reb)}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.ast)}</SkewText>
            </span>
            <span
              className="text-right font-extrabold"
              style={{
                color:
                  row.plusMinus > 0
                    ? "#5cf0b5"
                    : row.plusMinus < 0
                      ? "#FF2D78"
                      : "rgba(255,255,255,0.55)",
              }}
            >
              <SkewText>
                {row.plusMinus > 0 ? "+" : ""}
                {fmtSplitNum(row.plusMinus)}
              </SkewText>
            </span>
          </div>
        ))}
      </div>
      )}
    </section>
  );
}

function PlayerVsOpponentSection({
  samples,
  accent,
  isJa,
}: {
  samples: NbaPlayerVsOpponentSample[];
  accent: string;
  isJa: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className={SECTION_HEADING_CLASS}>
        {isJa ? "対戦相手別（平均）" : "Vs Opponent (Avg)"}
      </h2>
      {samples.length === 0 ? (
        <PlayerDetailSectionNoData accent={accent} />
      ) : (
        <>
      <p className={`${nameOxanium.className} text-[10px] text-white/40`}>
        {isJa
          ? "今季の対戦試合からの平均（プレビュー）"
          : "Season average vs opponent (preview)"}
      </p>
      <div
        className="overflow-hidden border bg-black/50"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        <div
          className={`${nameOxanium.className} grid grid-cols-6 gap-0 border-b px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40`}
          style={{ borderBottomColor: hexToRgba(accent, 0.18) }}
        >
          <span>
            <SkewText>{isJa ? "相手" : "OPP"}</SkewText>
          </span>
          <span className="text-right">
            <SkewText>GP</SkewText>
          </span>
          <span className="text-right">
            <SkewText>PTS</SkewText>
          </span>
          <span className="text-right">
            <SkewText>REB</SkewText>
          </span>
          <span className="text-right">
            <SkewText>AST</SkewText>
          </span>
          <span className="text-right">
            <SkewText>+/-</SkewText>
          </span>
        </div>
        {samples.map((row, i) => (
          <div
            key={row.oppTeamId}
            className={`${nameOxanium.className} grid grid-cols-6 gap-0 px-2 py-2 text-[14px] font-semibold tabular-nums text-white/85`}
            style={
              i < samples.length - 1
                ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                : undefined
            }
          >
            <span className="font-extrabold text-white">
              <SkewText>vs {row.oppAbbr}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{row.games}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.pts)}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.reb)}</SkewText>
            </span>
            <span className="text-right">
              <SkewText>{fmtSplitNum(row.ast)}</SkewText>
            </span>
            <span
              className="text-right font-extrabold"
              style={{
                color:
                  row.plusMinus > 0
                    ? "#5cf0b5"
                    : row.plusMinus < 0
                      ? "#FF2D78"
                      : "rgba(255,255,255,0.55)",
              }}
            >
              <SkewText>
                {row.plusMinus > 0 ? "+" : ""}
                {fmtSplitNum(row.plusMinus)}
              </SkewText>
            </span>
          </div>
        ))}
      </div>
        </>
      )}
    </section>
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

  if (logs.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className={`${SECTION_HEADING_CLASS} text-white`}>GAME LOGS</h2>
        <PlayerDetailSectionNoData accent={accent} />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          className={`${SECTION_HEADING_CLASS} flex-1 text-white`}
        >
          GAME LOGS (LAST {logs.length})
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
            className={`${nameOxanium.className} flex items-center gap-1.5 border-b px-2 py-2 text-[11px] font-bold tracking-wider text-white/35`}
            style={{ borderBottomColor: hexToRgba(accent, 0.14) }}
          >
            <span className="w-11">DATE</span>
            <span className="min-w-0 flex-1">GAME</span>
            <span className="w-5 text-center" />
            <span className="w-9 shrink-0 text-right">MIN</span>
            <span className="w-8 shrink-0 text-right">PTS</span>
            <span className="w-12 shrink-0 text-right">R/A</span>
            <span className="w-14 shrink-0 text-right">FG</span>
          </div>
          {logs.map((log, i) => (
            <div
              key={log.gameId}
              className="flex items-center gap-1.5 px-2 py-2.5 text-[13px]"
              style={
                i < logs.length - 1
                  ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                  : undefined
              }
            >
              <span className="w-11 text-white/40">{log.dateLabel}</span>
              <span className={`${nameOxanium.className} min-w-0 flex-1 font-bold text-white/90`}>
                {log.home ? "vs" : "@"} {log.oppAbbr}
              </span>
              <span
                className={`${nameOxanium.className} w-5 text-center font-extrabold ${
                  log.result === "W" ? "text-cyan-300" : "text-pink-400"
                }`}
              >
                {log.result}
              </span>
              <span className="w-9 shrink-0 text-right tabular-nums text-white/70">
                {Math.round(log.min)}m
              </span>
              <span
                className={`${nameOxanium.className} w-8 shrink-0 text-right text-[15px] font-extrabold tabular-nums text-white`}
              >
                {log.pts}
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums text-white/70">
                {log.reb}/{log.ast}
              </span>
              <span className="w-14 shrink-0 text-right text-[12px] tabular-nums text-white/55">
                {formatFgLine(log.fgm, log.fga)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Player Detail — roster/leaders/payroll/injury live overlay */
export default function NbaPlayerDetailPanel({
  playerId,
  language = "ja",
}: Props) {
  const isJa = language === "ja";
  const { bundle: leaders } = usePlayerStatLeadersBundle();
  const { bundle: teamStats } = useLeagueTeamStatsBundle();
  const base = useMemo(
    () => getNbaPlayerDetailPreview(playerId),
    [playerId]
  );
  const { detail, hasFetchError } = useNbaPlayerDetailLiveOverlay({
    playerId,
    base,
    leaders,
  });
  const currentSalary = detail.contract?.seasons[0] ?? null;
  const fullName = formatNbaPlayerDisplayName(
    detail.firstName,
    detail.lastName,
    detail.playerId
  ).toUpperCase();
  const jerseyNum = detail.jerseyNumber.replace(/^#/, "") || "—";
  const jerseyPrimary = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", detail.teamId);
  const seasonShown = NBA_PLAYER_DETAIL_SEASON_SHOWN.map(
    (id) => detail.seasonMetrics.find((m) => m.id === id)
  ).filter((m): m is NonNullable<typeof m> => Boolean(m));
  /** 開幕前 / 未出場は 0 埋めグリッドにせず NO DATA */
  const hasSeasonAverages = detail.season.gamesPlayed > 0;

  return (
    <div className="space-y-4 pb-24 text-white">

      {hasFetchError ? (
        <div className="border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100/90">
          {isJa
            ? "一部データの取得に失敗しました。表示は取得できた範囲のみです。"
            : "Some live data failed to load. Showing what we could fetch."}
        </div>
      ) : null}

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
        <h2 className={SECTION_HEADING_CLASS}>SEASON AVERAGES</h2>
        {hasSeasonAverages ? (
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
                  {isPlayerDetailRankShown(m.leagueRank) ? (
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
                  ) : null}
                </div>
                <p className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}>
                  {m.display}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <PlayerDetailSectionNoData accent={jerseyPrimary} />
        )}
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <NbaPlayerHowTheyPlay
        playerId={detail.playerId}
        accent={jerseyPrimary}
        isJa={isJa}
        leaders={leaders}
        teamStats={teamStats}
        detail={detail}
      />
      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <PlayerVenueSplitsSection
        splits={detail.venueSplits}
        accent={jerseyPrimary}
        isJa={isJa}
      />
      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <PlayerVsOpponentSection
        samples={detail.vsOpponentSamples}
        accent={jerseyPrimary}
        isJa={isJa}
      />
      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <SeasonHistoryTable
        regular={detail.careerSeasons.regular}
        playoffs={detail.careerSeasons.playoffs}
        accent={jerseyPrimary}
      />
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

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <section className="space-y-3">
        <h2 className={SECTION_HEADING_CLASS}>CONTRACT</h2>
        {detail.contract && currentSalary ? (
            <div
              className="space-y-2 border bg-black/45 p-3.5"
              style={{ borderColor: hexToRgba(jerseyPrimary, 0.3) }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
                    {isJa ? "今季年俸" : "THIS SEASON"}
                  </p>
                  <p className={`${nameOxanium.className} text-[26px] font-extrabold`}>
                    {formatSalaryUsd(currentSalary.baseSalary)}
                  </p>
                </div>
                {isPlayerDetailSalaryRankShown(currentSalary.salaryRank) ? (
                  <div className="text-right">
                    <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
                      RANK
                    </p>
                    <p
                      className={`${nameOxanium.className} text-[22px] font-extrabold text-white`}
                    >
                      #{currentSalary.salaryRank}
                    </p>
                  </div>
                ) : null}
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
        ) : (
          <PlayerDetailSectionNoData accent={jerseyPrimary} />
        )}
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(jerseyPrimary, 0.2) }}
      />
      <section className="space-y-3">
        <h2 className={SECTION_HEADING_CLASS}>Awards</h2>
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
        <h2 className={SECTION_HEADING_CLASS}>More</h2>
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
        className={`${nameOxanium.className} text-center text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
      >
        {detail.asOfLabel} · Preview
      </p>
    </div>
  );
}
