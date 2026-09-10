/**
 * Community group の summary 形状を group doc から組み立てる。
 * summary API と leaderboard（1往復化）で共有する。
 */
import type { DocumentData } from "firebase-admin/firestore";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "./types";
import { readRankingTeamIds } from "./rankingTeams";
import { readCommunityGamesScope } from "./communityGamesScope";
import {
  parseRankingEndDateKey,
  parseRankingPeriodMonthKey,
  parseRankingSeasonKey,
} from "./resolveCommunityDateKeys";
import { sanitizeHeaderImagePositionY } from "./headerImagePosition";
import { resolveRankingStartDateKey } from "./rankingStartDate";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type CommunityGroupSummaryPayload = {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  headerImagePositionY: number;
  rankingMetric: ReturnType<typeof parseCommunityMetric>;
  periodType: ReturnType<typeof parseCommunityPeriod>;
  rankingLeague: ReturnType<typeof parseCommunityLeague>;
  rankingTeamIds: string[];
  rankingGamesScope: ReturnType<typeof readCommunityGamesScope>;
  rankingPeriodMonthKey: string | null;
  rankingEndDateKey: string | null;
  rankingSeasonKey: string;
  archived: boolean;
  isOwner: boolean;
  inviteCode: string | null;
  rankingStartDateKey: string | null;
};

export function buildCommunityGroupSummaryPayload(
  groupId: string,
  d: DocumentData,
  viewerUid: string
): CommunityGroupSummaryPayload {
  const ownerUid = String(d.ownerUid ?? "");
  const isOwner = ownerUid === viewerUid;
  const raw = d as Record<string, unknown>;
  return {
    id: groupId,
    name: String(d.name ?? ""),
    description:
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim()
        : null,
    ownerUid,
    memberCount: Number(d.memberCount ?? 0),
    headerImageUrl: (d.headerImageUrl as string) ?? null,
    headerImagePositionY: sanitizeHeaderImagePositionY(d.headerImagePositionY),
    rankingMetric: parseCommunityMetric(d.rankingMetric),
    periodType: parseCommunityPeriod(d.periodType),
    rankingLeague: parseCommunityLeague(d.rankingLeague),
    rankingTeamIds: readRankingTeamIds(d),
    rankingGamesScope: readCommunityGamesScope(raw),
    rankingPeriodMonthKey: parseRankingPeriodMonthKey(d.rankingPeriodMonthKey),
    rankingEndDateKey: parseRankingEndDateKey(d.rankingEndDateKey),
    rankingSeasonKey: parseRankingSeasonKey(
      d.rankingSeasonKey ?? CURRENT_NBA_SEASON_KEY
    ),
    archived: !!d.archivedAt,
    isOwner,
    inviteCode:
      isOwner && typeof d.inviteCode === "string" && d.inviteCode.trim()
        ? d.inviteCode.trim()
        : null,
    rankingStartDateKey: resolveRankingStartDateKey(d),
  };
}
