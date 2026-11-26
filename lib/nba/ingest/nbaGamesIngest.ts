import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames } from "@/lib/nba/bdl/fetchBdlGames";
import { mapBdlGameToNbaGameDoc } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { ingestNbaTeamGameLogsFromGames } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { writeGameDayIndexFromGames } from "@/lib/games/server/gameDayIndexAdmin";
import { stableJsonHash } from "@/lib/nba/ingest/stableJsonHash";

/** 既存 ingestHash の読み取りを 1 回の getAll にまとめる件数 */
const EXISTING_HASH_READ_CHUNK = 300;

export type IngestNbaGamesResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  fetched: number;
  mapped: number;
  written: number;
  /** 前回と同じ内容なので書かなかった試合数（`ingestHash` 一致） */
  unchanged?: number;
  skipped: number;
  dryRun: boolean;
  sampleIds: string[];
  /** 日付ストリップ用 `gameDayIndex` の distinct 開始時刻数 */
  gameDayIndex?: {
    startCount: number;
  };
  /** games 書き込み後に組んだチーム詳細用スナップショット */
  teamGameLogs?: {
    teamCount: number;
    gameCount: number;
  };
};

/**
 * BDL games → Firestore `games/{nba-bdl-*}`.
 * 過去の Final でも `final: true` は立てない（精算トリガー暴発防止）。
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
  let unchanged = 0;
  let skipped = fetchedCount - mapped.length;

  if (!dryRun) {
    // 前回書いた内容（ingestHash）と同じ試合は書かない。
    // final はライブ ingest だけが立てる。merge で false に戻さない。
    const entries = mapped.map((g) => {
      const { startAtMs, startAtJstIso, id: _id, final: _final, ...rest } = g;
      return {
        id: g.id,
        rest,
        startAtMs,
        startAtJstIso,
        hash: stableJsonHash({ rest, startAtMs, startAtJstIso }),
      };
    });

    // ライブ ingest も同じ status / スコアを書くので、前回の日次の内容と一致していても
    // 今の Firestore 上の値がずれていれば書き直す（従来どおり BDL の値に戻す）
    const prevById = new Map<string, { hash: string | null; state: string }>();
    for (let i = 0; i < entries.length; i += EXISTING_HASH_READ_CHUNK) {
      const refs = entries
        .slice(i, i + EXISTING_HASH_READ_CHUNK)
        .map((e) => db.collection("games").doc(e.id));
      const snaps = await db.getAll(...refs, {
        fieldMask: ["ingestHash", "status", "homeScore", "awayScore", "score"],
      });
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const h = snap.get("ingestHash");
        prevById.set(snap.id, {
          hash: typeof h === "string" ? h : null,
          state: stableJsonHash({
            status: snap.get("status") ?? null,
            homeScore: snap.get("homeScore") ?? null,
            awayScore: snap.get("awayScore") ?? null,
            score: snap.get("score") ?? null,
          }),
        });
      }
    }

    const changed = entries.filter((e) => {
      const prev = prevById.get(e.id);
      if (!prev || prev.hash !== e.hash) return true;
      const wantState = stableJsonHash({
        status: e.rest.status ?? null,
        homeScore: e.rest.homeScore ?? null,
        awayScore: e.rest.awayScore ?? null,
        score: e.rest.score ?? null,
      });
      return prev.state !== wantState;
    });
    unchanged = entries.length - changed.length;

    for (let i = 0; i < changed.length; i += batchSize) {
      const chunk = changed.slice(i, i + batchSize);
      const batch = db.batch();
      for (const e of chunk) {
        const ref = db.collection("games").doc(e.id);
        const startAt = Timestamp.fromMillis(e.startAtMs);
        batch.set(
          ref,
          {
            ...e.rest,
            startAt,
            startAtJst: startAt,
            updatedAt: Timestamp.now(),
            ingestedAt: Timestamp.now(),
            startAtJstIso: e.startAtJstIso,
            ingestHash: e.hash,
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

  let gameDayIndex: IngestNbaGamesResult["gameDayIndex"];
  if (!dryRun) {
    const idx = await writeGameDayIndexFromGames(db, {
      league: "nba",
      season: seasonKey,
    });
    gameDayIndex = { startCount: idx.startCount };
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
    unchanged,
    skipped,
    dryRun,
    sampleIds: mapped.slice(0, 8).map((g) => g.id),
    gameDayIndex,
    teamGameLogs,
  };
}
