/**
 * 週次: チームペイロール + プレイヤー契約（キャリアは重いので手動 / 別バッチ）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { ingestNbaTeamPayrollFromBdl } from "@/lib/nba/ingest/nbaTeamPayrollIngest";
import { ingestNbaPlayerContractsFromBdl } from "@/lib/nba/ingest/nbaPlayerContractsIngest";

export type NbaStatsWeeklyIngestResult = {
  ok: boolean;
  seasonKey: string;
  startedAt: string;
  finishedAt: string;
  steps: Array<{
    id: string;
    ok: boolean;
    ms: number;
    result?: unknown;
    error?: string;
  }>;
};

async function runStep(id: string, fn: () => Promise<unknown>) {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { id, ok: true, ms: Date.now() - t0, result };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[nba-stats-weekly-ingest] step=${id}`, e);
    return { id, ok: false, ms: Date.now() - t0, error };
  }
}

export async function runNbaStatsWeeklyIngest(
  db: Firestore,
  input: { seasonKey?: string; contractMaxPlayers?: number } = {}
): Promise<NbaStatsWeeklyIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const startedAt = new Date().toISOString();
  const steps = [];

  steps.push(
    await runStep("team-payroll", () =>
      ingestNbaTeamPayrollFromBdl(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("player-contracts", () =>
      ingestNbaPlayerContractsFromBdl(db, {
        seasonKey,
        maxPlayers:
          typeof input.contractMaxPlayers === "number" &&
          Number.isFinite(input.contractMaxPlayers) &&
          input.contractMaxPlayers > 0
            ? Math.trunc(input.contractMaxPlayers)
            : undefined,
      })
    )
  );

  const finishedAt = new Date().toISOString();
  return {
    ok: steps.every((s) => s.ok),
    seasonKey,
    startedAt,
    finishedAt,
    steps,
  };
}
