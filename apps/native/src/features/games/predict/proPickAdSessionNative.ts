/**
 * 予想シートを一度閉じてリワード広告を出したあと、シートを開き直した先へ渡す。
 * シート内の state は unmount で消えるので、ここだけ残す。
 */
let earnedGameId: string | null = null;

export function setProPickAdEarnedGameId(gameId: string | null) {
  earnedGameId = gameId;
}

export function peekProPickAdEarnedGameId(): string | null {
  return earnedGameId;
}
