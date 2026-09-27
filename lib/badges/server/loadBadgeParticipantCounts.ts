/**
 * ランキングスナップショットからバッジの参加者数を読む。
 * 参加者 = その回・その部門で 1 回以上投稿した人数（snapshot.participantCount）。
 * participantCount の無い旧スナップショットは totalCount / count で代用する。
 */

import type { Firestore } from "firebase-admin/firestore";
import { periodRankingSnapshotDocId } from "../../rankings/rankingDivision";
import {
  resolveBadgeCohortSource,
  type BadgeCohortSource,
} from "../badgeCohort";

function readPositiveInt(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function readCount(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  const participants = readPositiveInt(data.participantCount);
  if (participants != null) return participants;
  const legacy = readPositiveInt(data.totalCount ?? data.count);
  if (legacy != null) return legacy;
  const ranks = data.ranks;
  if (ranks && typeof ranks === "object") {
    const size = Object.keys(ranks as Record<string, unknown>).length;
    return size > 0 ? size : null;
  }
  return null;
}

/** po_2026_* → 2025-26-playoffs */
function playoffsArchiveId(year: number): string | null {
  if (!Number.isFinite(year) || year < 2000) return null;
  const start = year - 1;
  return `${start}-${String(year % 100).padStart(2, "0")}-playoffs`;
}

function sourceKey(src: BadgeCohortSource): string {
  if (src.kind === "period") {
    return `period:${src.division}:${src.period}:${src.label}:${src.metric}`;
  }
  return `cum:${src.year}:${src.docIds.join(",")}`;
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
  // その年のアーカイブを優先（live doc は新シーズンで上書きされるため）
  const archiveId = playoffsArchiveId(src.year);
  const archiveRefs = archiveId
    ? src.docIds.map((id) =>
        db
          .collection("cumulative_ranking_snapshots_archive")
          .doc(archiveId)
          .collection("docs")
          .doc(id),
      )
    : [];
  const liveRefs = src.docIds.map((id) =>
    db.collection("cumulative_ranking_snapshots").doc(id),
  );
  const snaps = await db.getAll(...archiveRefs, ...liveRefs);
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
        division: src.division,
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
