import { normalizeLeague } from "@/lib/leagues";
import { resolveWcStageFromGame } from "@/lib/wc/resolveWcStage";

type WcKnockoutGameInput = {
  league?: unknown;
  knockout?: boolean | null;
  roundLabel?: string | null;
  wcStage?: string | null;
};

/**
 * WC のノックアウトステージ（R32 以降）の試合か。
 * ノックアウトでは引き分けが存在しないため、引き分け予想・市場の引き分け表示を抑止する判定に使う。
 */
export function isWcKnockoutGame(
  game: WcKnockoutGameInput | null | undefined
): boolean {
  if (!game) return false;
  if (normalizeLeague(game.league) !== "wc") return false;
  if (game.knockout === true) return true;
  if (
    resolveWcStageFromGame({
      knockout: game.knockout ?? null,
      roundLabel: game.roundLabel ?? null,
      wcStage: game.wcStage ?? null,
    }) === "main"
  ) {
    return true;
  }

  const label = String(game.roundLabel ?? "").trim();
  if (!label) return false;
  if (/^group\s/i.test(label)) return false;
  return /round of|quarter[-\s]?final|semi[-\s]?final|\bfinal\b|3rd place|third place|knockout/i.test(
    label
  );
}
