import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  getNbaPlayerStatLeadersMock,
  NBA_PLAYER_STAT_LEADER_METRICS,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { NBA_PLAYER_ADVANCED_LEADER_METRICS } from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import {
  isNbaLeagueStatsPreseason,
  preseasonLeagueStatsAsOfLabel,
} from "@/lib/nba/leagueStatsPreseason";
import type {
  NbaPlayerStatLeadersFirestoreDoc,
  NbaPlayerStatLeadersSnapshotSource,
} from "./playerStatLeadersTypes";

type CompactPlayer = {
  n: string;
  t: string;
  c: NbaConferenceId;
};

/** Firestore はネスト配列不可のため map で保存。レガシー tuple も読む */
type CompactEntry = { p: string; g: number; v: number };

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
  // season だけ先に書いて players 空、は不正。空ボード（last10 pending）は players={} を許す
  return out;
}

function parseEntry(raw: unknown): CompactEntry | null {
  if (Array.isArray(raw) && raw.length >= 3) {
    const playerId = typeof raw[0] === "string" ? raw[0] : "";
    const gamesPlayed =
      typeof raw[1] === "number" && Number.isFinite(raw[1]) ? raw[1] : NaN;
    const value =
      typeof raw[2] === "number" && Number.isFinite(raw[2]) ? raw[2] : NaN;
    if (!playerId || !Number.isFinite(gamesPlayed) || !Number.isFinite(value)) {
      return null;
    }
    return { p: playerId, g: gamesPlayed, v: value };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const p = typeof o.p === "string" ? o.p : "";
  const g = typeof o.g === "number" && Number.isFinite(o.g) ? o.g : NaN;
  const v = typeof o.v === "number" && Number.isFinite(o.v) ? o.v : NaN;
  if (!p || !Number.isFinite(g) || !Number.isFinite(v)) return null;
  return { p, g, v };
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
      const entry = parseEntry(item);
      if (!entry) return null;
      const meta = players[entry.p];
      if (!meta) return null;
      rows.push({
        playerId: entry.p,
        playerName: meta.n,
        teamId: meta.t,
        conference: meta.c,
        gamesPlayed: entry.g,
        value: entry.v,
      });
    }
    out[metric as NbaPlayerLeaderMetricId] = rows;
  }
  return out;
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
): Record<string, CompactEntry[]> {
  const out: Record<string, CompactEntry[]> = {};
  for (const [metric, rows] of Object.entries(board)) {
    out[metric] = rows.map((r) => ({
      p: r.playerId,
      g: r.gamesPlayed,
      v: r.value,
    }));
  }
  return out;
}

export function compactPlayerStatLeadersBundle(
  bundle: NbaPlayerStatLeadersBundle
): {
  players: Record<string, CompactPlayer>;
  season: Record<string, CompactEntry[]>;
  last10: Record<string, CompactEntry[]>;
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
  if (players == null) return null;
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

function emptyPlayerLeadersBoard(): Record<
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow[]
> {
  const board: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const m of NBA_PLAYER_STAT_LEADER_METRICS) {
    board[m.id] = [];
  }
  for (const m of NBA_PLAYER_ADVANCED_LEADER_METRICS) {
    board[m.id] = [];
  }
  return board as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

/** 本番でスナップショット未作成のとき用（偽データを出さない） */
export function resolvePlayerStatLeadersEmptyFallback(
  seasonKey: string
): ResolvedPlayerStatLeaders {
  const empty = emptyPlayerLeadersBoard();
  const preseason = isNbaLeagueStatsPreseason(seasonKey);
  return {
    bundle: {
      season: empty,
      last10: emptyPlayerLeadersBoard(),
      asOfLabel: preseason
        ? preseasonLeagueStatsAsOfLabel(seasonKey)
        : `UNAVAILABLE · ${seasonKey}`,
    },
    source: "empty",
    updatedAt: null,
  };
}
