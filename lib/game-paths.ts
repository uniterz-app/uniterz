// app/lib/game-paths.ts
export const gamePath = {
  predict: (gameId: string) => `/web/games/${gameId}/predict`,
  // 将来：試合ごとの予想タイムライン
  predictions: (gameId: string) => `/web/games/${gameId}/predictions`,
};
