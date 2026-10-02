/**
 * BDL → Firestore `nbaPlayerContracts/{season}/players/{playerId}`。
 * 公開 API は Firestore のみ読む。
 */
import type { Firestore } from "firebase-admin/firestore";
import { requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlAllTeamContracts } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import type { BdlTeamContractRow } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import { fetchBdlPlayerContractAggregates } from "@/lib/nba/bdl/fetchBdlPlayerContracts";
import type { BdlPlayerContractAggregate } from "@/lib/nba/bdl/fetchBdlPlayerContracts";
import { mapBdlToPlayerContractSummary } from "@/lib/nba/playerDetail/mapBdlToPlayerContract";
import { writePlayerContractSnapshot } from "@/lib/nba/playerContract/loadPlayerContractSnapshot";
import { recomputePlayerSalaryRanks } from "@/lib/nba/playerContract/recomputePlayerSalaryRanks";
import { listActiveRosterPlayerRefs } from "@/lib/nba/ingest/listActiveRosterPlayerRefs";
import { forEachWithConcurrency } from "@/lib/async/forEachWithConcurrency";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { playerIdLookupSet } from "@/lib/nba/playerIdAliases";

export const NBA_PLAYER_CONTRACTS_INGEST_READY = true;

/** 今季〜先の年次行をチーム契約 API でまとめて取る年数 */
const CONTRACT_YEAR_HORIZON = 7;

export type NbaPlayerContractsIngestInput = {
  seasonKey?: string;
  /** 指定時はそのプレイヤーだけ */
  playerIds?: string[];
  maxPlayers?: number;
};

export type NbaPlayerContractsIngestResult = {
  ok: true;
  seasonKey: string;
  attempted: number;
  written: number;
  skipped: number;
  failed: number;
  salaryRanks: {
    playersScanned: number;
    playersUpdated: number;
    playersRanked: number;
    seasonYears: number[];
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function playerIdFromRow(row: BdlTeamContractRow): string | null {
  const raw = row.player_id ?? row.player?.id;
  if (raw == null) return null;
  const id = String(raw).trim();
  return id || null;
}

async function loadSeasonRowsByPlayer(
  seasonYear: number
): Promise<Map<string, BdlTeamContractRow[]>> {
  const byPlayer = new Map<string, BdlTeamContractRow[]>();
  for (let y = seasonYear; y < seasonYear + CONTRACT_YEAR_HORIZON; y += 1) {
    const byTeam = await fetchBdlAllTeamContracts(y);
    for (const rows of byTeam.values()) {
      for (const row of rows) {
        const pid = playerIdFromRow(row);
        if (!pid) continue;
        const list = byPlayer.get(pid) ?? [];
        list.push(row);
        byPlayer.set(pid, list);
      }
    }
    await sleep(60);
  }
  return byPlayer;
}

function seasonRowsForPlayer(
  byPlayer: Map<string, BdlTeamContractRow[]>,
  playerId: string
): BdlTeamContractRow[] {
  const out: BdlTeamContractRow[] = [];
  const seen = new Set<string>();
  for (const id of playerIdLookupSet(playerId)) {
    for (const row of byPlayer.get(id) ?? []) {
      const key = String(row.id ?? `${row.season}-${row.base_salary}-${row.cap_hit}`);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export async function ingestNbaPlayerContractsFromBdl(
  db: Firestore,
  input: NbaPlayerContractsIngestInput = {}
): Promise<NbaPlayerContractsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);

  let targets = await listActiveRosterPlayerRefs(db, seasonKey);
  const filterIds = (input.playerIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  if (filterIds.length > 0) {
    const want = new Set(filterIds);
    // エイリアス指定でもロスター本体を拾う
    targets = targets.filter((t) =>
      playerIdLookupSet(t.playerId).some((id) => want.has(id))
    );
    // ロスター外でも明示指定は取りに行く
    for (const id of filterIds) {
      if (!targets.some((t) => playerIdLookupSet(t.playerId).includes(id))) {
        targets.push({ playerId: id, teamId: "", position: "—", draftYear: null });
      }
    }
  }
  if (
    typeof input.maxPlayers === "number" &&
    Number.isFinite(input.maxPlayers) &&
    input.maxPlayers > 0
  ) {
    targets = targets.slice(0, Math.trunc(input.maxPlayers));
  }

  const seasonRowsByPlayer = await loadSeasonRowsByPlayer(seasonYear);

  let written = 0;
  let skipped = 0;
  let failed = 0;

  await forEachWithConcurrency(
    targets,
    3,
    async (target) => {
      try {
        const lookupIds = playerIdLookupSet(target.playerId);
        let aggregates: BdlPlayerContractAggregate[] = [];
        let anyValidBdlId = false;
        for (const id of lookupIds) {
          const bdlId = Number.parseInt(id, 10);
          if (!Number.isFinite(bdlId) || bdlId <= 0) continue;
          anyValidBdlId = true;
          const rows = await fetchBdlPlayerContractAggregates(bdlId);
          await sleep(50);
          if (rows.length > 0) {
            aggregates = rows;
            break;
          }
        }
        if (!anyValidBdlId) {
          skipped += 1;
          return;
        }

        const seasonRows = seasonRowsForPlayer(
          seasonRowsByPlayer,
          target.playerId
        );
        const contract = mapBdlToPlayerContractSummary(seasonRows, aggregates, {
          seasonKey,
          fallbackTeamId: target.teamId || null,
        });
        if (!contract || contract.seasons.length === 0) {
          skipped += 1;
          return;
        }
        // ロスター ID + 契約側別名 ID の両方に書く（詳細リンクどちらでも読める）
        for (const id of lookupIds) {
          await writePlayerContractSnapshot(db, {
            seasonKey,
            playerId: id,
            teamId: target.teamId || null,
            contract,
          });
        }
        written += 1;
      } catch (e) {
        failed += 1;
        console.error(
          `[nba-player-contracts-ingest] player=${target.playerId}`,
          e
        );
      }
    }
  );

  // 年俸リーグ順位の正 = 年俸ソート（BDL rank は使わない）
  console.log(
    `[nba-player-contracts-ingest] recompute salary ranks season=${seasonKey}`
  );
  const ranks = await recomputePlayerSalaryRanks(db, seasonKey);

  return {
    ok: true,
    seasonKey,
    attempted: targets.length,
    written,
    skipped,
    failed,
    salaryRanks: {
      playersScanned: ranks.playersScanned,
      playersUpdated: ranks.playersUpdated,
      playersRanked: ranks.playersRanked,
      seasonYears: ranks.seasonYears,
    },
  };
}
