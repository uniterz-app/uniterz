/**
 * スタッツ UI 用の表示シーズン解決。
 *
 * カレンダー上の今季（CURRENT）にリーグ表 or プレイヤーリーダーが
 * 1 件でもあれば今季。なければ前期を表示する（オフ／プレシーズン向け）。
 *
 * ロスター／injury は別解決: 今季スナップショットがあれば今季を優先
 * （スタッツが前期でも、開幕前のロスター・injury は今季を出す）。
 *
 * ingest・内部処理は必ず明示シーズンで load* を呼び、この解決を通さない。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import { NBA_LEAGUE_TEAM_STATS_COLLECTION } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import {
  NBA_LEAGUE_PLAYER_STATS_COLLECTION,
  isPlayerStatLeadersSnapshotUseful,
} from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { resolvePlayerStatLeadersFromFirestore } from "@/lib/nba/playerStatLeaders/normalizePlayerStatLeadersSnapshot";
import type { NbaPlayerStatLeadersFirestoreDoc } from "@/lib/nba/playerStatLeaders/playerStatLeadersTypes";
import { bundleFromFirestoreData } from "@/lib/nba/leagueTeamStats/normalizeLeagueTeamStatsSnapshot";
import type { NbaLeagueTeamStatsFirestoreDoc } from "@/lib/nba/leagueTeamStats/leagueTeamStatsTypes";
import { NBA_TEAM_ROSTERS_COLLECTION } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { NBA_TEAM_INJURIES_COLLECTION } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";

export type NbaStatsDisplaySeason = {
  seasonKey: string;
  /** true = 今季データ無しのため前期を表示 */
  fromPriorSeason: boolean;
  calendarSeasonKey: string;
};

async function hasLeagueTeamStatsRows(
  db: Firestore,
  seasonKey: string
): Promise<boolean> {
  const snap = await db
    .collection(NBA_LEAGUE_TEAM_STATS_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return false;
  const bundle = bundleFromFirestoreData(
    snap.data() as NbaLeagueTeamStatsFirestoreDoc
  );
  return (bundle?.season.length ?? 0) > 0;
}

async function hasPlayerStatLeadersRows(
  db: Firestore,
  seasonKey: string
): Promise<boolean> {
  const snap = await db
    .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return false;
  const resolved = resolvePlayerStatLeadersFromFirestore(
    snap.data() as NbaPlayerStatLeadersFirestoreDoc
  );
  if (!resolved) return false;
  return isPlayerStatLeadersSnapshotUseful(resolved.bundle, {
    allowEarlySeason: true,
  });
}

async function hasRosterTeams(
  db: Firestore,
  seasonKey: string
): Promise<boolean> {
  const snap = await db
    .collection(NBA_TEAM_ROSTERS_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return false;
  const teams = (snap.data() as { teams?: unknown } | undefined)?.teams;
  if (!teams || typeof teams !== "object") return false;
  return Object.keys(teams as Record<string, unknown>).length > 0;
}

async function hasInjuryTeams(
  db: Firestore,
  seasonKey: string
): Promise<boolean> {
  const snap = await db
    .collection(NBA_TEAM_INJURIES_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return false;
  const teams = (snap.data() as { teams?: unknown } | undefined)?.teams;
  if (!teams || typeof teams !== "object") return false;
  return Object.keys(teams as Record<string, unknown>).length > 0;
}

/** 今季スタッツ表示に切替できるデータが 1 件でもあるか */
export async function nbaStatsSeasonHasDisplayData(
  db: Firestore,
  seasonKey: string
): Promise<boolean> {
  const key = seasonKey.trim();
  if (!key) return false;
  const [team, players] = await Promise.all([
    hasLeagueTeamStatsRows(db, key),
    hasPlayerStatLeadersRows(db, key),
  ]);
  return team || players;
}

/**
 * 公開スタッツ画面用。preferred がカレンダー今季（または空）のときだけ
 * データ有無で前期へ落とす。明示の他シーズンはそのまま。
 */
export async function resolveNbaStatsDisplaySeasonKey(
  db: Firestore,
  preferred?: string | null
): Promise<NbaStatsDisplaySeason> {
  const calendarSeasonKey = CURRENT_NBA_SEASON_KEY;
  const requested = (preferred ?? "").trim() || calendarSeasonKey;

  if (requested !== calendarSeasonKey) {
    return {
      seasonKey: requested,
      fromPriorSeason: false,
      calendarSeasonKey,
    };
  }

  if (await nbaStatsSeasonHasDisplayData(db, calendarSeasonKey)) {
    return {
      seasonKey: calendarSeasonKey,
      fromPriorSeason: false,
      calendarSeasonKey,
    };
  }

  return {
    seasonKey: previousNbaSeasonKey(calendarSeasonKey),
    fromPriorSeason: true,
    calendarSeasonKey,
  };
}

/**
 * ロスター／injury 用。今季にスナップショットがあれば今季を優先
 * （スタッツが前期表示でも、開幕前のロスター・injury は今季を出す）。
 */
export async function resolveNbaRosterInjuryDisplaySeasonKey(
  db: Firestore,
  preferred?: string | null
): Promise<NbaStatsDisplaySeason> {
  const calendarSeasonKey = CURRENT_NBA_SEASON_KEY;
  const requested = (preferred ?? "").trim() || calendarSeasonKey;

  if (requested !== calendarSeasonKey) {
    return {
      seasonKey: requested,
      fromPriorSeason: false,
      calendarSeasonKey,
    };
  }

  const [roster, injury] = await Promise.all([
    hasRosterTeams(db, calendarSeasonKey),
    hasInjuryTeams(db, calendarSeasonKey),
  ]);
  if (roster || injury) {
    return {
      seasonKey: calendarSeasonKey,
      fromPriorSeason: false,
      calendarSeasonKey,
    };
  }

  return {
    seasonKey: previousNbaSeasonKey(calendarSeasonKey),
    fromPriorSeason: true,
    calendarSeasonKey,
  };
}
