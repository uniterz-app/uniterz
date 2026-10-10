/**
 * チーム詳細 / 選手詳細の DISCIPLINE セクション（Web / Native 共通の表示データ）。
 */
import type {
  NbaDisciplineCounts,
  NbaDisciplineDetailSlice,
} from "@/lib/nba/discipline/disciplineTypes";
import {
  formatDisciplineFineUsd,
  formatDisciplineFineUsdFull,
} from "@/lib/nba/discipline/formatDisciplineFineUsd";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { NBA_TEAM_DISCIPLINE_METRICS } from "@/lib/nba/discipline/applyDisciplineToLeagueBundles";

export const NBA_DISCIPLINE_SECTION_TITLE = "DISCIPLINE";

export type NbaDisciplineCell = {
  key: keyof NbaDisciplineCounts;
  label: string;
  display: string;
  /** チームのみ: リーグ順位（多い順・1 始まり）。値 0 は null */
  rank: number | null;
};

const CELL_LABELS: Record<keyof NbaDisciplineCounts, string> = {
  tech: "TECH",
  flag: "FLAG",
  eject: "EJECT",
  susp: "SUSP",
  fines: "FINES",
};

const CELL_ORDER: ReadonlyArray<keyof NbaDisciplineCounts> = [
  "tech",
  "flag",
  "eject",
  "susp",
  "fines",
];

function teamRank(
  rows: readonly NbaLeagueTeamStatRow[] | undefined,
  teamId: string | undefined,
  key: keyof NbaDisciplineCounts
): number | null {
  if (!rows?.length || !teamId) return null;
  const field = NBA_TEAM_DISCIPLINE_METRICS.find(([, k]) => k === key)?.[0];
  if (!field) return null;
  const valueOf = (r: NbaLeagueTeamStatRow) => {
    const v = r[field];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  const self = rows.find((r) => r.teamId === teamId);
  if (!self || valueOf(self) <= 0) return null;
  const mine = valueOf(self);
  return rows.filter((r) => valueOf(r) > mine).length + 1;
}

export function buildDisciplineCells(
  counts: NbaDisciplineCounts,
  opts: { leagueRows?: readonly NbaLeagueTeamStatRow[]; teamId?: string } = {}
): NbaDisciplineCell[] {
  return CELL_ORDER.map((key) => ({
    key,
    label: CELL_LABELS[key],
    display:
      key === "fines"
        ? formatDisciplineFineUsd(counts.fines)
        : String(Math.round(counts[key])),
    rank: teamRank(opts.leagueRows, opts.teamId, key),
  }));
}

export function disciplineHasPlayoffs(slice: NbaDisciplineDetailSlice): boolean {
  const p = slice.playoffs;
  return p.tech + p.flag + p.eject + p.susp + p.fines > 0;
}

export type NbaDisciplineFineLine = {
  key: string;
  date: string;
  playerId: string;
  playerName: string;
  amount: string;
  reason: string;
  playoffs: boolean;
};

export function disciplineFineLines(
  slice: NbaDisciplineDetailSlice,
  limit = 8
): NbaDisciplineFineLine[] {
  return slice.fines.slice(0, limit).map((f, i) => ({
    key: `${f.date}-${f.playerId}-${i}`,
    date: f.date.slice(5).replace("-", "/"),
    playerId: f.playerId,
    playerName: f.playerName,
    amount: formatDisciplineFineUsdFull(f.amountUsd),
    reason:
      f.kind === "suspension"
        ? [`SUSP ${f.games ?? 0}G`, f.reason].filter(Boolean).join(" · ")
        : f.reason,
    playoffs: f.seasonType === "playoffs",
  }));
}

export function disciplineSectionCopy(isJa: boolean) {
  return {
    regular: isJa ? "レギュラーシーズン" : "REGULAR SEASON",
    playoffs: isJa ? "プレーオフ" : "PLAYOFFS",
    fines: isJa ? "罰金" : "FINES",
    note: isJa
      ? "テクニカル・フラグラント・退場は試合記録から集計（コーチ除く）。罰金はテクニカル・退場の規定額（NBA ルール）、出場停止で失った年俸（CBA）、リーグ発表分の合計。"
      : "Techs, flagrants and ejections from play-by-play (coaches excluded). Fines = NBA rulebook tech/ejection schedule, salary lost to suspensions (CBA) and league-announced fines.",
  };
}
