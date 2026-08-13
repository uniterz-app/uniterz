/**
 * Top10 埋め込み用: posts に author オブジェクトが無い場合でも
 * users / cumulative_stats から displayName・photoURL を補完する。
 */
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";

export type GamePointsTopProfileLite = {
  handle?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  plan?: string | null;
  isPro?: boolean;
};

function pickNonEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

export function profileLiteFromUserDoc(
  data: Record<string, unknown> | null | undefined
): GamePointsTopProfileLite | null {
  if (!data || typeof data !== "object") return null;
  const handle = pickNonEmpty(data.handle);
  const displayName =
    pickNonEmpty(data.displayName) ?? pickNonEmpty(data.name) ?? handle;
  const photoURL =
    pickNonEmpty(data.photoURL) ??
    pickNonEmpty(data.avatarUrl) ??
    pickNonEmpty(data.profileImageUrl);
  return {
    handle,
    displayName,
    photoURL,
    plan: pickNonEmpty(data.plan),
    isPro: data.isPro === true || data.plan === "pro",
  };
}

/** Top 行を profilesByUid で上書き（無い uid はそのまま） */
export function enrichGamePointsTopEntries(
  top: readonly GamePointsTopEntryV1[],
  profilesByUid: ReadonlyMap<string, GamePointsTopProfileLite>
): GamePointsTopEntryV1[] {
  return top.map((row) => {
    const uid = row.uid?.trim() || null;
    if (!uid) return { ...row };
    const profile = profilesByUid.get(uid);
    if (!profile) return { ...row };
    const handle =
      pickNonEmpty(profile.handle) ?? row.handle;
    const displayName =
      pickNonEmpty(profile.displayName) ??
      handle ??
      row.displayName;
    const photoURL =
      pickNonEmpty(profile.photoURL) ?? row.photoURL ?? null;
    const isPro = profile.isPro === true || row.isPro;
    return {
      ...row,
      handle,
      displayName,
      photoURL,
      isPro,
    };
  });
}
