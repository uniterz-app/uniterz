"use client";

import { useEffect, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import type {
  NbaDisciplineDetailSlice,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineHasPlayoffs,
  disciplineHasRecords,
  disciplinePlayerRows,
  disciplineSectionCopy,
  NBA_DISCIPLINE_COLLAPSED_ROWS,
  NBA_DISCIPLINE_HOT_RANK,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "@/lib/nba/discipline/disciplineDetailCells";
import { useNbaTeamDisciplineSeason } from "@/lib/nba/discipline/useNbaTeamDisciplineSeason";
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
}: {
  cells: NbaDisciplineCell[];
  accent: string;
  leagueLabel: string;
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
              className={`${nameOxanium.className} text-[9px] font-bold tabular-nums`}
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

function ExpandButton({
  expanded,
  total,
  onToggle,
  accent,
  copy,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
  accent: string;
  copy: ReturnType<typeof disciplineSectionCopy>;
}) {
  if (total <= NBA_DISCIPLINE_COLLAPSED_ROWS) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${nameOxanium.className} w-full py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.14em]`}
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
  showPlayerNames = false,
  onPlayerClick,
  season,
}: {
  /** null = 年切替の読み込み中 / データなし */
  slice: NbaDisciplineDetailSlice | null;
  accent: string;
  isJa: boolean;
  /** チーム詳細: 罰金ログに選手名を出す */
  showPlayerNames?: boolean;
  onPlayerClick?: (playerId: string) => void;
  /** チーム詳細: ◀ 25-26 ▶ */
  season?: {
    seasonKey: string;
    seasonKeys: readonly string[];
    onChange: (seasonKey: string) => void;
    loading: boolean;
  };
}) {
  const copy = disciplineSectionCopy(isJa);
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
  const fines = slice ? disciplineFineLines(slice, activePhase) : [];
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
        <p className="py-4 text-center text-[11px] text-white/40">
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

          <CellRow cells={cells} accent={accent} leagueLabel={copy.league} />

          {empty ? (
            <p className="py-2 text-center text-[11px] text-white/40">{copy.empty}</p>
          ) : null}

          {shownPlayers.length > 0 ? (
            <div className="space-y-1.5">
              <p className={SUB_LABEL}>{copy.players}</p>
              <div className="border bg-black/40" style={boxStyle}>
                <div
                  className={`${nameOxanium.className} grid grid-cols-[minmax(0,1fr)_26px_26px_26px_30px_52px] gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40`}
                >
                  <span>{copy.player}</span>
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
                      className="truncate text-left"
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
                />
              </div>
            </div>
          ) : null}

          {shownFines.length > 0 ? (
            <div className="space-y-1.5">
              <p className={SUB_LABEL}>
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
                          className={`${nameOxanium.className} mr-1.5 font-bold text-white`}
                          onClick={() => onPlayerClick?.(f.playerId)}
                        >
                          {f.playerName}
                        </button>
                      ) : null}
                      <span className={f.suspension ? "text-white/80" : "text-white/60"}>
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
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      <p className="text-[10px] leading-snug text-white/35">{copy.note}</p>
    </section>
  );
}

/** チーム詳細: 年切替付き */
export function NbaTeamDisciplineSection({
  teamId,
  initial,
  accent,
  isJa,
  onPlayerClick,
}: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  onPlayerClick?: (playerId: string) => void;
}) {
  const s = useNbaTeamDisciplineSeason({ teamId, initial });
  return (
    <NbaDisciplineSection
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      showPlayerNames
      onPlayerClick={onPlayerClick}
      season={{
        seasonKey: s.seasonKey,
        seasonKeys: s.seasonKeys,
        onChange: s.setSeasonKey,
        loading: s.loading,
      }}
    />
  );
}
