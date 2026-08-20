import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  getNbaPlayerStatLeadersMock,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type {
  NbaPlayerStatLeadersFirestoreDoc,
  NbaPlayerStatLeadersSnapshotSource,
} from "./playerStatLeadersTypes";

type CompactPlayer = {
  n: string;
  t: string;
  c: NbaConferenceId;
};

type CompactTuple = [playerId: string, gamesPlayed: number, value: number];

function isConference(v: unknown): v is NbaConferenceId {
  return v === "east" || v === "west";
}

function parsePlayers(
  raw: unknown
): Record<string, CompactPlayer> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, CompactPlayer> = {};
  for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !val || typeof val !== "object") return null;
    const o = val as Record<string, unknown>;
    const n = typeof o.n === "string" ? o.n : "";
    const t = typeof o.t === "string" ? o.t : "";
    const c = o.c;
    if (!n || !t || !isConference(c)) return null;
    out[id] = { n, t, c };
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseTuple(raw: unknown): CompactTuple | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const playerId = typeof raw[0] === "string" ? raw[0] : "";
  const gamesPlayed = typeof raw[1] === "number" && Number.isFinite(raw[1]) ? raw[1] : NaN;
  const value = typeof raw[2] === "number" && Number.isFinite(raw[2]) ? raw[2] : NaN;
  if (!playerId || !Number.isFinite(gamesPlayed) || !Number.isFinite(value)) {
    return null;
  }
  return [playerId, gamesPlayed, value];
}

function parseBoard(
  raw: unknown,
  players: Record<string, CompactPlayer>
): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {} as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
  for (const [metric, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) return null;
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const item of list) {
      const tuple = parseTuple(item);
      if (!tuple) return null;
      const [playerId, gamesPlayed, value] = tuple;
      const meta = players[playerId];
      if (!meta) return null;
      rows.push({
        playerId,
        playerName: meta.n,
        teamId: meta.t,
        conference: meta.c,
        gamesPlayed,
        value,
      });
    }
    out[metric as NbaPlayerLeaderMetricId] = rows;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function collectPlayers(
  bundle: NbaPlayerStatLeadersBundle
): Record<string, CompactPlayer> {
  const players: Record<string, CompactPlayer> = {};
  for (const window of [bundle.season, bundle.last10] as const) {
    for (const rows of Object.values(window)) {
      for (const row of rows) {
        if (!players[row.playerId]) {
          players[row.playerId] = {
            n: row.playerName,
            t: row.teamId,
            c: row.conference,
          };
        }
      }
    }
  }
  return players;
}

function compactBoard(
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
): Record<string, CompactTuple[]> {
  const out: Record<string, CompactTuple[]> = {};
  for (const [metric, rows] of Object.entries(board)) {
    out[metric] = rows.map((r) => [r.playerId, r.gamesPlayed, r.value]);
  }
  return out;
}

export function compactPlayerStatLeadersBundle(
  bundle: NbaPlayerStatLeadersBundle
): {
  players: Record<string, CompactPlayer>;
  season: Record<string, CompactTuple[]>;
  last10: Record<string, CompactTuple[]>;
  asOfLabel: string;
} {
  return {
    players: collectPlayers(bundle),
    season: compactBoard(bundle.season),
    last10: compactBoard(bundle.last10),
    asOfLabel: bundle.asOfLabel,
  };
}

export function bundleFromFirestoreData(
  data: NbaPlayerStatLeadersFirestoreDoc
): NbaPlayerStatLeadersBundle | null {
  const players = parsePlayers(data.players);
  if (!players) return null;
  const season = parseBoard(data.season, players);
  const last10 = parseBoard(data.last10, players);
  if (!season || !last10) return null;
  const asOfLabel =
    typeof data.asOfLabel === "string" && data.asOfLabel.trim()
      ? data.asOfLabel.trim()
      : "—";
  return { season, last10, asOfLabel };
}

export function mockPlayerStatLeadersBundle(): NbaPlayerStatLeadersBundle {
  return getNbaPlayerStatLeadersMock();
}

export type ResolvedPlayerStatLeaders = {
  bundle: NbaPlayerStatLeadersBundle;
  source: NbaPlayerStatLeadersSnapshotSource;
  updatedAt: Date | null;
};

export function resolvePlayerStatLeadersFromFirestore(
  data: NbaPlayerStatLeadersFirestoreDoc | undefined
): ResolvedPlayerStatLeaders | null {
  if (!data) return null;
  const bundle = bundleFromFirestoreData(data);
  if (!bundle) return null;
  const updatedAt =
    data.updatedAt && typeof data.updatedAt.toDate === "function"
      ? data.updatedAt.toDate()
      : null;
  return { bundle, source: "firestore", updatedAt };
}

export function resolvePlayerStatLeadersMockFallback(): ResolvedPlayerStatLeaders {
  return {
    bundle: mockPlayerStatLeadersBundle(),
    source: "mock",
    updatedAt: null,
  };
}
