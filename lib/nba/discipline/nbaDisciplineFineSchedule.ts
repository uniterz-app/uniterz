/**
 * NBA 公式ルール（Rule 12A Section VII）の定額罰金をテクニカル・退場の回数から計算する。
 *
 * - レギュラー TECH: 1-5 $2,000 / 6-10 $3,000 / 11-15 $4,000 / 16+ $5,000
 * - プレーオフ TECH（回数リセット）: 1-2 $2,000 / 3-4 $3,000 / 5-6 $4,000 / 7+ $5,000
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

const FLAT_FINE_USD = 2_000;

function techFineUsd(nth: number, phase: NbaDisciplineSeasonType): number {
  const tiers = phase === "playoffs" ? [2, 4, 6] : [5, 10, 15];
  if (nth <= tiers[0]!) return 2_000;
  if (nth <= tiers[1]!) return 3_000;
  if (nth <= tiers[2]!) return 4_000;
  return 5_000;
}

/** レギュラー最終日（全チーム出場の日）より後、1 回戦初日（4 試合）より前の日付 */
function playInDates(games: readonly NbaDisciplineScheduleGame[]): Set<string> {
  const countBy = (phase: NbaDisciplineSeasonType) => {
    const m = new Map<string, number>();
    for (const g of games) {
      if (g.seasonType === phase && g.date) m.set(g.date, (m.get(g.date) ?? 0) + 1);
    }
    return m;
  };
  const regular = countBy("regular");
  const playoffs = countBy("playoffs");
  const lastFullRegularDay = [...regular]
    .filter(([, n]) => n >= 8)
    .map(([d]) => d)
    .sort()
    .at(-1);
  const firstRoundDay = [...playoffs]
    .filter(([, n]) => n >= 4)
    .map(([d]) => d)
    .sort()[0];
  const out = new Set<string>();
  if (!lastFullRegularDay || !firstRoundDay) return out;
  for (const g of games) {
    if (g.date > lastFullRegularDay && g.date < firstRoundDay) out.add(g.date);
  }
  return out;
}

export function scheduledDisciplineFines(
  games: readonly NbaDisciplineScheduleGame[]
): NbaScheduledDisciplineFine[] {
  const playIn = playInDates(games);
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  const techN = new Map<string, number>();
  const ejectN = new Map<string, number>();
  const out: NbaScheduledDisciplineFine[] = [];

  for (const g of sorted) {
    const phase: NbaDisciplineSeasonType =
      g.seasonType === "playoffs" ? "playoffs" : "regular";
    const isPlayIn = playIn.has(g.date);
    for (const ev of g.events) {
      if (ev.k === "flag") continue;
      let amountUsd = FLAT_FINE_USD;
      if (!isPlayIn) {
        const key = `${phase}:${ev.p}`;
        const counter = ev.k === "tech" ? techN : ejectN;
        const nth = (counter.get(key) ?? 0) + 1;
        counter.set(key, nth);
        amountUsd = ev.k === "tech" ? techFineUsd(nth, phase) : FLAT_FINE_USD * nth;
      }
      out.push({ playerId: ev.p, teamId: ev.t, phase, amountUsd });
    }
  }
  return out;
}
