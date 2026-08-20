"use client";

/** チーム詳細 `HowTheyPlayBoard` 相当 — プレイヤーの PERFORMANCE + HOW THEY PLAY */
import { useMemo, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import {
  PLAYER_HOW_THEY_PLAY_TABS,
  getPlayerHowTheyPlay,
  isPlayerDetailRankShown,
  type PlayerHowTheyPlayTab,
} from "@/lib/predict/nbaPlayerDetailHowTheyPlay";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";

const LEAGUE_RANK_SEGMENTS = 6;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function leagueRankSegPct(rank: number): number {
  const r = Math.max(1, Math.min(120, rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 20));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function rankTone(rank: number, accent: string): string {
  return rank <= 10 ? accent : "rgba(255,255,255,0.35)";
}

function RankTag({
  rank,
  accent,
  className,
}: {
  rank: number;
  accent: string;
  className: string;
}) {
  if (!isPlayerDetailRankShown(rank)) return null;
  return (
    <span className={className} style={{ color: rankTone(rank, accent) }}>
      #{rank}
    </span>
  );
}

function HowPtsCol({ display }: { display?: string }) {
  return (
    <span className="flex w-[54px] shrink-0 flex-col items-end leading-none">
      <span className={`${nameOxanium.className} h-[12px] text-[8px] font-bold uppercase tracking-wide text-white/40`}>
        {display ? "pts" : ""}
      </span>
      <span
        className={`${nameOxanium.className} text-[15px] font-extrabold tabular-nums text-white`}
        style={{ transform: "skewX(-8deg)" }}
      >
        {display ?? ""}
      </span>
    </span>
  );
}

function MetricStack({
  display,
  rank,
  accent,
  unit,
}: {
  display: string;
  rank: number;
  accent: string;
  unit?: string;
}) {
  return (
    <span className="flex w-[68px] shrink-0 flex-col items-end leading-none">
      <span className="flex h-[12px] items-center">
        <RankTag
          rank={rank}
          accent={accent}
          className={`${nameOxanium.className} text-[10px] font-bold tabular-nums`}
        />
      </span>
      <span
        className={`${nameOxanium.className} text-[16px] font-extrabold tabular-nums text-white`}
        style={{ transform: "skewX(-8deg)" }}
      >
        {display}
        {unit ? (
          <span className="ml-0.5 text-[9px] font-bold text-white/40">{unit}</span>
        ) : null}
      </span>
    </span>
  );
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <h2
        className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
        style={{ color: hexToRgba(accent, 0.75) }}
      >
        {title}
      </h2>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: hexToRgba(accent, 0.35) }}
      />
    </div>
  );
}

function HowChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        nameOxanium.className,
        "relative min-w-0 flex-1 overflow-hidden rounded-[2px] border px-1 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.04em]",
        active
          ? "border-[#00F5FF] text-[#050508]"
          : "border-[#00F5FF]/26 bg-transparent text-[#00F5FF]",
      ].join(" ")}
      style={
        active
          ? {
              backgroundColor: "#00F5FF",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
            }
          : undefined
      }
    >
      <span className="relative z-[1] inline-block" style={{ transform: "skewX(-6deg)" }}>
        {label}
      </span>
    </button>
  );
}

function HintRow({
  rows,
  selectedId,
  onSelect,
  accent,
  isJa,
}: {
  rows: Array<{
    id: string;
    short: string;
    hintJa: string;
    hintEn: string;
    cell: { display: string; rank: number };
    pts?: { display: string };
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
  accent: string;
  isJa: boolean;
}) {
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.15);
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0]!;
  return (
    <>
      <div className="overflow-hidden border bg-black/50" style={{ borderColor: frame }}>
        {rows.map((row, i) => {
          const active = row.id === selected.id;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
              style={{
                borderTop: i > 0 ? `1px solid ${line}` : undefined,
                backgroundColor: active ? hexToRgba(accent, 0.08) : undefined,
              }}
            >
              <span
                className={`${nameOxanium.className} min-w-0 flex-1 text-[11px] font-extrabold`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {row.short}
              </span>
              <HowPtsCol display={row.pts?.display} />
              <MetricStack
                display={row.cell.display}
                rank={row.cell.rank}
                accent={accent}
              />
            </button>
          );
        })}
      </div>
      <p className={`${nameOxanium.className} text-[13px] font-bold leading-snug text-white/85`}>
        {isJa ? selected.hintJa : selected.hintEn}
      </p>
    </>
  );
}

export default function NbaPlayerHowTheyPlay({
  playerId,
  accent,
  isJa,
  leaders,
  teamStats,
  detail,
}: {
  playerId: string;
  accent: string;
  isJa: boolean;
  leaders?: NbaPlayerStatLeadersBundle;
  teamStats?: NbaLeagueTeamStatsBundle;
  detail?: NbaPlayerDetailPreview;
}) {
  const board = useMemo(
    () => getPlayerHowTheyPlay(playerId, { leaders, teamStats, detail }),
    [playerId, leaders, teamStats, detail]
  );
  const [tab, setTab] = useState<PlayerHowTheyPlayTab>("fourFactors");
  const [factorId, setFactorId] = useState("efg_pct");
  const [defenseId, setDefenseId] = useState("matchup_fg_pct");
  const [hustleId, setHustleId] = useState("deflections");
  const [trackId, setTrackId] = useState("drives");
  const tabMeta = PLAYER_HOW_THEY_PLAY_TABS.find((t) => t.id === tab)!;
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.15);

  return (
    <div className="space-y-4">
      <section className="space-y-2.5">
        <SectionTitle title="PERFORMANCE METRICS" accent={accent} />
        <div
          className="grid grid-cols-3 overflow-hidden border bg-black/50"
          style={{ borderColor: frame }}
        >
          {board.ratings.map((row, i) => {
            const col = i % 3;
            const lastRow = Math.floor((board.ratings.length - 1) / 3);
            const rowI = Math.floor(i / 3);
            return (
              <div
                key={row.id}
                className="px-2.5 py-3"
                style={{
                  borderRight: col < 2 ? `1px solid ${line}` : undefined,
                  borderBottom: rowI < lastRow ? `1px solid ${line}` : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                    {row.short}
                  </span>
                  <RankTag
                    rank={row.cell.rank}
                    accent={accent}
                    className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  />
                </div>
                <p
                  className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  {row.cell.display}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="h-px" style={{ backgroundColor: hexToRgba(accent, 0.2) }} />

      <section className="space-y-2.5">
        <SectionTitle title="HOW THEY PLAY" accent={accent} />
        <div className="grid grid-cols-3 gap-1">
          {PLAYER_HOW_THEY_PLAY_TABS.map((t) => (
            <HowChip
              key={t.id}
              active={tab === t.id}
              label={t.short}
              onClick={() => setTab(t.id)}
            />
          ))}
        </div>
        <p className={`${nameOxanium.className} text-[11px] leading-snug text-[#00F5FF]/70`}>
          {isJa ? tabMeta.hintJa : tabMeta.hintEn}
        </p>

        {tab === "fourFactors" ? (
          <HintRow
            rows={board.fourFactors}
            selectedId={factorId}
            onSelect={setFactorId}
            accent={accent}
            isJa={isJa}
          />
        ) : null}

        {tab === "scoring" ? (
          <div className="space-y-2.5 border bg-black/40 px-3 py-3" style={{ borderColor: frame }}>
            {board.scoring.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`${nameOxanium.className} min-w-0 flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55`}>
                    {isJa ? row.labelJa : row.labelEn}
                  </span>
                  <HowPtsCol display={row.pts.display} />
                  <MetricStack
                    display={row.cell.display}
                    rank={row.cell.rank}
                    accent={accent}
                  />
                </div>
                <div className="h-1.5 overflow-hidden bg-white/10">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(4, Math.min(100, row.cell.value * 100))}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "playtype" ? (
          <div className="overflow-hidden border bg-black/50" style={{ borderColor: frame }}>
            {board.playtype.map((row, i) => (
              <div
                key={row.id}
                className="space-y-1.5 px-2.5 py-2.5"
                style={i > 0 ? { borderTop: `1px solid ${line}` } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`${nameOxanium.className} min-w-0 flex-1 text-[11px] font-extrabold`}
                    style={{ transform: "skewX(-6deg)" }}
                  >
                    {row.short}
                  </span>
                  <HowPtsCol display={row.pts.display} />
                  <MetricStack
                    display={row.ppp.display}
                    rank={row.ppp.rank}
                    accent={accent}
                    unit="PPP"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden bg-white/10">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, row.freq.value * 100 * 1.2))}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                  <span className={`${nameOxanium.className} w-10 text-right text-[10px] font-bold tabular-nums text-white/55`}>
                    {row.freq.display}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "shooting" ? (
          <div className="space-y-3.5 border bg-black/40 px-3 py-3" style={{ borderColor: frame }}>
            {board.shooting.map((row) => (
              <div key={row.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`${nameOxanium.className} min-w-0 flex-1 text-[12px] font-bold uppercase tracking-wide text-white/88`}>
                    {isJa ? row.labelJa : row.labelEn}
                  </span>
                  <HowPtsCol display={row.pts.display} />
                  <MetricStack
                    display={row.cell.display}
                    rank={row.cell.rank}
                    accent={accent}
                  />
                </div>
                <CyberSlantedSegBar
                  pct={leagueRankSegPct(row.cell.rank)}
                  segments={LEAGUE_RANK_SEGMENTS}
                  compact
                  accent={{
                    border: accent,
                    glow: hexToRgba(accent, 0.34),
                    bg: accent,
                  }}
                  forceStatic
                />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "clutch" ? (
          <div
            className="grid grid-cols-3 overflow-hidden border bg-black/50"
            style={{ borderColor: frame }}
          >
            {board.clutch.map((row, i) => (
              <div
                key={row.id}
                className="px-2.5 py-3"
                style={i < board.clutch.length - 1 ? { borderRight: `1px solid ${line}` } : undefined}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                    {row.short}
                  </span>
                  <RankTag
                    rank={row.cell.rank}
                    accent={accent}
                    className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  />
                </div>
                <p
                  className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  {row.cell.display}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "defense" ? (
          <HintRow
            rows={board.defense}
            selectedId={defenseId}
            onSelect={setDefenseId}
            accent={accent}
            isJa={isJa}
          />
        ) : null}

        {tab === "hustle" ? (
          <HintRow
            rows={board.hustle}
            selectedId={hustleId}
            onSelect={setHustleId}
            accent={accent}
            isJa={isJa}
          />
        ) : null}

        {tab === "tracking" ? (
          <HintRow
            rows={board.tracking}
            selectedId={trackId}
            onSelect={setTrackId}
            accent={accent}
            isJa={isJa}
          />
        ) : null}
      </section>
    </div>
  );
}
