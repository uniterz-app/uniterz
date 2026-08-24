/**
 * 年俸リーグ順位の正:
 * BDL contracts `rank` は欠番・0 が多いので使わない。
 * Firestore の capHit/baseSalary をシーズン年ごとに降順ソートして 1..N。
 *
 * - 同チーム・同額の重複行は小さい playerId だけを順位対象（壊れた二重 ID 対策）
 * - 順位対象外は salaryRank=0（UI は非表示）
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

function salaryForRank(row: NbaPlayerContractSeason): number {
  const n = Number(row.capHit || row.baseSalary || 0);
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

function dedupeKey(year: number, teamId: string, salary: number): string {
  return `${year}|${teamId}|${salary}`;
}

/**
 * 各シーズン年について年俸降順で 1..N。
 * 同額は playerId 昇順。同チーム同額の重複 ID は最小 ID のみランク対象。
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
      teamId: string;
      salary: number;
      idx: number;
    };
    const cands: Cand[] = [];
    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i]!;
      const seasonRow = e.seasons.find((s) => s.season === year);
      if (!seasonRow) continue;
      const salary = salaryForRank(seasonRow);
      if (salary <= 0) continue;
      cands.push({
        playerId: e.playerId,
        teamId: String(seasonRow.teamId || ""),
        salary,
        idx: i,
      });
    }

    // 同チーム・同額の重複は最小 playerId のみ残す
    const bestByDedupe = new Map<string, Cand>();
    for (const c of cands) {
      const key = dedupeKey(year, c.teamId, c.salary);
      const prev = bestByDedupe.get(key);
      if (!prev || comparePlayerId(c.playerId, prev.playerId) < 0) {
        bestByDedupe.set(key, c);
      }
    }
    const rows = [...bestByDedupe.values()];
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
