import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCachedGameDocForResult } from "@/lib/result/resultDetailFirestoreCache";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";

export type ResultPostDetailMarket = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

export type LoadResultPostDetailClientResult =
  | { ok: false; reason: "missing" }
  | {
      ok: true;
      post: PredictionPostV2;
      market: ResultPostDetailMarket | null;
      pointsDistribution: GamePointsDistributionV1 | null;
    };

/** posts + games をまとめて取得（クライアント専用）。 */
export async function loadResultPostDetailClient(
  postId: string
): Promise<LoadResultPostDetailClientResult> {
  const postSnap = await getDoc(doc(db, "posts", postId));
  if (!postSnap.exists()) {
    return { ok: false, reason: "missing" };
  }

  const post = {
    id: postSnap.id,
    ...postSnap.data(),
  } as PredictionPostV2;

  const { exists: gameExists, data: gameData } = await getCachedGameDocForResult(
    post.gameId
  );

  if (!gameExists || !gameData) {
    return {
      ok: true,
      post,
      market: null,
      pointsDistribution: null,
    };
  }
  const mkt = gameData.market as
    | {
        homeRate?: number;
        awayRate?: number;
        drawRate?: number;
        total?: number;
      }
    | undefined;
  const market: ResultPostDetailMarket = {
    homeRate: mkt?.homeRate ?? 0,
    awayRate: mkt?.awayRate ?? 0,
    drawRate: mkt?.drawRate ?? 0,
    total: mkt?.total ?? 0,
  };

  return {
    ok: true,
    post,
    market,
    pointsDistribution: parseGamePointsDistributionV1(
      rawPointsDistributionFromGameDoc(gameData)
    ),
  };
}
