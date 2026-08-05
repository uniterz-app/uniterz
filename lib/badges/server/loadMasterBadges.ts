/**
 * master_badges カタログ（全ユーザー共通）→ CDN 共有用。
 */

import type { Firestore } from "firebase-admin/firestore";

export type MasterBadgeDto = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export async function loadMasterBadges(
  db: Firestore
): Promise<{ ok: true; badges: MasterBadgeDto[] }> {
  const snap = await db.collection("master_badges").get();
  const badges: MasterBadgeDto[] = snap.docs.map((d) => {
    const data = d.data() as {
      title?: string;
      description?: string;
      icon?: string;
    };
    return {
      id: d.id,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      icon: data.icon ? String(data.icon) : undefined,
    };
  });
  return { ok: true, badges };
}

export function masterBadgesCacheControl(): string {
  return "public, s-maxage=3600, stale-while-revalidate=86400";
}
