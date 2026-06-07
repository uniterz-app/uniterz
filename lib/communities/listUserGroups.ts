import type {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "./types";
import { readRankingTeamIds } from "./rankingTeams";
import {
  fetchGroupMemberPreviews,
  type GroupMemberPreview,
} from "./memberPreviews";

export type ListedCommunityGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: ReturnType<typeof parseCommunityMetric>;
  periodType: ReturnType<typeof parseCommunityPeriod>;
  rankingLeague: ReturnType<typeof parseCommunityLeague>;
  rankingTeamIds: string[];
  role: string;
  archived: boolean;
  memberPreviews: GroupMemberPreview[];
  updatedAtMs: number;
};

const GET_ALL_CHUNK = 100;

function toMillis(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  if ("toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }
  if ("seconds" in value) {
    const sec = Number((value as { seconds?: unknown }).seconds ?? 0);
    return Number.isFinite(sec) ? sec * 1000 : 0;
  }
  return 0;
}

async function getAllInChunks(
  db: Firestore,
  refs: DocumentReference[]
): Promise<DocumentSnapshot[]> {
  const out: DocumentSnapshot[] = [];
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const chunk = refs.slice(i, i + GET_ALL_CHUNK);
    if (chunk.length === 0) continue;
    const snaps = await db.getAll(...chunk);
    out.push(...snaps);
  }
  return out;
}

/**
 * users/{uid}/groups ミラー + ownerUid クエリで所属グループを解決する。
 * ミラー欠損時もオーナーの groups ドキュメントから一覧に出す。
 */
export async function listUserGroups(
  db: Firestore,
  uid: string
): Promise<ListedCommunityGroup[]> {
  const entries = new Map<
    string,
    { mirror: QueryDocumentSnapshot | null }
  >();

  const mine = await db.collection(`users/${uid}/groups`).get();
  for (const m of mine.docs) {
    const gid = String(m.data()?.groupId ?? m.id).trim();
    if (!gid) continue;
    entries.set(gid, { mirror: m });
  }

  const ownedSnap = await db
    .collection("groups")
    .where("ownerUid", "==", uid)
    .get();
  for (const g of ownedSnap.docs) {
    if (!entries.has(g.id)) {
      entries.set(g.id, { mirror: null });
    }
  }

  if (entries.size === 0) return [];

  const groupIds = [...entries.keys()];
  const refs = groupIds.map((id) => db.doc(`groups/${id}`));
  const snaps = await getAllInChunks(db, refs);
  const groupById = new Map<string, DocumentSnapshot>();
  for (const snap of snaps) {
    if (snap.exists) groupById.set(snap.id, snap);
  }

  const groups: ListedCommunityGroup[] = [];

  for (const [groupId, { mirror }] of entries) {
    const gSnap = groupById.get(groupId);
    if (!gSnap?.exists) continue;
    const gd = gSnap.data()!;
    if (gd.archivedAt) continue;

    const mirrorData = mirror?.data();
    groups.push({
      id: groupId,
      name: String(gd.name ?? mirrorData?.groupName ?? ""),
      description:
        typeof gd.description === "string" && gd.description.trim()
          ? gd.description.trim()
          : typeof mirrorData?.description === "string" &&
              mirrorData.description.trim()
            ? mirrorData.description.trim()
            : null,
      memberCount: Number(gd.memberCount ?? mirrorData?.memberCount ?? 0),
      headerImageUrl:
        (gd.headerImageUrl as string) ??
        (mirrorData?.headerImageUrl as string) ??
        null,
      rankingMetric: parseCommunityMetric(
        gd.rankingMetric ?? mirrorData?.rankingMetric
      ),
      periodType: parseCommunityPeriod(
        gd.periodType ?? mirrorData?.periodType
      ),
      rankingLeague: parseCommunityLeague(
        gd.rankingLeague ?? mirrorData?.rankingLeague
      ),
      rankingTeamIds: readRankingTeamIds(gd),
      role: String(mirrorData?.role ?? (gd.ownerUid === uid ? "owner" : "member")),
      archived: false,
      memberPreviews: [],
      updatedAtMs: toMillis(gd.updatedAt),
    });
  }

  await Promise.all(
    groups.map(async (g) => {
      const gd = groupById.get(g.id)?.data();
      const ownerUid = String(gd?.ownerUid ?? "");
      g.memberPreviews = await fetchGroupMemberPreviews(db, g.id, ownerUid);
    })
  );

  groups.sort((a, b) => {
    const aOwner = a.role === "owner" ? 1 : 0;
    const bOwner = b.role === "owner" ? 1 : 0;
    if (aOwner !== bOwner) return bOwner - aOwner;
    if (b.updatedAtMs !== a.updatedAtMs) return b.updatedAtMs - a.updatedAtMs;
    return a.name.localeCompare(b.name, "ja");
  });
  return groups;
}
