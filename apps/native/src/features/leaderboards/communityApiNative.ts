import type { CommunityLeague, CommunityMetric, CommunityPeriodType } from "../../../../../lib/communities/types";
import type { GroupMemberPreview } from "../../../../../lib/communities/memberPreviews";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
} from "../../../../../lib/communities/limitValues";

export const COMMUNITY_API_BASE =
  process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

export type CommunityListGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: CommunityPeriodType;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  role: string;
  memberPreviews?: GroupMemberPreview[];
};

export type CommunityListLimits = {
  plan: "free" | "pro";
  maxOwned: number;
  maxMemberships: number;
  ownedCount: number;
  membershipCount: number;
};

export type CreatedCommunityGroup = CommunityListGroup;

export type JoinGroupPreview = {
  id: string;
  name: string;
  description: string | null;
  ownerDisplayName: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
};

export type CommunityGroupSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: string;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  archived: boolean;
  isOwner: boolean;
  inviteCode: string | null;
};

export type CommunityGroupLeaderboardRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  countryCode?: string;
  totalPosts?: number;
  totalWins?: number;
  sortValue: number;
  winRate: number;
  activeWinStreak: number;
  totalPoints: number;
  totalPrecision?: number;
  totalUpset?: number;
};

export type CommunityGroupListPreview = {
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  memberCount: number;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  isOwner: boolean;
};

export const DEFAULT_COMMUNITY_LIMITS: CommunityListLimits = {
  plan: "free",
  maxOwned: FREE_MAX_OWNED_GROUPS,
  maxMemberships: FREE_MAX_MEMBERSHIPS,
  ownedCount: 0,
  membershipCount: 0,
};

export async function communityAuthHeader(getIdToken: () => Promise<string>): Promise<string | null> {
  try {
    const token = await getIdToken();
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
}

export function communityApiUrl(path: string): string {
  const base = COMMUNITY_API_BASE;
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
