import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  getNbaLeagueTeamStatsMock,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type {
  NbaLeagueTeamStatsFirestoreDoc,
  NbaLeagueTeamStatsSnapshotSource,
} from "./leagueTeamStatsTypes";

function isConference(v: unknown): v is NbaConferenceId {
  return v === "east" || v === "west";
}

function parseRow(raw: unknown): NbaLeagueTeamStatRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const teamId = typeof o.teamId === "string" ? o.teamId : "";
  const teamName = typeof o.teamName === "string" ? o.teamName : "";
  const conference = o.conference;
  if (!teamId || !teamName || !isConference(conference)) return null;

  const num = (key: keyof NbaLeagueTeamStatRow) => {
    const v = o[key];
    return typeof v === "number" && Number.isFinite(v) ? v : NaN;
  };

  const wins = num("wins");
  const losses = num("losses");
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;

  const metrics = [
    "winPct",
    "ppg",
    "papg",
    "diff",
    "ortg",
    "drtg",
    "netrtg",
    "pace",
    "efgPct",
    "fg3Pct",
    "fg3a",
    "tovPct",
  ] as const;
  for (const k of metrics) {
    if (!Number.isFinite(num(k))) return null;
  }

  return {
    teamId,
    teamName,
    conference,
    wins,
    losses,
    winPct: num("winPct"),
    ppg: num("ppg"),
    papg: num("papg"),
    diff: num("diff"),
    ortg: num("ortg"),
    drtg: num("drtg"),
    netrtg: num("netrtg"),
    pace: num("pace"),
    efgPct: num("efgPct"),
    fg3Pct: num("fg3Pct"),
    fg3a: num("fg3a"),
    tovPct: num("tovPct"),
  };
}

function parseRows(raw: unknown): NbaLeagueTeamStatRow[] | null {
  if (!Array.isArray(raw)) return null;
  const rows: NbaLeagueTeamStatRow[] = [];
  for (const item of raw) {
    const row = parseRow(item);
    if (!row) return null;
    rows.push(row);
  }
  return rows.length > 0 ? rows : null;
}

export function bundleFromFirestoreData(
  data: NbaLeagueTeamStatsFirestoreDoc
): NbaLeagueTeamStatsBundle | null {
  const season = parseRows(data.season);
  const last10 = parseRows(data.last10);
  if (!season || !last10) return null;
  const asOfLabel =
    typeof data.asOfLabel === "string" && data.asOfLabel.trim()
      ? data.asOfLabel.trim()
      : "—";
  return { season, last10, asOfLabel };
}

export function mockLeagueTeamStatsBundle(): NbaLeagueTeamStatsBundle {
  return getNbaLeagueTeamStatsMock();
}

export type ResolvedLeagueTeamStats = {
  bundle: NbaLeagueTeamStatsBundle;
  source: NbaLeagueTeamStatsSnapshotSource;
  updatedAt: Date | null;
};

export function resolveLeagueTeamStatsFromFirestore(
  data: NbaLeagueTeamStatsFirestoreDoc | undefined
): ResolvedLeagueTeamStats | null {
  if (!data) return null;
  const bundle = bundleFromFirestoreData(data);
  if (!bundle) return null;
  const updatedAt =
    data.updatedAt && typeof data.updatedAt.toDate === "function"
      ? data.updatedAt.toDate()
      : null;
  return { bundle, source: "firestore", updatedAt };
}

export function resolveLeagueTeamStatsMockFallback(): ResolvedLeagueTeamStats {
  return {
    bundle: mockLeagueTeamStatsBundle(),
    source: "mock",
    updatedAt: null,
  };
}
