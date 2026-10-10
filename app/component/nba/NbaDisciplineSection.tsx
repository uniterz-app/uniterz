"use client";

import { nameOxanium } from "@/lib/fonts";
import type { NbaDisciplineDetailSlice } from "@/lib/nba/discipline/disciplineTypes";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineHasPlayoffs,
  disciplineSectionCopy,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "@/lib/nba/discipline/disciplineDetailCells";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function CellRow({
  cells,
  accent,
}: {
  cells: NbaDisciplineCell[];
  accent: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {cells.map((c) => (
        <div
          key={c.key}
          className="min-w-0 space-y-0.5 border bg-black/40 px-1.5 py-2"
          style={{ borderColor: hexToRgba(accent, 0.3) }}
        >
          <p
            className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/55`}
          >
            {c.label}
          </p>
          <p
            className={`${nameOxanium.className} text-[17px] font-extrabold tabular-nums`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {c.display}
          </p>
          {c.rank != null ? (
            <p
              className={`${nameOxanium.className} text-[9px] font-bold tabular-nums text-white/40`}
            >
              #{c.rank}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** チーム詳細 / 選手詳細の TECH・FLAG・EJECT・FINES */
export function NbaDisciplineSection({
  slice,
  accent,
  isJa,
  leagueRows,
  teamId,
  showPlayerNames = false,
  onPlayerClick,
}: {
  slice: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  /** チーム詳細: リーグ表の行（順位表示用） */
  leagueRows?: readonly NbaLeagueTeamStatRow[];
  teamId?: string;
  /** チーム詳細: 罰金内訳に選手名を出す */
  showPlayerNames?: boolean;
  onPlayerClick?: (playerId: string) => void;
}) {
  const copy = disciplineSectionCopy(isJa);
  const regular = buildDisciplineCells(slice.regular, { leagueRows, teamId });
  const playoffs = disciplineHasPlayoffs(slice)
    ? buildDisciplineCells(slice.playoffs)
    : null;
  const fines = disciplineFineLines(slice);

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
      </div>

      {playoffs ? (
        <p
          className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/45`}
        >
          {copy.regular}
        </p>
      ) : null}
      <CellRow cells={regular} accent={accent} />

      {playoffs ? (
        <>
          <p
            className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/45`}
          >
            {copy.playoffs}
          </p>
          <CellRow cells={playoffs} accent={accent} />
        </>
      ) : null}

      {fines.length > 0 ? (
        <div
          className="border bg-black/40"
          style={{ borderColor: hexToRgba(accent, 0.3) }}
        >
          {fines.map((f, i) => (
            <div
              key={f.key}
              className="flex items-start gap-2 px-2.5 py-1.5 text-[11px]"
              style={
                i > 0
                  ? { borderTop: `1px solid ${hexToRgba(accent, 0.15)}` }
                  : undefined
              }
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
                <span className="text-white/60">
                  {f.reason}
                  {f.playoffs ? ` (${copy.playoffs})` : ""}
                </span>
              </span>
              <span
                className={`${nameOxanium.className} shrink-0 font-bold tabular-nums text-white`}
              >
                {f.amount}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-[10px] leading-snug text-white/35">{copy.note}</p>
    </section>
  );
}
