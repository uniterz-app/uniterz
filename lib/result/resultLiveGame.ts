/** リザルトカード：試合開始〜確定前まで LIVE 表示（MatchCard / ResultCard と同趣旨） */
export function isResultPostLiveGame(
  post: {
    status?: string | null;
    startAtMillis?: number | null;
    game?: { status?: string | null } | null;
  },
  clockMs: number
): boolean {
  const status =
    typeof post.status === "string"
      ? post.status
      : typeof post.game?.status === "string"
        ? post.game.status
        : "";
  if (status === "final") return false;
  if (status === "live") return true;
  if (
    status === "scheduled" &&
    typeof post.startAtMillis === "number" &&
    Number.isFinite(post.startAtMillis) &&
    clockMs >= post.startAtMillis
  ) {
    return true;
  }
  return false;
}

/** キックオフ以降（LIVE / 確定含む） */
export function isResultPostMatchStarted(
  post: {
    status?: string | null;
    startAtMillis?: number | null;
  },
  clockMs: number
): boolean {
  const status = typeof post.status === "string" ? post.status : "";
  if (status === "live" || status === "final") return true;
  if (
    status === "scheduled" &&
    typeof post.startAtMillis === "number" &&
    Number.isFinite(post.startAtMillis) &&
    clockMs >= post.startAtMillis
  ) {
    return true;
  }
  return false;
}
