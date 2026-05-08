/** World Cup（league=wc）ランキング用ステージ */

export const WC_RANKING_STAGES = ["overall", "qualifying", "main"] as const;

export type WcRankingStage = (typeof WC_RANKING_STAGES)[number];

export function isWcRankingStage(v: unknown): v is WcRankingStage {
  return (
    v === "overall" ||
    v === "qualifying" ||
    v === "main"
  );
}

/** 試合ドキュメントの wcStage（予選 / 本戦）。未設定で overall のみ加算 */
export type GameWcStage = "qualifying" | "main";

export function isGameWcStage(v: unknown): v is GameWcStage {
  return v === "qualifying" || v === "main";
}
