/**
 * IST グループ試合から Cup 順位表を組む（BDL ライブ禁止・ingest / 読み取り共通）。
 */
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  resolveGameScore,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import {
  EMPTY_NBA_CUP_STANDINGS,
  NBA_CUP_GROUP_DEFS,
  type NbaCupGroupBoard,
  type NbaCupGroupId,
  type NbaCupStandingsBoard,
  type NbaCupStandingsRow,
} from "./nbaCupStandingsTypes";

type RawGame = Record<string, unknown> & { id?: string };

type Acc = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  pts: number;
  oppPts: number;
};

const STAGE_TO_GROUP = new Map(
  NBA_CUP_GROUP_DEFS.map((g) => [g.istStage.toLowerCase(), g.id] as const)
);

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  if (side === "home") {
    return String(
      raw.homeTeamId ??
        (raw.home as { teamId?: unknown } | undefined)?.teamId ??
        ""
    ).trim();
  }
  return String(
    raw.awayTeamId ??
      (raw.away as { teamId?: unknown } | undefined)?.teamId ??
      ""
  ).trim();
}

function teamNameOf(raw: RawGame, side: "home" | "away", teamId: string): string {
  const nested = raw[side] as { name?: unknown; fullName?: unknown } | undefined;
  const flat =
    side === "home"
      ? (raw.homeTeamName as unknown)
      : (raw.awayTeamName as unknown);
  const fromDoc = String(flat ?? nested?.name ?? nested?.fullName ?? "").trim();
  if (fromDoc) return fromDoc;
  return NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
}

function parseGroupId(istStage: unknown): NbaCupGroupId | null {
  const key = String(istStage ?? "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  return STAGE_TO_GROUP.get(key) ?? null;
}

function ensureAcc(
  map: Map<string, Acc>,
  teamId: string,
  teamName: string
): Acc {
  const hit = map.get(teamId);
  if (hit) {
    if (teamName && hit.teamName === teamId) hit.teamName = teamName;
    return hit;
  }
  const row: Acc = {
    teamId,
    teamName: teamName || teamId,
    wins: 0,
    losses: 0,
    pts: 0,
    oppPts: 0,
  };
  map.set(teamId, row);
  return row;
}

function sortRows(rows: Acc[]): NbaCupStandingsRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    const dA = a.pts - a.oppPts;
    const dB = b.pts - b.oppPts;
    if (dB !== dA) return dB - dA;
    if (b.pts !== a.pts) return b.pts - a.pts;
    return a.teamName.localeCompare(b.teamName);
  });
  const leader = sorted[0];
  const leaderGbBase = leader
    ? leader.wins - leader.losses
    : 0;
  return sorted.map((r, i) => {
    const played = r.wins + r.losses;
    const winPct = played > 0 ? r.wins / played : 0;
    const diff = r.pts - r.oppPts;
    const gb =
      leader && i > 0
        ? Math.max(0, (leaderGbBase - (r.wins - r.losses)) / 2)
        : 0;
    return {
      teamId: r.teamId,
      teamName: r.teamName,
      rank: i + 1,
      wins: r.wins,
      losses: r.losses,
      winPct,
      diff,
      gb,
      pts: r.pts,
      oppPts: r.oppPts,
    };
  });
}

/** `istStage` があるグループステージ試合だけ集計（ノックアウトは除外） */
export function buildNbaCupStandingsFromGames(
  games: ReadonlyArray<RawGame>
): NbaCupStandingsBoard {
  const byGroup = new Map<NbaCupGroupId, Map<string, Acc>>();
  for (const def of NBA_CUP_GROUP_DEFS) {
    byGroup.set(def.id, new Map());
  }

  for (const raw of games) {
    const groupId = parseGroupId(raw.istStage ?? raw.ist_stage);
    if (!groupId) continue;
    const bucket = byGroup.get(groupId);
    if (!bucket) continue;

    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    if (!homeId || !awayId) continue;

    ensureAcc(bucket, homeId, teamNameOf(raw, "home", homeId));
    ensureAcc(bucket, awayId, teamNameOf(raw, "away", awayId));

    if (resolveGameStatus(raw) !== "final") continue;
    const score = resolveGameScore(raw);
    if (!score) continue;

    const home = bucket.get(homeId)!;
    const away = bucket.get(awayId)!;
    home.pts += score.home;
    home.oppPts += score.away;
    away.pts += score.away;
    away.oppPts += score.home;
    if (score.home > score.away) {
      home.wins += 1;
      away.losses += 1;
    } else if (score.away > score.home) {
      away.wins += 1;
      home.losses += 1;
    }
  }

  const groups: NbaCupGroupBoard[] = NBA_CUP_GROUP_DEFS.map((def) => {
    const map = byGroup.get(def.id) ?? new Map();
    return {
      id: def.id,
      label: def.label,
      istStage: def.istStage,
      rows: sortRows([...map.values()]),
    };
  });

  const anyRows = groups.some((g) => g.rows.length > 0);
  return anyRows ? { groups } : EMPTY_NBA_CUP_STANDINGS;
}

export function formatCupDiff(diff: number): string {
  if (!Number.isFinite(diff) || diff === 0) return "0";
  return diff > 0 ? `+${diff}` : String(diff);
}

export function formatCupGb(gb: number): string {
  if (!Number.isFinite(gb) || gb <= 0) return "—";
  return Number.isInteger(gb) ? String(gb) : gb.toFixed(1);
}
