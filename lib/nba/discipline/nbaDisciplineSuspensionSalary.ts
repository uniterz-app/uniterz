/**
 * 出場停止で失う年俸（CBA Article VI Section 1）。
 *
 * - 20 試合未満の停止: 1 試合につき Base Compensation の 1/145
 * - 20 試合以上の停止: 1 試合につき 1/110
 * - 2023 CBA（2023-24〜）: シーズン最初の出場停止がコート上の行為による 1 試合停止なら日割り（1/レギュラー日数）
 *
 * 年俸は出場停止のあった選手だけ BDL `/nba/v1/contracts/players` から取り、
 * `nbaPlayerSeasonSalaries/{seasonKey}` にキャッシュする（サーバー専用・集計時のみ）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlPlayerContractSeasons } from "@/lib/nba/bdl/fetchBdlPlayerContracts";

export const NBA_PLAYER_SEASON_SALARIES_COLLECTION = "nbaPlayerSeasonSalaries";

const PER_DAY_RULE_FIRST_SEASON_YEAR = 2023;

export type NbaSuspensionForSalary = {
  /** 呼び出し側の識別子（手入力 doc id など） */
  id: string;
  playerId: string;
  date: string;
  games: number;
  onCourt: boolean;
  /** 手入力の年俸。BDL より優先 */
  salaryUsd?: number;
};

/** 年俸キャッシュを読み、無い選手だけ BDL から取って追記する。契約行が無ければ 0 */
export async function ensureNbaPlayerSeasonSalaries(
  db: Firestore,
  seasonKey: string,
  playerIds: readonly string[]
): Promise<Map<string, number>> {
  const ref = db.collection(NBA_PLAYER_SEASON_SALARIES_COLLECTION).doc(seasonKey);
  const snap = await ref.get();
  const cached = ((snap.exists ? snap.get("salaries") : null) ?? {}) as Record<string, number>;
  const out = new Map<string, number>(Object.entries(cached));
  const missing = [...new Set(playerIds)].filter((id) => !out.has(id));
  if (missing.length === 0) return out;

  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const added: Record<string, number> = {};
  for (const id of missing) {
    const pid = Number(id);
    if (!Number.isFinite(pid)) continue;
    try {
      const rows = await fetchBdlPlayerContractSeasons(pid, [seasonYear]);
      const base = rows
        .filter((r) => r.season === seasonYear)
        .reduce((max, r) => Math.max(max, Number(r.base_salary ?? r.total_cash ?? 0) || 0), 0);
      added[id] = base;
      out.set(id, base);
    } catch (e) {
      console.error(`[nba-discipline] salary player=${id} season=${seasonKey}`, e);
    }
  }
  if (Object.keys(added).length > 0) {
    await ref.set(
      { seasonKey, salaries: { ...cached, ...added }, updatedAtMs: Date.now() },
      { merge: true }
    );
  }
  return out;
}

/** id → 失った年俸（USD・整数） */
export function suspensionLostSalaryUsd(
  seasonKey: string,
  suspensions: readonly NbaSuspensionForSalary[],
  salaries: ReadonlyMap<string, number>,
  regularSeasonDays: number
): Map<string, number> {
  const perDayRule =
    bdlSeasonYearFromSeasonKey(seasonKey) >= PER_DAY_RULE_FIRST_SEASON_YEAR &&
    regularSeasonDays > 0;
  const firstByPlayer = new Map<string, string>();
  for (const s of [...suspensions].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!firstByPlayer.has(s.playerId)) firstByPlayer.set(s.playerId, s.id);
  }

  const out = new Map<string, number>();
  for (const s of suspensions) {
    const salary = s.salaryUsd ?? salaries.get(s.playerId) ?? 0;
    const games = Math.max(0, Math.trunc(s.games));
    if (salary <= 0 || games === 0) {
      out.set(s.id, 0);
      continue;
    }
    let lost = (salary / (games >= 20 ? 110 : 145)) * games;
    if (perDayRule && s.onCourt && games === 1 && firstByPlayer.get(s.playerId) === s.id) {
      lost = salary / regularSeasonDays;
    }
    out.set(s.id, Math.round(lost));
  }
  return out;
}
