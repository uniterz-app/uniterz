import type { MatchCardProps } from "@/app/component/games/MatchCard";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { normalizeWcTeamId } from "@/lib/wc/resolveWcTeamId";

/** 試合カードの最新状態をリザルト投稿に反映（オーバーレイ用 MatchCard） */
export function mergeGameIntoResultPost(
  post: PredictionPostV2,
  game: MatchCardProps
): PredictionPostV2 {
  const homeTeamId =
    (normalizeWcTeamId(game.home?.teamId) ??
      normalizeWcTeamId(post.home?.teamId) ??
      post.home?.teamId?.trim()) ||
    "";
  const awayTeamId =
    (normalizeWcTeamId(game.away?.teamId) ??
      normalizeWcTeamId(post.away?.teamId) ??
      post.away?.teamId?.trim()) ||
    "";
  return {
    ...post,
    status: game.status,
    result:
      game.status === "final" && game.score
        ? { home: game.score.home, away: game.score.away }
        : (post.result ?? null),
    home: {
      ...post.home,
      name: game.home.name,
      teamId: homeTeamId,
    },
    away: {
      ...post.away,
      name: game.away.name,
      teamId: awayTeamId,
    },
    game: {
      league: game.league,
      home: homeTeamId,
      away: awayTeamId,
      status: game.status,
      ...(game.status === "final" && game.score
        ? { finalScore: { home: game.score.home, away: game.score.away } }
        : post.game?.finalScore
          ? { finalScore: post.game.finalScore }
          : {}),
    },
  };
}
