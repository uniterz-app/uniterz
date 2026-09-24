/**
 * 年俸リーグ順位の正:
 * BDL contracts `rank` は欠番・0 が多いので使わない。
 * Firestore の **baseSalary**（なければ capHit）をシーズン年ごとに降順ソートして 1..N。
 *
 * - 同額は小さい playerId を上位（一意な # を全員に付与）
 * - 年俸 0 のみ salaryRank=0（UI は非表示）
 *
 * 以前の「同チーム・同額は最小 ID のみ」除外は、ミニマム複数人や誤チーム突合で
 * 正当な選手（例: DeRozan）の順位が消えるため廃止。
 */
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NbaPlayerContractSeason } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_PLAYER_CONTRACTS_COLLECTION,
  NBA_PLAYER_CONTRACTS_PLAYERS_SUB,
  type NbaPlayerContractDoc,
} from "@/lib/nba/playerContract/playerContractTypes";
import { normalizePlayerContractSeasonKey } from "@/lib/nba/playerContract/loadPlayerContractSnapshot";

export type RecomputePlayerSalaryRanksResult = {
  ok: true;
  seasonKey: string;
  playersScanned: number;
  playersUpdated: number;
  playersRanked: number;
  seasonYears: number[];
};

/** UI の今季年俸と揃える: base 優先 */
function salaryForRank(row: NbaPlayerContractSeason): number {
  const n = Number(row.baseSalary || row.capHit || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 数値 ID 優先（"322" < "17896076"。localeCompare だと逆になる） */
function comparePlayerId(a: string, b: string): number {
  const an = Number.parseInt(a, 10);
  const bn = Number.parseInt(b, 10);
  const aOk = Number.isFinite(an) && an > 0;
  const bOk = Number.isFinite(bn) && bn > 0;
  if (aOk && bOk && an !== bn) return an - bn;
  if (aOk !== bOk) return aOk ? -1 : 1;
  return a.localeCompare(b);
}

/**
 * 各シーズン年について年俸降順で 1..N。
 * 同額は playerId 昇順でタイブレーク（全員に順位を付ける）。
 */
export async function recomputePlayerSalaryRanks(
  db: Firestore,
  seasonKeyInput?: string
): Promise<RecomputePlayerSalaryRanksResult> {
  const seasonKey = normalizePlayerContractSeasonKey(seasonKeyInput);
  const col = db
    .collection(NBA_PLAYER_CONTRACTS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_CONTRACTS_PLAYERS_SUB);

  const snap = await col.get();
  type Entry = {
    ref: DocumentReference;
    playerId: string;
    doc: NbaPlayerContractDoc;
    seasons: NbaPlayerContractSeason[];
  };
  const entries: Entry[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as NbaPlayerContractDoc;
    const seasons = Array.isArray(data.contract?.seasons)
      ? data.contract.seasons
      : [];
    if (seasons.length === 0) continue;
    entries.push({
      ref: docSnap.ref,
      playerId: String(data.playerId || docSnap.id),
      doc: data,
      seasons: seasons.map((s) => ({ ...s, salaryRank: 0 })),
    });
  }

  const years = new Set<number>();
  for (const e of entries) {
    for (const s of e.seasons) {
      if (typeof s.season === "number" && s.season > 0) years.add(s.season);
    }
  }
  const seasonYears = [...years].sort((a, b) => a - b);

  let playersRanked = 0;
  const rankedPlayerIds = new Set<string>();

  for (const year of seasonYears) {
    type Cand = {
      playerId: string;
      salary: number;
      idx: number;
    };
    const rows: Cand[] = [];
    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i]!;
      const seasonRow = e.seasons.find((s) => s.season === year);
      if (!seasonRow) continue;
      const salary = salaryForRank(seasonRow);
      if (salary <= 0) continue;
      rows.push({
        playerId: e.playerId,
        salary,
        idx: i,
      });
    }

    rows.sort((a, b) => {
      if (b.salary !== a.salary) return b.salary - a.salary;
      return comparePlayerId(a.playerId, b.playerId);
    });

    for (let rank = 0; rank < rows.length; rank += 1) {
      const hit = rows[rank]!;
      const seasonRow = entries[hit.idx]!.seasons.find((s) => s.season === year);
      if (seasonRow) {
        seasonRow.salaryRank = rank + 1;
        rankedPlayerIds.add(hit.playerId);
      }
    }
  }
  playersRanked = rankedPlayerIds.size;

  let playersUpdated = 0;
  const batchSize = 400;
  let batch = db.batch();
  let ops = 0;
  const commit = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const e of entries) {
    const before = e.doc.contract.seasons;
    const changed =
      before.length !== e.seasons.length ||
      before.some((s, i) => {
        const n = e.seasons[i];
        return !n || s.season !== n.season || s.salaryRank !== n.salaryRank;
      });
    if (!changed) continue;
    batch.set(
      e.ref,
      {
        contract: { ...e.doc.contract, seasons: e.seasons },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    ops += 1;
    playersUpdated += 1;
    if (ops >= batchSize) await commit();
  }
  await commit();

  return {
    ok: true,
    seasonKey,
    playersScanned: entries.length,
    playersUpdated,
    playersRanked,
    seasonYears,
  };
}
