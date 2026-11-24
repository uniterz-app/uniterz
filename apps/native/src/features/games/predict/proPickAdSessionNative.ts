/**
 * この起動で広告を見た試合。シートを閉じても中身を出し続け、サーバー確認は裏で取る。
 */
let earnedGameId: string | null = null;

export function setProPickAdEarnedGameId(gameId: string | null) {
  earnedGameId = gameId;
}

export function peekProPickAdEarnedGameId(): string | null {
  return earnedGameId;
}
