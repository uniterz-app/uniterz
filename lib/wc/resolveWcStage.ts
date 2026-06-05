import type { GameWcStage } from "@/lib/rankings/wcRankingStage";

type WcStageGameInput = {
  knockout?: boolean | null;
  roundLabel?: string | null;
  wcStage?: string | null;
};

/**
 * games のフィールドから WC ランキング用ステージを決める。
 * - knockout === true → main（ノックアウト）
 * - roundLabel が "Group ..." → qualifying（グループリーグ）
 * - 上記で決まらなければ wcStage が qualifying / main ならそれを採用
 */
export function resolveWcStageFromGame(
  game: WcStageGameInput | null | undefined
): GameWcStage | null {
  if (!game) return null;
  if (game.knockout === true) return "main";

  const label = String(game.roundLabel ?? "").trim();
  if (/^group\s/i.test(label)) return "qualifying";

  if (game.wcStage === "qualifying" || game.wcStage === "main") {
    return game.wcStage;
  }
  return null;
}

/** グループリーグ試合なのに wcStage が main など誤っているか */
export function wcStageNeedsGroupFix(
  game: WcStageGameInput | null | undefined
): boolean {
  const resolved = resolveWcStageFromGame(game);
  return resolved === "qualifying" && game?.wcStage !== "qualifying";
}
