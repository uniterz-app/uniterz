import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames } from "@/lib/nba/bdl/fetchBdlGames";
import { mapBdlGameToNbaGameDoc } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { ingestNbaTeamGameLogsFromGames } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";

export type IngestNbaGamesResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  fetched: number;
  mapped: number;
  written: number;
  skipped: number;
  dryRun: boolean;
  sampleIds: string[];
  /** games 書き込み後に組んだチーム詳細用スナップショット */
  teamGameLogs?: {
    teamCount: number;
    gameCount: number;
  };
};

/**
 * BDL games → Firestore `games/{nba-bdl-*}`.
 * 過去の Final でも `final: true` は立てない（onGameFinalV2 暴発防止）。
 * 表示は `status: "final"` + scores で足りる。
 */
export async function ingestNbaGamesFromBdl(
  db: Firestore,
  input: {
    seasonKey: string;
    dryRun?: boolean;
    /** 既定 400。Firestore batch 上限内でチャンク */
    batchSize?: number;
    /** 既定 true。games 書き込み後に nbaTeamGameLogs を再構築 */
    rebuildTeamGameLogs?: boolean;
  }
): Promise<IngestNbaGamesResult> {
  const seasonKey = input.seasonKey.trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const dryRun = input.dryRun === true;
  const batchSize = Math.min(400, Math.max(1, input.batchSize ?? 400));
  const rebuildTeamGameLogs = input.rebuildTeamGameLogs !== false;

  /** 省略時は非プレシーズンのみ。プレは season_type=preseason で別取得。 */
  const [mainFetched, preseasonFetched] = await Promise.all([
    fetchBdlGames({ seasonYears: [seasonYear] }),
    fetchBdlGames({ seasonYears: [seasonYear], seasonType: "preseason" }),
  ]);

  const byId = new Map<
    number,
    NonNullable<ReturnType<typeof mapBdlGameToNbaGameDoc>>
  >();
  for (const g of mainFetched) {
    const mapped = mapBdlGameToNbaGameDoc(g);
    if (mapped) byId.set(g.id, mapped);
  }
  for (const g of preseasonFetched) {
    const mapped = mapBdlGameToNbaGameDoc(g, { seasonType: "preseason" });
    if (mapped) byId.set(g.id, mapped);
  }

  const mapped = [...byId.values()];
  const fetchedCount = mainFetched.length + preseasonFetched.length;

  let written = 0;
  let skipped = fetchedCount - mapped.length;

  if (!dryRun) {
    for (let i = 0; i < mapped.length; i += batchSize) {
      const chunk = mapped.slice(i, i + batchSize);
      const batch = db.batch();
      for (const g of chunk) {
        const ref = db.collection("games").doc(g.id);
        const { startAtMs, startAtJstIso, id: _id, ...rest } = g;
        const startAt = Timestamp.fromMillis(startAtMs);
        batch.set(
          ref,
          {
            ...rest,
            startAt,
            startAtJst: startAt,
            updatedAt: Timestamp.now(),
            ingestedAt: Timestamp.now(),
            startAtJstIso,
          },
          { merge: true }
        );
      }
      await batch.commit();
      written += chunk.length;
    }
  } else {
    written = 0;
  }

  let teamGameLogs: IngestNbaGamesResult["teamGameLogs"];
  if (!dryRun && rebuildTeamGameLogs) {
    const logs = await ingestNbaTeamGameLogsFromGames(db, { seasonKey });
    teamGameLogs = {
      teamCount: logs.teamCount,
      gameCount: logs.gameCount,
    };
  }

  return {
    ok: true,
    seasonKey,
    seasonYear,
    fetched: fetchedCount,
    mapped: mapped.length,
    written: dryRun ? 0 : written,
    skipped,
    dryRun,
    sampleIds: mapped.slice(0, 8).map((g) => g.id),
    teamGameLogs,
  };
}
