/**
 * master_badges カタログ（全ユーザー共通）→ CDN 共有用。
 */

import type { Firestore } from "firebase-admin/firestore";
import { loadBadgeParticipantCounts } from "./loadBadgeParticipantCounts";

export type MasterBadgeDto = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  /** 同じ回の共有フォールバック。正本は user_badges.meta.participantCount */
  participantCount?: number;
};

function readStoredCount(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

export async function loadMasterBadges(
  db: Firestore
): Promise<{ ok: true; badges: MasterBadgeDto[] }> {
  const snap = await db.collection("master_badges").get();
  const badges: MasterBadgeDto[] = snap.docs.map((d) => {
    const data = d.data() as {
      title?: string;
      description?: string;
      icon?: string;
      participantCount?: unknown;
    };
    const stored = readStoredCount(data.participantCount);
    return {
      id: d.id,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      icon: data.icon ? String(data.icon) : undefined,
      ...(stored != null ? { participantCount: stored } : {}),
    };
  });

  const missing = badges.filter((b) => b.participantCount == null).map((b) => b.id);
  if (missing.length > 0) {
    const lookedUp = await loadBadgeParticipantCounts(db, missing);
    for (const badge of badges) {
      if (badge.participantCount != null) continue;
      const n = lookedUp.get(badge.id);
      if (n != null) badge.participantCount = n;
    }
  }

  return { ok: true, badges };
}

export function masterBadgesCacheControl(): string {
  return "public, s-maxage=3600, stale-while-revalidate=86400";
}
