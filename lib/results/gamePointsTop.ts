/**
 * 試合確定時に games.pointsDistribution.top へ埋め込む上位エントリ。
 * settle 時の posts スナップから構築（追加クエリなし）。
 */
export type GamePointsTopEntryV1 = {
  rank: number;
  postId: string;
  uid: string | null;
  handle: string;
  displayName: string;
  photoURL: string | null;
  isPro: boolean;
  points: number;
};

function isFiniteNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export function parseGamePointsTopEntries(
  raw: unknown
): GamePointsTopEntryV1[] {
  if (!Array.isArray(raw)) return [];
  const out: GamePointsTopEntryV1[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (!isFiniteNum(o.rank) || !isFiniteNum(o.points)) continue;
    if (typeof o.postId !== "string" || !o.postId.trim()) continue;
    const handle =
      typeof o.handle === "string" && o.handle.trim()
        ? o.handle.trim()
        : typeof o.displayName === "string" && o.displayName.trim()
          ? o.displayName.trim()
          : "—";
    const displayName =
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName.trim()
        : handle;
    out.push({
      rank: Math.max(1, Math.floor(o.rank)),
      postId: o.postId.trim(),
      uid: typeof o.uid === "string" && o.uid.trim() ? o.uid.trim() : null,
      handle,
      displayName,
      photoURL:
        typeof o.photoURL === "string" && o.photoURL.trim()
          ? o.photoURL.trim()
          : null,
      isPro: o.isPro === true,
      points: o.points,
    });
  }
  return out.sort((a, b) => a.rank - b.rank).slice(0, 10);
}

/** posts スナップ行から Top 用の表示メタを抜く（追加 user read なし） */
export function authorMetaFromResultPost(data: Record<string, unknown>): {
  uid: string | null;
  handle: string;
  displayName: string;
  photoURL: string | null;
  isPro: boolean;
} {
  const uid =
    typeof data.authorUid === "string" && data.authorUid.trim()
      ? data.authorUid.trim()
      : null;
  const author =
    data.author !== null && typeof data.author === "object"
      ? (data.author as Record<string, unknown>)
      : null;
  const handleRaw =
    (typeof data.authorHandle === "string" && data.authorHandle.trim()
      ? data.authorHandle.trim()
      : null) ??
    (typeof author?.handle === "string" && author.handle.trim()
      ? author.handle.trim()
      : null);
  const displayNameRaw =
    typeof author?.name === "string" && author.name.trim()
      ? author.name.trim()
      : null;
  const handle = handleRaw ?? displayNameRaw ?? "—";
  const displayName = displayNameRaw ?? handle;
  const photoURL =
    typeof author?.avatarUrl === "string" && author.avatarUrl.trim()
      ? author.avatarUrl.trim()
      : null;
  const isPro =
    data.authorIsPro === true ||
    author?.plan === "pro" ||
    author?.isPro === true;
  return { uid, handle, displayName, photoURL, isPro };
}
