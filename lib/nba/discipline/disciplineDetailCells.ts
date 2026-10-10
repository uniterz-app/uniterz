/**
 * チーム詳細 / 選手詳細の DISCIPLINE セクション（Web / Native 共通の表示データ）。
 */
import type {
  NbaDisciplineCounts,
  NbaDisciplineDetailSlice,
  NbaDisciplineRanks,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";
import type { Language } from "@/lib/i18n/language";
import {
  formatDisciplineFineUsd,
  formatDisciplineFineUsdFull,
} from "@/lib/nba/discipline/formatDisciplineFineUsd";

export const NBA_DISCIPLINE_SECTION_TITLE = "DISCIPLINE";

/** 選手表・罰金ログの折りたたみ時の件数 */
export const NBA_DISCIPLINE_COLLAPSED_ROWS = 5;

/** この順位以内はアクセント色で強調 */
export const NBA_DISCIPLINE_HOT_RANK = 5;

export type NbaDisciplineCell = {
  key: keyof NbaDisciplineCounts;
  label: string;
  display: string;
  /** リーグ順位（多い順・1 始まり）。値 0 は null */
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

export function buildDisciplineCells(
  counts: NbaDisciplineCounts,
  ranks?: NbaDisciplineRanks
): NbaDisciplineCell[] {
  return CELL_ORDER.map((key) => ({
    key,
    label: CELL_LABELS[key],
    display:
      key === "fines"
        ? formatDisciplineFineUsd(counts.fines)
        : String(Math.round(counts[key])),
    rank: ranks?.[key] ?? null,
  }));
}

function countsTotal(c: NbaDisciplineCounts): number {
  return c.tech + c.flag + c.eject + c.susp + c.fines;
}

export function disciplineHasPlayoffs(slice: NbaDisciplineDetailSlice): boolean {
  return countsTotal(slice.playoffs) > 0;
}

export function disciplineHasRecords(
  slice: NbaDisciplineDetailSlice,
  phase: NbaDisciplineSeasonType
): boolean {
  return (
    countsTotal(slice[phase]) > 0 || slice.fines.some((f) => f.seasonType === phase)
  );
}

export type NbaDisciplinePlayerRow = {
  playerId: string;
  name: string;
  tech: string;
  flag: string;
  eject: string;
  susp: string;
  fines: string;
};

/** チーム詳細の選手別（罰金 → TECH の多い順。記録 0 の選手は出さない） */
export function disciplinePlayerRows(
  slice: NbaDisciplineDetailSlice,
  phase: NbaDisciplineSeasonType
): NbaDisciplinePlayerRow[] {
  const dash = (n: number) => (n > 0 ? String(Math.round(n)) : "–");
  return (slice.players ?? [])
    .map((p) => ({ p, c: p[phase] }))
    .filter(({ c }) => countsTotal(c) > 0)
    .sort(
      (a, b) =>
        b.c.fines - a.c.fines ||
        b.c.tech - a.c.tech ||
        a.p.name.localeCompare(b.p.name)
    )
    .map(({ p, c }) => ({
      playerId: p.playerId,
      name: p.name,
      tech: dash(c.tech),
      flag: dash(c.flag),
      eject: dash(c.eject),
      susp: dash(c.susp),
      fines: c.fines > 0 ? formatDisciplineFineUsd(c.fines) : "–",
    }));
}

export type NbaDisciplineFineLine = {
  key: string;
  date: string;
  playerId: string;
  playerName: string;
  amount: string;
  reason: string;
  suspension: boolean;
};

/** 個別罰金・出場停止のログ（新しい順。テクニカル定額分は含まない） */
export function disciplineFineLines(
  slice: NbaDisciplineDetailSlice,
  phase: NbaDisciplineSeasonType,
  lang: Language
): NbaDisciplineFineLine[] {
  return slice.fines
    .filter((f) => f.seasonType === phase)
    .map((f, i) => {
      const reason = f.reasonI18n?.[lang] ?? f.reason;
      return {
        key: `${f.date}-${f.playerId}-${i}`,
        date: f.date.slice(5).replace("-", "/"),
        playerId: f.playerId,
        playerName: f.playerName,
        amount: formatDisciplineFineUsdFull(f.amountUsd),
        reason:
          f.kind === "suspension"
            ? [`SUSP ${f.games ?? 0}G`, reason].filter(Boolean).join(" · ")
            : reason,
        suspension: f.kind === "suspension",
      };
    });
}

export function disciplineSectionCopy(isJa: boolean) {
  return {
    regular: "SEASON",
    playoffs: "PLAYOFFS",
    players: isJa ? "選手別" : "PLAYERS",
    player: isJa ? "選手" : "PLAYER",
    fineLog: isJa ? "罰金・出場停止" : "FINES & SUSPENSIONS",
    league: isJa ? "リーグ" : "LG",
    showAll: (n: number) => (isJa ? `すべて表示（${n}）` : `SHOW ALL (${n})`),
    showLess: isJa ? "閉じる" : "SHOW LESS",
    empty: isJa ? "このシーズンの記録はありません" : "No discipline records this season",
    loading: isJa ? "読み込み中…" : "Loading…",
    note: isJa
      ? "テクニカル・フラグラント・退場は試合記録から集計（コーチ除く・取り消し分は差し引き・プレーインは数えない）。罰金はテクニカル・退場の規定額（NBA ルール）、出場停止で失った年俸（CBA）、リーグ発表分の合計。"
      : "Techs, flagrants and ejections from play-by-play (coaches excluded, rescinded techs removed, play-in not counted). Fines = NBA rulebook tech/ejection schedule, salary lost to suspensions (CBA) and league-announced fines.",
  };
}
