import type { MatchCardProps } from "@/app/component/games/MatchCard";
import type { PkScore } from "@/lib/games/pkScore";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

/** 試合カードの最新状態をリザルト投稿に反映（オーバーレイ用 MatchCard） */
export function mergeGameIntoResultPost(
  post: PredictionPostV2,
  game: MatchCardProps
): PredictionPostV2 {
  const homeTeamId =
    (game.home?.teamId?.trim() || post.home?.teamId?.trim()) || "";
  const awayTeamId =
    (game.away?.teamId?.trim() || post.away?.teamId?.trim()) || "";
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
    pkScore: (game.pkScore ?? post.pkScore ?? null) as PkScore | null,
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
      ...(game.pkScore ? { pkScore: game.pkScore } : post.game?.pkScore ? { pkScore: post.game.pkScore } : {}),
    },
  };
}
