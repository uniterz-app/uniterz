/**
 * Firestore `nbaTeamShapeRecords` の公開読み取り。
 */
import type { Firestore } from "firebase-admin/firestore";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  loadTeamShapeRecordsBundle,
  normalizeTeamShapeSeasonKey,
} from "@/lib/nba/teamShapes/loadTeamShapeRecords";
import {
  TEAM_SHAPE_DEF_BY_ID,
  type TeamShapeId,
} from "@/lib/nba/teamShapes/shapeDefs";
import type { NbaTeamShapeSplit } from "@/lib/nba/teamShapes/teamShapeTypes";
import { formatWl, wlWinPct } from "@/lib/nba/insights/priorSeasonRecordTypes";
import {
  selectTeamShapeEdges,
  type TeamShapeEdge,
} from "@/lib/nba/teamShapes/selectTeamShapeEdges";

export type NbaTeamShapeApiRow = {
  teamId: string;
  teamName: string;
  abbr: string;
  overall: { wins: number; losses: number; winPct: number };
  shapes: Array<
    NbaTeamShapeSplit & {
      labelEn: string;
      labelJa: string;
      conditionEn: string;
      conditionJa: string;
    }
  >;
  edges: Array<{
    kind: TeamShapeEdge["kind"];
    shapeId: TeamShapeId;
    labelEn: string;
    labelJa: string;
    conditionEn: string;
    conditionJa: string;
    when: string;
    games: number;
    winPct: number;
    deltaWinPct: number;
  }>;
};

export type NbaTeamShapeRecordsApiPayload = {
  ok: true;
  season: string;
  gameCount: number;
  gamesWithBox: number;
  teamCount: number;
  builtAtMs: number | null;
  source: "firestore" | "empty";
  teams: NbaTeamShapeApiRow[];
};

export async function loadTeamShapeRecordsApiPayload(
  db: Firestore,
  seasonKey: string,
  teamIdFilter?: string | null
): Promise<NbaTeamShapeRecordsApiPayload> {
  const season = normalizeTeamShapeSeasonKey(seasonKey);
  const bundle = await loadTeamShapeRecordsBundle(db, season);
  if (!bundle) {
    return {
      ok: true,
      season,
      gameCount: 0,
      gamesWithBox: 0,
      teamCount: 0,
      builtAtMs: null,
      source: "empty",
      teams: [],
    };
  }

  const want = (teamIdFilter ?? "").trim();
  const teams: NbaTeamShapeApiRow[] = [];
  for (const [teamId, rec] of Object.entries(bundle.teams)) {
    if (want && teamId !== want) continue;
    const shapes = Object.values(rec.shapes)
      .filter((s): s is NbaTeamShapeSplit => !!s)
      .map((s) => {
        const def = TEAM_SHAPE_DEF_BY_ID.get(s.shapeId);
        return {
          ...s,
          labelEn: def?.labelEn ?? s.shapeId,
          labelJa: def?.labelJa ?? s.shapeId,
          conditionEn: def?.conditionEn ?? s.shapeId,
          conditionJa: def?.conditionJa ?? s.shapeId,
        };
      })
      .sort((a, b) => b.deltaWinPct - a.deltaWinPct);

    const edges = selectTeamShapeEdges(rec).map((e) => ({
      kind: e.kind,
      shapeId: e.def.id,
      labelEn: e.def.labelEn,
      labelJa: e.def.labelJa,
      conditionEn: e.def.conditionEn,
      conditionJa: e.def.conditionJa,
      when: formatWl(e.split.when),
      games: e.split.games,
      winPct: e.split.winPct,
      deltaWinPct: e.split.deltaWinPct,
    }));

    teams.push({
      teamId,
      teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
      abbr: TEAM_SHORT[teamId] ?? teamId,
      overall: {
        wins: rec.overall.wins,
        losses: rec.overall.losses,
        winPct: Math.round(wlWinPct(rec.overall) * 1000) / 1000,
      },
      shapes,
      edges,
    });
  }

  teams.sort((a, b) => a.abbr.localeCompare(b.abbr));

  return {
    ok: true,
    season,
    gameCount: bundle.gameCount,
    gamesWithBox: bundle.gamesWithBox,
    teamCount: teams.length,
    builtAtMs: bundle.builtAtMs || null,
    source: "firestore",
    teams,
  };
}
