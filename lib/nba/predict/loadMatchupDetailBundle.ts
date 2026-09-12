/**
 * 試合カード予想ツール用の寄せ読み（Firestore のみ）。
 * Injury + Roster + Stats（リーグ行はサーバー内で消費し、組み立て済みだけ返す）。
 *
 * Insight（Pro / auth）は含めない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadMatchupRosters } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadTeamGameLog } from "@/lib/nba/teamGameLog/loadTeamGameLog";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { enrichLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { buildMatchupTeamStatsBundle } from "@/lib/nba/predict/buildMatchupTeamStatsBundle";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";

export type NbaMatchupDetailApiPayload = {
  ok: true;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  /** 生ロスター（クライアントで report 化・TopScorer 共有用） */
  rosterHome: NbaTeamRosterDocTeam | null;
  rosterAway: NbaTeamRosterDocTeam | null;
  /** 組み立て済み（タブ即表示用） */
  roster: NbaRosterReport | null;
  injuryHome: NbaTeamInjuryEntry[];
  injuryAway: NbaTeamInjuryEntry[];
  injuryUpdatedAt: string | null;
  stats: NbaTeamStatsBundle;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};

function newestIso(...vals: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const v of vals) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

export async function loadMatchupDetailBundle(
  db: Firestore,
  opts: {
    homeTeamId: string;
    awayTeamId: string;
    seasonKey?: string;
  }
): Promise<NbaMatchupDetailApiPayload> {
  const homeTeamId = String(opts.homeTeamId ?? "").trim();
  const awayTeamId = String(opts.awayTeamId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();

  const [rosterPayload, injurySnap, leaguePayload, homeLogPayload, awayLogPayload] =
    await Promise.all([
      loadMatchupRosters(db, season, homeTeamId, awayTeamId),
      loadTeamInjuriesSnapshot(db, season),
      loadLeagueTeamStatsSnapshot(db, season),
      loadTeamGameLog(db, season, homeTeamId),
      loadTeamGameLog(db, season, awayTeamId),
    ]);

  const roster = buildMatchupRosterReport(
    homeTeamId,
    awayTeamId,
    rosterPayload.home,
    rosterPayload.away
  );

  const injuryHome = injurySnap.bundle.teams[homeTeamId] ?? [];
  const injuryAway = injurySnap.bundle.teams[awayTeamId] ?? [];

  const enriched = enrichLeagueTeamStatsBundle(
    leaguePayload.bundle,
    leaguePayload.source
  );
  const stats = buildMatchupTeamStatsBundle({
    homeTeamId,
    awayTeamId,
    seasonRows: enriched.season,
    last10Rows: enriched.last10,
    homeLog: homeLogPayload.log,
    awayLog: awayLogPayload.log,
  });

  const sources: Array<string | undefined> = [
    rosterPayload.source,
    injurySnap.source,
    leaguePayload.source,
    homeLogPayload.source,
    awayLogPayload.source,
  ];
  const source: NbaStatsSnapshotSource = sources.some((s) => s === "firestore")
    ? "firestore"
    : "empty";

  return {
    ok: true,
    season,
    homeTeamId,
    awayTeamId,
    rosterHome: rosterPayload.home,
    rosterAway: rosterPayload.away,
    roster,
    injuryHome,
    injuryAway,
    injuryUpdatedAt: injurySnap.updatedAt,
    stats,
    source,
    updatedAt: newestIso(
      rosterPayload.updatedAt,
      injurySnap.updatedAt,
      leaguePayload.updatedAt,
      homeLogPayload.updatedAt,
      awayLogPayload.updatedAt
    ),
  };
}
