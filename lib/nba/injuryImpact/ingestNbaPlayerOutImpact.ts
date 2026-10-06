/**
 * BDL `/nba/v1/stats`（サーバーのみ）+ Firestore `games` → `nbaPlayerOutImpact/{seasonKey}`。
 * γ・λ は scripts/nba-injury-impact-fit.ts の実測値で固定し、そのシーズンだけ fit する。
 * Pro Insight は Firestore のみ読む。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import { bdlNbaGetJson, type BdlListResponse } from "@/lib/nba/bdl/bdlNbaFetch";
import { bdlSeasonYearFromSeasonKey, requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  buildOutImpactObservations,
  fitOutImpact,
  outImpactHomeCourt,
  outImpactOfPlayer,
  type OutImpactGame,
  type OutImpactPlayer,
  type OutImpactStatRow,
} from "@/lib/nba/injuryImpact/fitPlayerOutImpact";
import { OUT_IMPACT_GAMMA, OUT_IMPACT_LAMBDA } from "@/lib/nba/injuryImpact/fittedOutImpact";
import {
  NBA_PLAYER_OUT_IMPACT_COLLECTION,
  playerOutImpactKey,
  type NbaPlayerOutImpact,
  type NbaPlayerOutImpactBundle,
} from "@/lib/nba/injuryImpact/playerOutImpactTypes";

const MAX_STAT_PAGES = 600;

const US_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type BdlStatRow = {
  min?: string | number | null;
  pts?: number | null;
  reb?: number | null;
  ast?: number | null;
  stl?: number | null;
  blk?: number | null;
  turnover?: number | null;
  player?: { id?: number; first_name?: string; last_name?: string } | null;
  team?: { id?: number; abbreviation?: string | null } | null;
  game?: { id?: number } | null;
};

function parseMinutes(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    const mm = Number(m);
    const ss = Number(sec);
    return Number.isFinite(mm) ? mm + (Number.isFinite(ss) ? ss / 60 : 0) : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function teamIdOf(raw: Record<string, unknown>, side: "home" | "away"): string {
  const nested = raw[side] as { teamId?: unknown } | undefined;
  return String(raw[`${side}TeamId`] ?? nested?.teamId ?? "").trim();
}

/** BDL stats の `game.id` と突合する数値 ID */
function bdlGameIdOf(docId: string, raw: Record<string, unknown>): string | null {
  const v = raw.bdlGameId;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return v.trim();
  return docId.match(/^nba-bdl-(\d+)$/)?.[1] ?? null;
}

async function loadSeasonFinalGames(db: Firestore, seasonKey: string): Promise<OutImpactGame[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .get();
  const out: OutImpactGame[] = [];
  for (const doc of snap.docs) {
    const raw = doc.data() as Record<string, unknown>;
    if (String(raw.seasonPhase ?? "regular").toLowerCase() !== "regular") continue;
    if (resolveGameStatus(raw) !== "final") continue;
    const id = bdlGameIdOf(doc.id, raw);
    const start = resolveGameStartAt(raw);
    const score = resolveGameScore(raw);
    const homeTeamId = teamIdOf(raw, "home");
    const awayTeamId = teamIdOf(raw, "away");
    if (!id || !start || !score || !homeTeamId || !awayTeamId) continue;
    out.push({
      id,
      seasonKey,
      startMs: start.getTime(),
      usDate: US_DATE_FORMAT.format(start),
      homeTeamId,
      awayTeamId,
      homeScore: score.home,
      awayScore: score.away,
    });
  }
  return out;
}

async function fetchSeasonStatRows(seasonYear: number): Promise<OutImpactStatRow[]> {
  const out: OutImpactStatRow[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < MAX_STAT_PAGES; page++) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>("/nba/v1/stats", {
      "seasons[]": seasonYear,
      postseason: false,
      per_page: 100,
      ...(cursor != null ? { cursor } : {}),
    });
    const chunk = Array.isArray(body.data) ? body.data : [];
    for (const r of chunk) {
      const min = parseMinutes(r.min);
      if (min <= 0 || r.player?.id == null || r.game?.id == null) continue;
      const abbr = String(r.team?.abbreviation ?? "").trim().toUpperCase();
      const teamId =
        (typeof r.team?.id === "number" ? rememberBdlTeamId(r.team.id, abbr) : null) ??
        appTeamIdFromBdlAbbreviation(abbr);
      if (!teamId) continue;
      out.push({
        gameId: String(r.game.id),
        teamId,
        playerId: String(r.player.id),
        playerName: `${r.player.first_name ?? ""} ${r.player.last_name ?? ""}`.trim(),
        min,
        pts: r.pts ?? 0,
        reb: r.reb ?? 0,
        ast: r.ast ?? 0,
        stocks: (r.stl ?? 0) + (r.blk ?? 0),
        tov: r.turnover ?? 0,
      });
    }
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type IngestNbaPlayerOutImpactResult = {
  ok: true;
  seasonKey: string;
  gameCount: number;
  playerCount: number;
  top: Array<{ player: string; teamId: string; impact: number; gamesOut: number }>;
};

export async function ingestNbaPlayerOutImpact(
  db: Firestore,
  input: { seasonKey?: string } = {}
): Promise<IngestNbaPlayerOutImpactResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const games = await loadSeasonFinalGames(db, seasonKey);

  const players: OutImpactPlayer[] = [];
  const out: Record<string, NbaPlayerOutImpact> = {};
  let homeCourt = 0;
  if (games.length > 0) {
    const stats = await fetchSeasonStatRows(bdlSeasonYearFromSeasonKey(seasonKey));
    const obs = buildOutImpactObservations(seasonKey, games, stats, players);
    const fit = fitOutImpact(obs, players, { lambda: OUT_IMPACT_LAMBDA, gamma: OUT_IMPACT_GAMMA });
    homeCourt = round1(outImpactHomeCourt(fit));
    players.forEach((p, pi) => {
      const { prior, total } = outImpactOfPlayer(fit, players, pi);
      out[playerOutImpactKey(p.teamId, p.playerId)] = {
        playerId: p.playerId,
        playerName: p.playerName,
        teamId: p.teamId,
        games: p.games,
        mpg: round1(p.x[0]!),
        ppg: round1(p.x[1]!),
        gamesOut: p.gamesOut,
        statPrior: round1(prior),
        impact: round1(total),
      };
    });
  }

  const teamGames: Record<string, number> = {};
  for (const g of games) {
    teamGames[g.homeTeamId] = (teamGames[g.homeTeamId] ?? 0) + 1;
    teamGames[g.awayTeamId] = (teamGames[g.awayTeamId] ?? 0) + 1;
  }

  const bundle: NbaPlayerOutImpactBundle = {
    seasonKey,
    players: out,
    gameCount: games.length,
    teamGames,
    homeCourt,
    lambda: OUT_IMPACT_LAMBDA,
    builtAtMs: Date.now(),
    source: "games+bdl-stats",
  };
  await db
    .collection(NBA_PLAYER_OUT_IMPACT_COLLECTION)
    .doc(seasonKey)
    .set({ ...bundle, updatedAt: FieldValue.serverTimestamp() });

  return {
    ok: true,
    seasonKey,
    gameCount: games.length,
    playerCount: Object.keys(out).length,
    top: Object.values(out)
      .sort((a, b) => a.impact - b.impact)
      .slice(0, 10)
      .map((p) => ({ player: p.playerName, teamId: p.teamId, impact: p.impact, gamesOut: p.gamesOut })),
  };
}

export async function loadPlayerOutImpactBundle(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerOutImpactBundle | null> {
  const snap = await db.collection(NBA_PLAYER_OUT_IMPACT_COLLECTION).doc(seasonKey.trim()).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!data.players || typeof data.players !== "object") return null;
  return {
    seasonKey: String(data.seasonKey ?? seasonKey),
    players: data.players as NbaPlayerOutImpactBundle["players"],
    gameCount: Number(data.gameCount) || 0,
    teamGames:
      data.teamGames && typeof data.teamGames === "object"
        ? (data.teamGames as Record<string, number>)
        : {},
    homeCourt: Number(data.homeCourt) || 0,
    lambda: Number(data.lambda) || 0,
    builtAtMs: Number(data.builtAtMs) || 0,
    source: String(data.source ?? "firestore"),
  };
}
