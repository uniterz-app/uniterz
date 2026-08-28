/**
 * BDL stats + Firestore games → `nbaTeamAceOutRecords/{seasonKey}`。
 * 公開 API / Pro Insight は Firestore のみ読む。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { ingestNbaGamesFromBdl } from "@/lib/nba/ingest/nbaGamesIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  buildAceOutRecords,
  type AceOutGameInput,
} from "@/lib/nba/insights/buildAceOutRecords";
import {
  pickTeamAcesForIngest,
  playedGameIdsForTeam,
} from "@/lib/nba/insights/pickTeamAces";
import {
  NBA_TEAM_ACE_OUT_RECORDS_COLLECTION,
  type NbaTeamAceOutRecordsBundle,
} from "@/lib/nba/insights/aceOutRecordTypes";
import {
  fetchBdlPlayerGameLogs,
} from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import {
  forEachWithConcurrency,
  NBA_INGEST_CONCURRENCY,
} from "@/lib/async/forEachWithConcurrency";

const MIN_FINAL_GAMES_BEFORE_BDL = 200;

function parseScore(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}

/** BDL stats の `game.id` と突合するため数値 ID に揃える */
function bdlGameIdFromDoc(
  docId: string,
  data: Record<string, unknown>
): string | null {
  const raw = data.bdlGameId;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) return raw.trim();
  const m = docId.match(/^nba-bdl-(\d+)$/);
  return m?.[1] ?? null;
}

function gameFromDoc(
  docId: string,
  data: Record<string, unknown>
): AceOutGameInput | null {
  const status = String(data.status ?? "").toLowerCase();
  if (status !== "final" && status !== "ended" && data.final !== true) {
    return null;
  }
  const gameId = bdlGameIdFromDoc(docId, data);
  if (!gameId) return null;

  const homeTeamId = teamIdFromSide(data.home, data.homeTeamId);
  const awayTeamId = teamIdFromSide(data.away, data.awayTeamId);
  if (!homeTeamId || !awayTeamId) return null;

  let homeScore = parseScore(data.homeScore);
  let awayScore = parseScore(data.awayScore);
  if (
    (homeScore == null || awayScore == null) &&
    data.score &&
    typeof data.score === "object"
  ) {
    const s = data.score as { home?: unknown; away?: unknown };
    homeScore = homeScore ?? parseScore(s.home);
    awayScore = awayScore ?? parseScore(s.away);
  }
  if (homeScore == null || awayScore == null) return null;

  return {
    gameId,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    seasonPhase: String(data.seasonPhase ?? data.season_type ?? "regular"),
  };
}

async function loadAceOutGames(
  db: Firestore,
  seasonKey: string
): Promise<AceOutGameInput[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .get();

  const games: AceOutGameInput[] = [];
  for (const doc of snap.docs) {
    const g = gameFromDoc(doc.id, doc.data() as Record<string, unknown>);
    if (g) games.push(g);
  }
  return games;
}

export type IngestNbaTeamAceOutRecordsInput = {
  seasonKey?: string;
  force?: boolean;
  /** games が薄いとき BDL から取る（既定 true） */
  fetchFromBdlIfSparse?: boolean;
  minGp?: number;
};

export type IngestNbaTeamAceOutRecordsResult = {
  ok: true;
  seasonKey: string;
  teamCount: number;
  gameCount: number;
  aceCount: number;
  source: string;
  sample: Array<{
    teamId: string;
    ace: string;
    whenOut: string;
    gamesOut: number;
  }>;
};

export async function ingestNbaTeamAceOutRecords(
  db: Firestore,
  input: IngestNbaTeamAceOutRecordsInput = {}
): Promise<IngestNbaTeamAceOutRecordsResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const inProgress = seasonKey === CURRENT_NBA_SEASON_KEY;
  const minGp =
    input.minGp ??
    (inProgress ? 5 : 20);
  const fetchBdl = input.fetchFromBdlIfSparse !== false;

  let games = await loadAceOutGames(db, seasonKey);
  let source = "games+bdl-stats";

  if (
    fetchBdl &&
    (input.force ||
      (!inProgress && games.length < MIN_FINAL_GAMES_BEFORE_BDL) ||
      (inProgress && games.length === 0))
  ) {
    await ingestNbaGamesFromBdl(db, {
      seasonKey,
      rebuildTeamGameLogs: false,
    });
    games = await loadAceOutGames(db, seasonKey);
    source = "bdl+games+bdl-stats";
  }

  const { aces, statsByPlayerId } = await pickTeamAcesForIngest(
    db,
    seasonKey,
    { minGp }
  );
  const playedGameIdsByPlayer: Record<string, Set<string>> = {};

  await forEachWithConcurrency(aces, NBA_INGEST_CONCURRENCY, async (ace) => {
    let rows = statsByPlayerId[ace.playerId];
    if (!rows) {
      const bdlId = Number(ace.playerId);
      if (!Number.isFinite(bdlId)) {
        playedGameIdsByPlayer[ace.playerId] = new Set();
        return;
      }
      try {
        rows = await fetchBdlPlayerGameLogs({
          bdlPlayerId: bdlId,
          seasonYear,
          seasonType: "regular",
        });
      } catch (e) {
        console.warn(
          `[ace-out] stats failed player=${ace.playerId}`,
          e instanceof Error ? e.message : e
        );
        playedGameIdsByPlayer[ace.playerId] = new Set();
        return;
      }
    }
    playedGameIdsByPlayer[ace.playerId] = playedGameIdsForTeam(
      rows,
      ace.teamId
    );
  });

  const bundle = buildAceOutRecords({
    seasonKey,
    games,
    aces,
    playedGameIdsByPlayer,
    source,
  });

  await writeAceOutRecordsBundle(db, bundle);

  return {
    ok: true,
    seasonKey,
    teamCount: Object.keys(bundle.teams).length,
    gameCount: bundle.gameCount,
    aceCount: aces.length,
    source: bundle.source,
    sample: Object.values(bundle.teams)
      .filter((t) =>
        [
          "nba-warriors",
          "nba-76ers",
          "nba-raptors",
          "nba-magic",
          "nba-heat",
          "nba-pelicans",
          "nba-jazz",
          "nba-nuggets",
        ].includes(t.teamId)
      )
      .map((t) => ({
        teamId: t.teamId,
        ace: `${t.acePlayerName} (${t.acePpg}ppg)`,
        whenOut: `${t.whenOut.wins}-${t.whenOut.losses}`,
        pts: `${t.whenOutPtsFor}-${t.whenOutPtsAgainst} (team ${t.teamPtsFor}-${t.teamPtsAgainst})`,
        gamesOut: t.gamesOut,
        players: (t.players ?? []).map(
          (p) =>
            `${p.playerName} [${p.source}] out ${p.whenOut.wins}-${p.whenOut.losses} · ${p.whenOutPtsFor}-${p.whenOutPtsAgainst}`
        ),
      })),
  };
}

export async function writeAceOutRecordsBundle(
  db: Firestore,
  bundle: NbaTeamAceOutRecordsBundle
): Promise<void> {
  await db
    .collection(NBA_TEAM_ACE_OUT_RECORDS_COLLECTION)
    .doc(bundle.seasonKey)
    .set({
      seasonKey: bundle.seasonKey,
      teams: bundle.teams,
      gameCount: bundle.gameCount,
      builtAtMs: bundle.builtAtMs,
      source: bundle.source,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function loadAceOutRecordsBundle(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamAceOutRecordsBundle | null> {
  const snap = await db
    .collection(NBA_TEAM_ACE_OUT_RECORDS_COLLECTION)
    .doc(seasonKey.trim())
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const teams = data.teams;
  if (!teams || typeof teams !== "object") return null;
  return {
    seasonKey: String(data.seasonKey ?? seasonKey),
    teams: teams as NbaTeamAceOutRecordsBundle["teams"],
    gameCount: Number(data.gameCount) || 0,
    builtAtMs: Number(data.builtAtMs) || 0,
    source: String(data.source ?? "firestore"),
  };
}
