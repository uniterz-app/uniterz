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
import { sanitizeHeaderImagePositionY } from "./headerImagePosition";
import { resolveRankingStartDateKey } from "./rankingStartDate";

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
    archived: !!d.archivedAt,
    isOwner,
    inviteCode:
      isOwner && typeof d.inviteCode === "string" && d.inviteCode.trim()
        ? d.inviteCode.trim()
        : null,
    rankingStartDateKey: resolveRankingStartDateKey(d),
  };
}
