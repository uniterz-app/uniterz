/**
 * NBA 公式ルール（Rule 12A Section VII）の定額罰金をテクニカル・退場の回数から計算する。
 *
 * - レギュラー TECH: 1-5 $2,000 / 6-10 $3,000 / 11-15 $4,000 / 16+ $5,000
 *   16 回目と以降 2 回ごと（18, 20…）に 1 試合出場停止
 * - プレーオフ TECH（回数リセット）: 1-2 $2,000 / 3-4 $3,000 / 5-6 $4,000 / 7+ $5,000
 *   7 回目と以降 2 回ごと（9, 11…）に 1 試合出場停止
 * - 退場: 1 回目 $2,000、以降は前回 + $2,000（プレーオフで $2,000 に戻る）
 * - プレーイン: TECH・退場とも 1 件 $2,000、回数に数えない
 *
 * 取り消されたテクニカル・NBA カップ決勝の例外・コミッショナー裁量の罰金は反映しない（後者は手入力）。
 */
import type {
  NbaDisciplineSeasonType,
  NbaGameDisciplineEvent,
} from "@/lib/nba/discipline/disciplineTypes";

export type NbaDisciplineScheduleGame = {
  date: string;
  seasonType: NbaDisciplineSeasonType;
  events: readonly NbaGameDisciplineEvent[];
};

export type NbaScheduledDisciplineFine = {
  playerId: string;
  teamId: string;
  phase: NbaDisciplineSeasonType;
  amountUsd: number;
};

/** テクニカル累積による 1 試合出場停止（コート上の行為） */
export type NbaScheduledTechSuspension = {
  playerId: string;
  teamId: string;
  phase: NbaDisciplineSeasonType;
  /** 累積に達した試合の日付 */
  date: string;
};

export type NbaDisciplineScheduleResult = {
  fines: NbaScheduledDisciplineFine[];
  suspensions: NbaScheduledTechSuspension[];
  /** レギュラーシーズンの日数（初日〜最終日を含む。CBA の日割り年俸用。不明は 0） */
  regularSeasonDays: number;
};

const FLAT_FINE_USD = 2_000;
const DAY_MS = 86_400_000;

function techFineUsd(nth: number, phase: NbaDisciplineSeasonType): number {
  const tiers = phase === "playoffs" ? [2, 4, 6] : [5, 10, 15];
  if (nth <= tiers[0]!) return 2_000;
  if (nth <= tiers[1]!) return 3_000;
  if (nth <= tiers[2]!) return 4_000;
  return 5_000;
}

function techTriggersSuspension(nth: number, phase: NbaDisciplineSeasonType): boolean {
  const first = phase === "playoffs" ? 7 : 16;
  return nth >= first && (nth - first) % 2 === 0;
}

function countByDate(
  games: readonly NbaDisciplineScheduleGame[],
  phase: NbaDisciplineSeasonType
): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of games) {
    if (g.seasonType === phase && g.date) m.set(g.date, (m.get(g.date) ?? 0) + 1);
  }
  return m;
}

/** レギュラー最終日（全チーム出場の日）と 1 回戦初日（4 試合） */
function seasonBoundaries(games: readonly NbaDisciplineScheduleGame[]) {
  const regular = countByDate(games, "regular");
  const playoffs = countByDate(games, "playoffs");
  const regularDates = [...regular.keys()].sort();
  const lastFullRegularDay = [...regular]
    .filter(([, n]) => n >= 8)
    .map(([d]) => d)
    .sort()
    .at(-1);
  const firstRoundDay = [...playoffs]
    .filter(([, n]) => n >= 4)
    .map(([d]) => d)
    .sort()[0];
  return { firstRegularDay: regularDates[0], lastFullRegularDay, firstRoundDay };
}

export function scheduledDisciplineFines(
  games: readonly NbaDisciplineScheduleGame[]
): NbaDisciplineScheduleResult {
  const { firstRegularDay, lastFullRegularDay, firstRoundDay } = seasonBoundaries(games);
  const isPlayIn = (date: string) =>
    !!lastFullRegularDay &&
    !!firstRoundDay &&
    date > lastFullRegularDay &&
    date < firstRoundDay;

  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  const techN = new Map<string, number>();
  const ejectN = new Map<string, number>();
  const fines: NbaScheduledDisciplineFine[] = [];
  const suspensions: NbaScheduledTechSuspension[] = [];

  for (const g of sorted) {
    const phase: NbaDisciplineSeasonType =
      g.seasonType === "playoffs" ? "playoffs" : "regular";
    const playIn = isPlayIn(g.date);
    for (const ev of g.events) {
      if (ev.k === "flag") continue;
      let amountUsd = FLAT_FINE_USD;
      if (!playIn) {
        const key = `${phase}:${ev.p}`;
        const counter = ev.k === "tech" ? techN : ejectN;
        const nth = (counter.get(key) ?? 0) + 1;
        counter.set(key, nth);
        amountUsd = ev.k === "tech" ? techFineUsd(nth, phase) : FLAT_FINE_USD * nth;
        // レギュラー最終日の 16 回目は翌季・プレーオフに持ち越さない
        const carriesOver = phase === "playoffs" || g.date !== lastFullRegularDay;
        if (ev.k === "tech" && techTriggersSuspension(nth, phase) && carriesOver) {
          suspensions.push({ playerId: ev.p, teamId: ev.t, phase, date: g.date });
        }
      }
      fines.push({ playerId: ev.p, teamId: ev.t, phase, amountUsd });
    }
  }

  const regularSeasonDays =
    firstRegularDay && lastFullRegularDay
      ? Math.round(
          (Date.parse(`${lastFullRegularDay}T00:00:00Z`) -
            Date.parse(`${firstRegularDay}T00:00:00Z`)) /
            DAY_MS
        ) + 1
      : 0;

  return { fines, suspensions, regularSeasonDays };
}
