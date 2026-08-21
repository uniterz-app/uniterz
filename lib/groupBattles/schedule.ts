/**
 * 大会スケジュール導出（募集・開催 → weeklyLabels / monthlyRange）。
 * 週間ラベルは月曜 dateKey（JST）。正: docs/group-battle-design.md
 */

import { subtractDaysFromDateKeyJST } from "@/lib/rankings/rankSnapshotDate";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

/** `YYYY-MM-DD` または `YYYY-MM-DDTHH:mm`（JST 想定）→ ms */
export function parseJstDateTimeToMs(raw: string): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (DATE_KEY_RE.test(s)) {
    const t = Date.parse(`${s}T00:00:00+09:00`);
    return Number.isFinite(t) ? t : null;
  }
  // datetime-local: 2026-11-01T12:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const normalized = s.length === 16 ? `${s}:00` : s.slice(0, 19);
    const t = Date.parse(`${normalized}+09:00`);
    return Number.isFinite(t) ? t : null;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function dateKeyFromMsJst(ms: number): string {
  const jst = new Date(ms + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${pad2(jst.getUTCMonth() + 1)}-${pad2(
    jst.getUTCDate()
  )}`;
}

/** その日を含む週の月曜 dateKey（JST 暦） */
export function mondayOfDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  // UTC noon of that calendar day ≈ JST date for weekday math
  const utc = Date.UTC(y!, m! - 1, d!, 12, 0, 0);
  const dow = new Date(utc).getUTCDay(); // 0=Sun
  const daysSinceMonday = (dow + 6) % 7;
  return subtractDaysFromDateKeyJST(dateKey, daysSinceMonday);
}

/**
 * 開催期間に重なる月曜ラベルを列挙（原則最大 4、短縮・延長は実日数に従う）。
 * 週の一部だけ開催にかかってもその月曜を含める。
 */
export function deriveWeeklyLabels(args: {
  battleStartKey: string;
  battleEndKey: string;
  maxWeeks?: number;
}): string[] {
  const { battleStartKey, battleEndKey, maxWeeks = 8 } = args;
  if (battleStartKey > battleEndKey) return [];

  let monday = mondayOfDateKey(battleStartKey);
  // その月曜週が開催開始より前で完全に終わっているなら次週へ
  while (addDaysToDateKey(monday, 6) < battleStartKey) {
    monday = addDaysToDateKey(monday, 7);
  }

  const labels: string[] = [];
  while (monday <= battleEndKey && labels.length < maxWeeks) {
    labels.push(monday);
    monday = addDaysToDateKey(monday, 7);
  }
  return labels;
}

export function deriveMonthlyRange(args: {
  battleStartKey: string;
  battleEndKey: string;
  label?: string;
}): { startKey: string; endKey: string; label: string } {
  const label =
    args.label?.trim() ||
    `${args.battleStartKey.slice(0, 7)}_battle`;
  return {
    startKey: args.battleStartKey,
    endKey: args.battleEndKey,
    label,
  };
}

export type DerivedBattleSchedule = {
  recruitStartAtMs: number;
  recruitEndAtMs: number;
  battleStartAtMs: number;
  battleEndAtMs: number;
  battleStartKey: string;
  battleEndKey: string;
  weeklyLabels: string[];
  monthlyRange: { startKey: string; endKey: string; label: string };
};

export function deriveBattleSchedule(input: {
  recruitStartAt: string;
  recruitEndAt: string;
  battleStartAt: string;
  battleEndAt: string;
  monthlyLabel?: string;
}): { ok: true; schedule: DerivedBattleSchedule } | { ok: false; error: string } {
  const recruitStartAtMs = parseJstDateTimeToMs(input.recruitStartAt);
  const recruitEndAtMs = parseJstDateTimeToMs(input.recruitEndAt);
  const battleStartAtMs = parseJstDateTimeToMs(input.battleStartAt);
  const battleEndAtMs = parseJstDateTimeToMs(input.battleEndAt);

  if (
    recruitStartAtMs == null ||
    recruitEndAtMs == null ||
    battleStartAtMs == null ||
    battleEndAtMs == null
  ) {
    return { ok: false, error: "invalid_datetime" };
  }
  if (recruitStartAtMs >= recruitEndAtMs) {
    return { ok: false, error: "recruit_range_invalid" };
  }
  if (battleStartAtMs >= battleEndAtMs) {
    return { ok: false, error: "battle_range_invalid" };
  }
  if (recruitEndAtMs > battleStartAtMs) {
    return { ok: false, error: "recruit_must_end_before_battle" };
  }

  const battleStartKey = dateKeyFromMsJst(battleStartAtMs);
  const battleEndKey = dateKeyFromMsJst(battleEndAtMs);
  const weeklyLabels = deriveWeeklyLabels({ battleStartKey, battleEndKey });
  if (weeklyLabels.length === 0) {
    return { ok: false, error: "no_weekly_labels" };
  }

  return {
    ok: true,
    schedule: {
      recruitStartAtMs,
      recruitEndAtMs,
      battleStartAtMs,
      battleEndAtMs,
      battleStartKey,
      battleEndKey,
      weeklyLabels,
      monthlyRange: deriveMonthlyRange({
        battleStartKey,
        battleEndKey,
        label: input.monthlyLabel,
      }),
    },
  };
}
