export type GameWcStage = "qualifying" | "main";

type WcStageGameInput = {
  knockout?: boolean | null;
  roundLabel?: string | null;
  wcStage?: string | null;
};

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

export function isWcKnockoutStage(wcStage: GameWcStage | null | undefined): boolean {
  return wcStage === "main";
}
