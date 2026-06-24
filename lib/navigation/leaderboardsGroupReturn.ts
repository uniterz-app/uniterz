import type { CommunityLeague, CommunityMetric } from "@/lib/communities/types";

/** プロフィールからグループオーバーレイへ戻るときのプレビュー */
export type LeaderboardsGroupReturnPreview = {
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImagePositionY?: number;
  memberCount: number;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  isOwner: boolean;
};

const SESSION_KEY = "uniterz.leaderboardsGroupReturn.v1";

let memoryStash: {
  groupId: string;
  preview: LeaderboardsGroupReturnPreview;
} | null = null;

export function stashLeaderboardsGroupReturn(
  groupId: string,
  preview: LeaderboardsGroupReturnPreview
): void {
  const id = groupId.trim();
  if (!id) return;
  memoryStash = { groupId: id, preview };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ groupId: id, preview }));
  } catch {
    /* ストレージ不可時はメモリのみ */
  }
}

export function peekLeaderboardsGroupReturnPreview(
  groupId: string
): LeaderboardsGroupReturnPreview | null {
  const id = groupId.trim();
  if (!id) return null;
  if (memoryStash?.groupId === id) return memoryStash.preview;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      groupId?: string;
      preview?: LeaderboardsGroupReturnPreview;
    };
    if (parsed.groupId !== id || !parsed.preview) return null;
    memoryStash = { groupId: id, preview: parsed.preview };
    return parsed.preview;
  } catch {
    return null;
  }
}

export function clearLeaderboardsGroupReturnStash(): void {
  memoryStash = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
