/**
 * この起動で広告を見た試合。シートを閉じても中身を出し続け、サーバー確認は裏で取る。
 */
let earnedGameId: string | null = null;
const confirmedGameIds = new Set<string>();

export function setProPickAdEarnedGameId(gameId: string | null) {
  earnedGameId = gameId;
}

export function peekProPickAdEarnedGameId(): string | null {
  return earnedGameId;
}

export function markProPickUnlockConfirmed(gameId: string) {
  const id = gameId.trim();
  if (!id) return;
  confirmedGameIds.add(id);
  earnedGameId = id;
}

export function peekProPickUnlockConfirmed(gameId: string | null | undefined): boolean {
  const id = (gameId ?? "").trim();
  return !!id && confirmedGameIds.has(id);
}
