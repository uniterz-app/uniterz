"use client";

import { useEffect, useId, useState } from "react";
import { jp, nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import type {
  NbaDisciplineDetailSlice,
  NbaDisciplineHistoryPoint,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineFinePartRows,
  disciplineHasPlayoffs,
  disciplineHasRecords,
  disciplinePlayerRows,
  disciplineSectionCopy,
  disciplineSourceLine,
  NBA_DISCIPLINE_COLLAPSED_ROWS,
  NBA_DISCIPLINE_HOT_RANK,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "@/lib/nba/discipline/disciplineDetailCells";
import {
  buildDisciplineTrend,
  NBA_DISCIPLINE_TREND_METRICS,
  type NbaDisciplineTrendMetric,
} from "@/lib/nba/discipline/disciplineTrend";
import { formatDisciplineFineUsd } from "@/lib/nba/discipline/formatDisciplineFineUsd";
import { useNbaDisciplineHistory } from "@/lib/nba/discipline/useNbaDisciplineHistory";
import ResultDetailScoreDonut from "@/app/component/result/ResultDetailScoreDonut";
import {
  useNbaPlayerDisciplineSeason,
  useNbaTeamDisciplineSeason,
} from "@/lib/nba/discipline/useNbaTeamDisciplineSeason";
import NbaLeagueStatsSeasonNav from "@/app/component/stats/NbaLeagueStatsSeasonNav";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const SUB_LABEL = `${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/45`;

function CellRow({
  cells,
  accent,
  leagueLabel,
  ja,
}: {
  cells: NbaDisciplineCell[];
  accent: string;
  leagueLabel: string;
  ja: boolean;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {cells.map((c) => {
        const hot = c.rank != null && c.rank <= NBA_DISCIPLINE_HOT_RANK;
        return (
          <div
            key={c.key}
            className="min-w-0 space-y-0.5 border bg-black/40 px-1.5 py-2"
            style={{
              borderColor: hexToRgba(accent, hot ? 0.6 : 0.3),
              boxShadow: hot ? `inset 0 -2px 0 ${hexToRgba(accent, 0.7)}` : undefined,
            }}
          >
            <p
              className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/55`}
            >
              {c.label}
            </p>
            <p
              className={`${nameOxanium.className} truncate text-[17px] font-extrabold tabular-nums`}
              style={{ transform: "skewX(-8deg)" }}
            >
              {c.display}
            </p>
            <p
              className={`${ja ? jp.className : nameOxanium.className} text-[9px] font-bold tabular-nums`}
              style={{ color: hot ? accent : "rgba(255,255,255,0.35)" }}
            >
              {c.rank != null ? `${leagueLabel} #${c.rank}` : "\u00a0"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PhaseToggle({
  phase,
  onChange,
  accent,
  labels,
}: {
  phase: NbaDisciplineSeasonType;
  onChange: (p: NbaDisciplineSeasonType) => void;
  accent: string;
  labels: Record<NbaDisciplineSeasonType, string>;
}) {
  return (
    <div className="flex gap-4">
      {(["regular", "playoffs"] as const).map((p) => {
        const on = p === phase;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`${nameOxanium.className} border-b-2 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors`}
            style={{
              borderColor: on ? accent : "transparent",
              color: on ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          >
            {labels[p]}
          </button>
        );
      })}
    </div>
  );
}

const TREND_FRAME = { width: 320, height: 128, padX: 18, padTop: 20, padBottom: 20 };

function TrendChart({
  points,
  phase,
  accent,
  selectedSeason,
  onSelectSeason,
  title,
  totalLabel,
  subLabel,
}: {
  points: NbaDisciplineHistoryPoint[];
  phase: NbaDisciplineSeasonType;
  accent: string;
  selectedSeason: string | null;
  onSelectSeason?: (season: string) => void;
  title: string;
  totalLabel: string;
  subLabel: string;
}) {
  const [metric, setMetric] = useState<NbaDisciplineTrendMetric>("tech");
  const gradId = useId().replace(/:/g, "");
  const trend = buildDisciplineTrend(points, phase, metric, TREND_FRAME);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className={subLabel}>{title}</p>
        <p className={`${nameOxanium.className} text-[10px] font-bold tabular-nums text-white/55`}>
          <span className={subLabel}>{totalLabel}</span>{" "}
          <span className="text-white">{trend.total}</span>
        </p>
      </div>
      <div className="border bg-black/40 px-2 pb-1.5 pt-2" style={{ borderColor: hexToRgba(accent, 0.3) }}>
        <div className="flex gap-3.5 px-1">
          {NBA_DISCIPLINE_TREND_METRICS.map((m) => {
            const on = m.key === metric;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`${nameOxanium.className} border-b-2 pb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors`}
                style={{
                  borderColor: on ? accent : "transparent",
                  color: on ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <svg
          viewBox={`0 0 ${TREND_FRAME.width} ${TREND_FRAME.height}`}
          className="mt-1 block h-auto w-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.32} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <line
            x1={0}
            x2={TREND_FRAME.width}
            y1={trend.baselineY}
            y2={trend.baselineY}
            stroke={hexToRgba(accent, 0.2)}
            strokeWidth={1}
          />
          {trend.area ? (
            <path d={trend.area} fill={`url(#${gradId})`} style={{ transition: "d 420ms ease" }} />
          ) : null}
          <path
            d={trend.line}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "d 420ms ease", filter: `drop-shadow(0 0 4px ${hexToRgba(accent, 0.55)})` }}
          />
          {trend.dots.map((d) => {
            const on = d.season === selectedSeason;
            return (
              <g
                key={d.season}
                onClick={() => onSelectSeason?.(d.season)}
                className={onSelectSeason ? "cursor-pointer" : undefined}
              >
                <circle cx={d.x} cy={d.y} r={14} fill="transparent" />
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={on ? 4.5 : 3}
                  fill={on ? accent : "#050508"}
                  stroke={accent}
                  strokeWidth={1.5}
                  style={{ transition: "cy 420ms ease" }}
                />
                <text
                  x={d.x}
                  y={d.y - 8}
                  textAnchor="middle"
                  className={nameOxanium.className}
                  fontSize={9}
                  fontWeight={700}
                  fill={on ? "#fff" : "rgba(255,255,255,0.55)"}
                >
                  {d.display}
                </text>
                <text
                  x={d.x}
                  y={TREND_FRAME.height - 5}
                  textAnchor="middle"
                  className={nameOxanium.className}
                  fontSize={8.5}
                  fontWeight={700}
                  fill={on ? accent : "rgba(255,255,255,0.35)"}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function FineBreakdown({
  rows,
  total,
  accent,
  title,
  subLabel,
  bodyLang,
}: {
  rows: ReturnType<typeof disciplineFinePartRows>;
  total: number;
  accent: string;
  title: string;
  subLabel: string;
  bodyLang: Language;
}) {
  return (
    <div className="space-y-1.5">
      <p className={subLabel}>{title}</p>
      <div
        className="flex items-center gap-3 border bg-black/40 px-2.5 py-2.5"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        <ResultDetailScoreDonut
          segments={rows.map((r) => ({ value: r.value, color: r.color }))}
          total={total}
          totalDisplay={formatDisciplineFineUsd(total)}
          totalLabel="FINES"
          size={88}
          thickness={12}
        />
        <div className="min-w-0 flex-1 space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0" style={{ backgroundColor: r.color }} />
              <span
                className={`${bodyLang === "ja" ? jp.className : ""} min-w-0 flex-1 text-[11px] font-semibold leading-snug text-slate-100`}
              >
                {r.label}
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={`${nameOxanium.className} block text-[12px] font-extrabold tabular-nums text-white`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  {r.amount}
                </span>
                <span className={`${nameOxanium.className} block text-[9px] font-bold tabular-nums text-white/40`}>
                  {r.pct}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpandButton({
  expanded,
  total,
  onToggle,
  accent,
  copy,
  ja,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
  accent: string;
  copy: ReturnType<typeof disciplineSectionCopy>;
  ja: boolean;
}) {
  if (total <= NBA_DISCIPLINE_COLLAPSED_ROWS) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${ja ? `${jp.className} tracking-[0.04em]` : `${nameOxanium.className} tracking-[0.14em]`} w-full py-1.5 text-center text-[10px] font-bold uppercase`}
      style={{ color: accent, borderTop: `1px solid ${hexToRgba(accent, 0.15)}` }}
    >
      {expanded ? copy.showLess : copy.showAll(total)}
    </button>
  );
}

/** チーム詳細 / 選手詳細の TECH・FLAG・EJECT・SUSP・FINES */
export function NbaDisciplineSection({
  slice,
  accent,
  isJa,
  lang,
  showPlayerNames = false,
  onPlayerClick,
  trend,
  season,
}: {
  /** null = 年切替の読み込み中 / データなし */
  slice: NbaDisciplineDetailSlice | null;
  accent: string;
  isJa: boolean;
  /** 罰金理由の表示言語（省略時は isJa で ja / en） */
  lang?: Language;
  /** チーム詳細: 罰金ログに選手名を出す */
  showPlayerNames?: boolean;
  onPlayerClick?: (playerId: string) => void;
  /** シーズン推移（undefined = 出さない / null = 読み込み中） */
  trend?: NbaDisciplineHistoryPoint[] | null;
  /** チーム詳細: ◀ 25-26 ▶ */
  season?: {
    seasonKey: string;
    seasonKeys: readonly string[];
    onChange: (seasonKey: string) => void;
    loading: boolean;
  };
}) {
  const copy = disciplineSectionCopy(isJa);
  const bodyLang: Language = lang ?? (isJa ? "ja" : "en");
  const jaCls = isJa ? jp.className : "";
  const subLabel = isJa
    ? `${jp.className} text-[9px] font-bold tracking-[0.04em] text-white/45`
    : SUB_LABEL;
  const hasPlayoffs = slice ? disciplineHasPlayoffs(slice) : false;
  const [phase, setPhase] = useState<NbaDisciplineSeasonType>("regular");
  const [playersOpen, setPlayersOpen] = useState(false);
  const [finesOpen, setFinesOpen] = useState(false);

  useEffect(() => {
    setPhase("regular");
    setPlayersOpen(false);
    setFinesOpen(false);
  }, [slice?.season]);

  const activePhase: NbaDisciplineSeasonType = hasPlayoffs ? phase : "regular";
  const cells = slice
    ? buildDisciplineCells(slice[activePhase], slice.ranks?.[activePhase])
    : [];
  const playerRows = slice?.players ? disciplinePlayerRows(slice, activePhase) : [];
  const fines = slice ? disciplineFineLines(slice, activePhase, bodyLang) : [];
  const fineParts = slice ? disciplineFinePartRows(slice, activePhase, bodyLang) : [];
  const trendPoints = trend && trend.length > 1 ? trend : null;
  const shownPlayers = playersOpen
    ? playerRows
    : playerRows.slice(0, NBA_DISCIPLINE_COLLAPSED_ROWS);
  const shownFines = finesOpen ? fines : fines.slice(0, NBA_DISCIPLINE_COLLAPSED_ROWS);
  const empty = slice != null && !disciplineHasRecords(slice, activePhase);
  const boxStyle = { borderColor: hexToRgba(accent, 0.3) };
  const rowBorder = (i: number) =>
    i > 0 ? { borderTop: `1px solid ${hexToRgba(accent, 0.15)}` } : undefined;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <h2
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-white/75`}
        >
          {NBA_DISCIPLINE_SECTION_TITLE}
        </h2>
        <div
          className="h-px flex-1"
          style={{ backgroundColor: hexToRgba(accent, 0.35) }}
        />
        {season ? (
          <NbaLeagueStatsSeasonNav
            seasonKey={season.seasonKey}
            seasonKeys={season.seasonKeys}
            onSeasonChange={season.onChange}
          />
        ) : null}
      </div>

      {!slice ? (
        <p className={`${jaCls} py-4 text-center text-[11px] text-white/40`}>
          {season?.loading ? copy.loading : copy.empty}
        </p>
      ) : (
        <>
          {hasPlayoffs ? (
            <PhaseToggle
              phase={activePhase}
              onChange={setPhase}
              accent={accent}
              labels={{ regular: copy.regular, playoffs: copy.playoffs }}
            />
          ) : null}

          <CellRow cells={cells} accent={accent} leagueLabel={copy.league} ja={isJa} />

          {empty ? (
            <p className={`${jaCls} py-2 text-center text-[11px] text-white/40`}>{copy.empty}</p>
          ) : null}

          {fineParts.length > 0 ? (
            <FineBreakdown
              rows={fineParts}
              total={slice[activePhase].fines}
              accent={accent}
              title={copy.fineBreakdown}
              subLabel={subLabel}
              bodyLang={bodyLang}
            />
          ) : null}

          {shownPlayers.length > 0 ? (
            <div className="space-y-1.5">
              <p className={subLabel}>{copy.players}</p>
              <div className="border bg-black/40" style={boxStyle}>
                <div
                  className={`${nameOxanium.className} grid grid-cols-[minmax(0,1fr)_26px_26px_26px_30px_52px] gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40`}
                >
                  <span className={isJa ? `${jp.className} tracking-[0.04em]` : undefined}>
                    {copy.player}
                  </span>
                  <span className="text-right">T</span>
                  <span className="text-right">F</span>
                  <span className="text-right">E</span>
                  <span className="text-right">SUSP</span>
                  <span className="text-right">FINES</span>
                </div>
                {shownPlayers.map((r) => (
                  <div
                    key={r.playerId}
                    className={`${nameOxanium.className} grid grid-cols-[minmax(0,1fr)_26px_26px_26px_30px_52px] items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold tabular-nums text-white`}
                    style={{ borderTop: `1px solid ${hexToRgba(accent, 0.15)}` }}
                  >
                    <button
                      type="button"
                      className="truncate text-left text-[14px] font-extrabold"
                      style={{ transform: "skewX(-8deg)" }}
                      onClick={() => onPlayerClick?.(r.playerId)}
                    >
                      {r.name}
                    </button>
                    <span className="text-right">{r.tech}</span>
                    <span className="text-right">{r.flag}</span>
                    <span className="text-right">{r.eject}</span>
                    <span className="text-right">{r.susp}</span>
                    <span className="text-right">{r.fines}</span>
                  </div>
                ))}
                <ExpandButton
                  expanded={playersOpen}
                  total={playerRows.length}
                  onToggle={() => setPlayersOpen((v) => !v)}
                  accent={accent}
                  copy={copy}
                  ja={isJa}
                />
              </div>
            </div>
          ) : null}

          {shownFines.length > 0 ? (
            <div className="space-y-1.5">
              <p className={subLabel}>
                {copy.fineLog} · {fines.length}
              </p>
              <div className="border bg-black/40" style={boxStyle}>
                {shownFines.map((f, i) => (
                  <div
                    key={f.key}
                    className="flex items-start gap-2 px-2.5 py-1.5 text-[11px]"
                    style={rowBorder(i)}
                  >
                    <span
                      className={`${nameOxanium.className} w-[38px] shrink-0 font-bold tabular-nums text-white/45`}
                    >
                      {f.date}
                    </span>
                    <span className="min-w-0 flex-1">
                      {showPlayerNames ? (
                        <button
                          type="button"
                          className={`${nameOxanium.className} mr-1.5 block text-[14px] font-extrabold text-white`}
                          style={{ transform: "skewX(-8deg)" }}
                          onClick={() => onPlayerClick?.(f.playerId)}
                        >
                          {f.playerName}
                        </button>
                      ) : null}
                      <span
                        className={`${bodyLang === "ja" ? jp.className : ""} ${f.suspension ? "text-white/80" : "text-white/60"}`}
                      >
                        {f.reason}
                      </span>
                    </span>
                    <span
                      className={`${nameOxanium.className} shrink-0 font-bold tabular-nums`}
                      style={{ color: f.suspension ? accent : "#fff" }}
                    >
                      {f.amount}
                    </span>
                  </div>
                ))}
                <ExpandButton
                  expanded={finesOpen}
                  total={fines.length}
                  onToggle={() => setFinesOpen((v) => !v)}
                  accent={accent}
                  copy={copy}
                  ja={isJa}
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      {trendPoints ? (
        <TrendChart
          points={trendPoints}
          phase={activePhase}
          accent={accent}
          selectedSeason={season?.seasonKey ?? slice?.season ?? null}
          onSelectSeason={season?.onChange}
          title={copy.trend}
          totalLabel={copy.trendTotal}
          subLabel={subLabel}
        />
      ) : null}

      <p className={`${jaCls} text-[10px] leading-snug text-white/35`}>{copy.note}</p>
      <p
        className={`${bodyLang === "ja" ? jp.className : ""} text-[10px] leading-snug text-white/45`}
        suppressHydrationWarning
      >
        {disciplineSourceLine(bodyLang, slice?.updatedAtMs)}
      </p>
    </section>
  );
}

/** チーム詳細: 年切替付き */
export function NbaTeamDisciplineSection({
  teamId,
  initial,
  accent,
  isJa,
  lang,
  onPlayerClick,
}: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  lang?: Language;
  onPlayerClick?: (playerId: string) => void;
}) {
  const s = useNbaTeamDisciplineSeason({ teamId, initial });
  const trend = useNbaDisciplineHistory({ subject: "team", id: teamId, toSeason: initial.season });
  return (
    <NbaDisciplineSection
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      lang={lang}
      showPlayerNames
      onPlayerClick={onPlayerClick}
      trend={trend}
      season={{
        seasonKey: s.seasonKey,
        seasonKeys: s.seasonKeys,
        onChange: s.setSeasonKey,
        loading: s.loading,
      }}
    />
  );
}

/** 選手詳細: 年切替付き */
export function NbaPlayerDisciplineSection({
  playerId,
  initial,
  accent,
  isJa,
  lang,
}: {
  playerId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  lang?: Language;
}) {
  const s = useNbaPlayerDisciplineSeason({ playerId, initial });
  const trend = useNbaDisciplineHistory({ subject: "player", id: playerId, toSeason: initial.season });
  return (
    <NbaDisciplineSection
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      lang={lang}
      trend={trend}
      season={{
        seasonKey: s.seasonKey,
        seasonKeys: s.seasonKeys,
        onChange: s.setSeasonKey,
        loading: s.loading,
      }}
    />
  );
}
