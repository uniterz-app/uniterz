import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  attachLeagueTeamAdvanced,
  getNbaLeagueTeamStatsMock,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS } from "@/lib/predict/nbaLeagueTeamStatsAdvanced";
import type {
  NbaLeagueTeamStatsFirestoreDoc,
  NbaLeagueTeamStatsSnapshotSource,
} from "./leagueTeamStatsTypes";

function isConference(v: unknown): v is NbaConferenceId {
  return v === "east" || v === "west";
}

function parseRow(
  raw: unknown,
  window: "season" | "last10"
): NbaLeagueTeamStatRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const teamId = typeof o.teamId === "string" ? o.teamId : "";
  const teamName = typeof o.teamName === "string" ? o.teamName : "";
  const conference = o.conference;
  if (!teamId || !teamName || !isConference(conference)) return null;

  const num = (key: string) => {
    const v = o[key];
    return typeof v === "number" && Number.isFinite(v) ? v : NaN;
  };

  const numOrZero = (key: string) => {
    const v = num(key);
    return Number.isFinite(v) ? v : 0;
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

  const advanced: Record<string, number> = {};
  for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
    const v = o[d.id];
    if (typeof v === "number" && Number.isFinite(v)) advanced[d.id] = v;
  }

  return attachLeagueTeamAdvanced(
    {
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
      oppFgPct: numOrZero("oppFgPct"),
      oppFg3Pct: numOrZero("oppFg3Pct"),
      oppFtPct: numOrZero("oppFtPct"),
      oppReb: numOrZero("oppReb"),
      oppAst: numOrZero("oppAst"),
      oppTov: numOrZero("oppTov"),
      oppOreb: numOrZero("oppOreb"),
      oppEfgPct: numOrZero("oppEfgPct"),
    },
    window,
    advanced
  );
}

function parseRows(
  raw: unknown,
  window: "season" | "last10"
): NbaLeagueTeamStatRow[] | null {
  if (!Array.isArray(raw)) return null;
  const rows: NbaLeagueTeamStatRow[] = [];
  for (const item of raw) {
    const row = parseRow(item, window);
    if (!row) return null;
    rows.push(row);
  }
  // last10 未集計などで空配列もあり得る
  return rows;
}

export function bundleFromFirestoreData(
  data: NbaLeagueTeamStatsFirestoreDoc
): NbaLeagueTeamStatsBundle | null {
  const season = parseRows(data.season, "season");
  const last10 = parseRows(data.last10, "last10");
  if (!season || !last10) return null;
  // season が空ならスナップショット未完成扱い（mock/empty フォールバックへ）
  if (season.length === 0) return null;
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

/** 本番でスナップショット未作成のとき用（偽データを出さない） */
export function resolveLeagueTeamStatsEmptyFallback(
  seasonKey: string
): ResolvedLeagueTeamStats {
  return {
    bundle: {
      season: [],
      last10: [],
      asOfLabel: `UNAVAILABLE · ${seasonKey}`,
    },
    source: "empty",
    updatedAt: null,
  };
}
