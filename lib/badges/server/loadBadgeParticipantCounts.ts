/**
 * ランキングスナップショットからバッジの参加者数（母数）を読む。
 */

import type { Firestore } from "firebase-admin/firestore";
import { periodRankingSnapshotDocId } from "../../rankings/rankingDivision";
import {
  resolveBadgeCohortSource,
  type BadgeCohortSource,
} from "../badgeCohort";

const PLAYOFFS_ARCHIVE = "2025-26-playoffs";

function readCount(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  const raw = data.totalCount ?? data.count;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  const ranks = data.ranks;
  if (ranks && typeof ranks === "object") {
    const size = Object.keys(ranks as Record<string, unknown>).length;
    return size > 0 ? size : null;
  }
  return null;
}

function sourceKey(src: BadgeCohortSource): string {
  if (src.kind === "period") {
    return `period:${src.period}:${src.label}:${src.metric}`;
  }
  return `cum:${src.docIds.join(",")}`;
}

async function countStatsField(
  db: Firestore,
  statsField: string,
): Promise<number | null> {
  try {
    const agg = await db
      .collection("cumulative_stats")
      .where(statsField, ">", 0)
      .count()
      .get();
    const n = agg.data().count;
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function loadCumulativeCount(
  db: Firestore,
  src: Extract<BadgeCohortSource, { kind: "cumulative" }>,
): Promise<number | null> {
  const liveRefs = src.docIds.map((id) =>
    db.collection("cumulative_ranking_snapshots").doc(id),
  );
  const archiveRefs = src.docIds.map((id) =>
    db
      .collection("cumulative_ranking_snapshots_archive")
      .doc(PLAYOFFS_ARCHIVE)
      .collection("docs")
      .doc(id),
  );
  const snaps = await db.getAll(...liveRefs, ...archiveRefs);
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const count = readCount(snap.data() as Record<string, unknown>);
    if (count != null) return count;
  }
  if (src.statsField) return countStatsField(db, src.statsField);
  return null;
}

async function loadPeriodCount(
  db: Firestore,
  src: Extract<BadgeCohortSource, { kind: "period" }>,
): Promise<number | null> {
  const snap = await db
    .collection("period_ranking_snapshots")
    .doc(
      periodRankingSnapshotDocId({
        division: "standard",
        period: src.period,
        label: src.label,
        metric: src.metric,
      }),
    )
    .get();
  if (!snap.exists) return null;
  return readCount(snap.data() as Record<string, unknown>);
}

/** badgeId → 参加者数。取れない ID はマップに載せない */
export async function loadBadgeParticipantCounts(
  db: Firestore,
  badgeIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const uniqueIds = [...new Set(badgeIds.filter(Boolean))];
  const sources = new Map<string, BadgeCohortSource>();
  const idsBySource = new Map<string, string[]>();

  for (const id of uniqueIds) {
    const src = resolveBadgeCohortSource(id);
    if (!src) continue;
    const key = sourceKey(src);
    if (!sources.has(key)) sources.set(key, src);
    const list = idsBySource.get(key) ?? [];
    list.push(id);
    idsBySource.set(key, list);
  }

  await Promise.all(
    [...sources.entries()].map(async ([key, src]) => {
      const count =
        src.kind === "period"
          ? await loadPeriodCount(db, src)
          : await loadCumulativeCount(db, src);
      if (count == null) return;
      for (const id of idsBySource.get(key) ?? []) {
        out.set(id, count);
      }
    }),
  );

  return out;
}
