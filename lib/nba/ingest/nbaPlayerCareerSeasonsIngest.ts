/**
 * BDL → Firestore `nbaPlayerCareerSeasons/{playerId}`。
 * 公開 API は Firestore のみ読む。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  requireBdlNbaApiKey,
  bdlSeasonYearFromSeasonKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import {
  fetchBdlPlayerBasicInfo,
  fetchBdlPlayerCareerAverageForSeason,
} from "@/lib/nba/bdl/fetchBdlPlayerCareerAverages";
import { fetchBdlPlayerSeasonGameMeta } from "@/lib/nba/bdl/fetchBdlPlayerSeasonGameMeta";
import { mapBdlCareerAverageToRow } from "@/lib/nba/playerDetail/mapBdlToPlayerCareerSeasons";
import { writePlayerCareerSeasonsSnapshot } from "@/lib/nba/playerCareerSeasons/loadPlayerCareerSeasonsSnapshot";
import { listActiveRosterPlayerRefs } from "@/lib/nba/ingest/listActiveRosterPlayerRefs";
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { TEAM_SHORT } from "@/lib/team-short";

export const NBA_PLAYER_CAREER_SEASONS_INGEST_READY = true;

export type NbaPlayerCareerSeasonsIngestInput = {
  seasonKey?: string;
  playerIds?: string[];
  maxPlayers?: number;
};

export type NbaPlayerCareerSeasonsIngestResult = {
  ok: true;
  seasonKey: string;
  attempted: number;
  written: number;
  skipped: number;
  failed: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function buildBoard(input: {
  bdlId: number;
  years: readonly number[];
  seasonType: "regular" | "playoffs";
  teamId: string | null;
  position: string | null;
}): Promise<NbaPlayerCareerSeasonRow[]> {
  const out: NbaPlayerCareerSeasonRow[] = [];
  const teamAbbr = input.teamId ? TEAM_SHORT[input.teamId] ?? null : null;
  for (let i = 0; i < input.years.length; i += 1) {
    const year = input.years[i]!;
    try {
      const row = await fetchBdlPlayerCareerAverageForSeason({
        bdlPlayerId: input.bdlId,
        seasonYear: year,
        seasonType: input.seasonType,
      });
      if (row) {
        let metaTeamId: string | null = null;
        let metaTeamAbbr: string | null = null;
        let metaGs: number | null = null;
        try {
          const meta = await fetchBdlPlayerSeasonGameMeta({
            bdlPlayerId: input.bdlId,
            seasonYear: year,
            seasonType: input.seasonType,
            estimateGamesStarted: true,
          });
          metaTeamId = meta.teamId;
          metaTeamAbbr = meta.teamAbbr;
          metaGs = meta.gamesStarted;
        } catch {
          // 試合ログ取得失敗時は fallback チームのまま
        }
        const mapped = mapBdlCareerAverageToRow(row, {
          fallbackTeamId: input.teamId,
          fallbackTeamAbbr: teamAbbr,
          fallbackPosition: input.position,
          teamId: metaTeamId,
          teamAbbr: metaTeamAbbr,
          gamesStarted: metaGs,
        });
        if (mapped) out.push(mapped);
      }
    } catch {
      // 年によっては空
    }
    if (i < input.years.length - 1) await sleep(35);
  }
  out.sort((a, b) => b.seasonStart - a.seasonStart);
  return out;
}

export async function ingestNbaPlayerCareerSeasonsFromBdl(
  db: Firestore,
  input: NbaPlayerCareerSeasonsIngestInput = {}
): Promise<NbaPlayerCareerSeasonsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const currentYear = bdlSeasonYearFromSeasonKey(seasonKey);

  let targets = await listActiveRosterPlayerRefs(db, seasonKey);
  const filterIds = (input.playerIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  if (filterIds.length > 0) {
    const want = new Set(filterIds);
    targets = targets.filter((t) => want.has(t.playerId));
    for (const id of filterIds) {
      if (!targets.some((t) => t.playerId === id)) {
        targets.push({ playerId: id, teamId: "", position: "—" });
      }
    }
  }
  if (
    typeof input.maxPlayers === "number" &&
    Number.isFinite(input.maxPlayers) &&
    input.maxPlayers > 0
  ) {
    targets = targets.slice(0, Math.trunc(input.maxPlayers));
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i]!;
    try {
      if (i === 0 || (i + 1) % 10 === 0 || i + 1 === targets.length) {
        console.log(
          `[nba-player-career-seasons-ingest] ${i + 1}/${targets.length} player=${target.playerId} written=${written} skipped=${skipped} failed=${failed}`
        );
      }
      const bdlId = Number.parseInt(target.playerId, 10);
      if (!Number.isFinite(bdlId) || bdlId <= 0) {
        skipped += 1;
        continue;
      }
      const info = await fetchBdlPlayerBasicInfo(bdlId);
      const startYear = Math.max(
        2010,
        Math.min(currentYear, info?.draftYear ?? currentYear - 12)
      );
      const years: number[] = [];
      for (let y = startYear; y <= currentYear; y += 1) years.push(y);
      const position =
        target.position !== "—" ? target.position : info?.position || null;
      const teamId = target.teamId || null;

      const regular = await buildBoard({
        bdlId,
        years,
        seasonType: "regular",
        teamId,
        position,
      });
      const playoffs = await buildBoard({
        bdlId,
        years,
        seasonType: "playoffs",
        teamId,
        position,
      });

      if (regular.length === 0 && playoffs.length === 0) {
        skipped += 1;
      } else {
        await writePlayerCareerSeasonsSnapshot(db, {
          playerId: target.playerId,
          teamId,
          asOfSeasonKey: seasonKey,
          regular,
          playoffs,
        });
        written += 1;
      }
    } catch (e) {
      failed += 1;
      console.error(
        `[nba-player-career-seasons-ingest] player=${target.playerId}`,
        e
      );
    }
    if (i < targets.length - 1) await sleep(40);
  }

  return {
    ok: true,
    seasonKey,
    attempted: targets.length,
    written,
    skipped,
    failed,
  };
}
