/**
 * PREVIEW ファクトの Firestore 読み（サーバー専用 · BDL なし）。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_PLAYER_GAME_LOGS_COLLECTION,
  NBA_PLAYER_GAME_LOGS_PLAYERS_SUB,
} from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import {
  buildPreviewFacts,
  finishedMeetings,
  meetingNeedsPlayerLogs,
  previewShortName,
  type PreviewGameDoc,
  type PreviewMeetingPlayerLines,
  type ProInsightPreviewFacts,
  type ProInsightPreviewPlayerLine,
} from "@/lib/nba/insights/proInsightFacts/buildPreviewFacts";

/** games は pointsSummary 等で重いので必要なフィールドだけ */
const MEETING_FIELDS = [
  "homeTeamId",
  "awayTeamId",
  "home",
  "away",
  "startAtJst",
  "status",
  "final",
  "score",
  "homeScore",
  "awayScore",
  "season",
  "seasonPhase",
  "bdlGameId",
  "liveStats.box",
] as const;

async function loadMeetingDocs(
  db: Firestore,
  homeTeamId: string,
  awayTeamId: string,
  seasonKeys: string[]
): Promise<PreviewGameDoc[]> {
  const want = new Set(seasonKeys);
  const query = (h: string, a: string) =>
    db
      .collection("games")
      .where("homeTeamId", "==", h)
      .where("awayTeamId", "==", a)
      .select(...MEETING_FIELDS)
      .limit(40)
      .get();
  const [x, y] = await Promise.all([
    query(homeTeamId, awayTeamId),
    query(awayTeamId, homeTeamId),
  ]);
  return [...x.docs, ...y.docs]
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter((d) => {
      const phase = String(d.data.seasonPhase ?? "regular").toLowerCase();
      if (phase === "preseason" || phase === "pre") return false;
      return want.has(String(d.data.season ?? ""));
    });
}

function nameMapFromRosters(
  rosters: Array<Record<string, NbaTeamRosterDocTeam> | null | undefined>
): Map<string, string> {
  const out = new Map<string, string>();
  for (const teams of rosters) {
    for (const team of Object.values(teams ?? {})) {
      for (const p of team.players ?? []) {
        const id = String(p.id ?? "").trim();
        if (id && !out.has(id)) out.set(id, previewShortName(p.firstName ?? "", p.lastName ?? ""));
      }
    }
  }
  return out;
}

/**
 * box の無い試合（主に前季）の選手行を `nbaPlayerGameLogs/{season}` から拾う。
 * 対象はその季に両チームにいた選手 + 今両チームにいる選手（オフの移籍も拾う）。
 */
async function loadMeetingPlayerLinesFromLogs(
  db: Firestore,
  input: {
    seasonKey: string;
    bdlGameId: string;
    teamIds: string[];
    extraPlayerIds: string[];
    nameById: Map<string, string>;
  }
): Promise<PreviewMeetingPlayerLines | null> {
  const col = db
    .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
    .doc(input.seasonKey)
    .collection(NBA_PLAYER_GAME_LOGS_PLAYERS_SUB);
  const byTeam = await col.where("teamId", "in", input.teamIds).get();
  const seen = new Set(byTeam.docs.map((d) => d.id));
  const extraIds = input.extraPlayerIds.filter((id) => id && !seen.has(id));
  const extra = extraIds.length
    ? (await db.getAll(...extraIds.map((id) => col.doc(id)))).filter((d) => d.exists)
    : [];

  const home: ProInsightPreviewPlayerLine[] = [];
  const away: ProInsightPreviewPlayerLine[] = [];
  for (const doc of [...byTeam.docs, ...extra]) {
    const logs = (doc.data()?.gameLogs ?? []) as NbaPlayerGameLog[];
    const row = logs.find((l) => String(l.gameId) === input.bdlGameId);
    if (!row || !(row.min > 0)) continue;
    const name = input.nameById.get(doc.id);
    if (!name) continue;
    const line: ProInsightPreviewPlayerLine = {
      name,
      min: Math.round(row.min),
      pts: row.pts,
      reb: row.reb,
      ast: row.ast,
      fg: `${row.fgm}-${row.fga}`,
      fg3: `${row.fg3m}-${row.fg3a}`,
    };
    (row.home ? home : away).push(line);
  }
  return home.length || away.length ? { home, away } : null;
}

export async function loadProInsightPreviewFacts(
  db: Firestore,
  input: {
    homeTeamId: string;
    awayTeamId: string;
    tipAtMs: number;
    seasonKey: string;
    priorSeasonKey: string;
    recentDocs: PreviewGameDoc[];
    seasonRosterTeams?: Record<string, NbaTeamRosterDocTeam> | null;
    priorRosterTeams?: Record<string, NbaTeamRosterDocTeam> | null;
  }
): Promise<ProInsightPreviewFacts | null> {
  try {
    const meetingDocs = await loadMeetingDocs(db, input.homeTeamId, input.awayTeamId, [
      input.seasonKey,
      input.priorSeasonKey,
    ]);
    const meetings = finishedMeetings(
      meetingDocs,
      input.homeTeamId,
      input.awayTeamId,
      input.tipAtMs
    );
    const last = meetings[meetings.length - 1];
    let lastMeetingPlayerLines: PreviewMeetingPlayerLines | null = null;
    const bdlGameId = String(last?.data.bdlGameId ?? last?.id.replace(/^nba-bdl-/, "") ?? "");
    if (last && meetingNeedsPlayerLogs(last) && bdlGameId) {
      const teamIds = [input.homeTeamId, input.awayTeamId];
      const currentIds = teamIds.flatMap((id) =>
        (input.seasonRosterTeams?.[id]?.players ?? []).map((p) => String(p.id ?? "").trim())
      );
      lastMeetingPlayerLines = await loadMeetingPlayerLinesFromLogs(db, {
        seasonKey: String(last.data.season ?? input.priorSeasonKey),
        bdlGameId,
        teamIds,
        extraPlayerIds: currentIds,
        nameById: nameMapFromRosters([input.priorRosterTeams, input.seasonRosterTeams]),
      });
    }
    return buildPreviewFacts({
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      tipAtMs: input.tipAtMs,
      meetingDocs,
      recentDocs: input.recentDocs,
      lastMeetingPlayerLines,
    });
  } catch (e) {
    console.warn("[pro-insight] preview facts", e instanceof Error ? e.message : e);
    return null;
  }
}
