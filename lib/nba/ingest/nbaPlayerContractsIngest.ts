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
import { mapBdlToPlayerContractSummary } from "@/lib/nba/playerDetail/mapBdlToPlayerContract";
import { writePlayerContractSnapshot } from "@/lib/nba/playerContract/loadPlayerContractSnapshot";
import { recomputePlayerSalaryRanks } from "@/lib/nba/playerContract/recomputePlayerSalaryRanks";
import { listActiveRosterPlayerRefs } from "@/lib/nba/ingest/listActiveRosterPlayerRefs";
import {
  forEachWithConcurrency,
  NBA_INGEST_CONCURRENCY,
} from "@/lib/async/forEachWithConcurrency";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

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
    targets = targets.filter((t) => want.has(t.playerId));
    // ロスター外でも明示指定は取りに行く
    for (const id of filterIds) {
      if (!targets.some((t) => t.playerId === id)) {
        targets.push({ playerId: id, teamId: "", position: "—" });
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
        const bdlId = Number.parseInt(target.playerId, 10);
        if (!Number.isFinite(bdlId) || bdlId <= 0) {
          skipped += 1;
          return;
        }
        const seasonRows = seasonRowsByPlayer.get(target.playerId) ?? [];
        const aggregates = await fetchBdlPlayerContractAggregates(bdlId);
        await sleep(50);
        const contract = mapBdlToPlayerContractSummary(seasonRows, aggregates, {
          seasonKey,
          fallbackTeamId: target.teamId || null,
        });
        if (!contract || contract.seasons.length === 0) {
          skipped += 1;
          return;
        }
        await writePlayerContractSnapshot(db, {
          seasonKey,
          playerId: target.playerId,
          teamId: target.teamId || null,
          contract,
        });
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
