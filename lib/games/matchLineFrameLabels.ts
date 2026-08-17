/** Native `GameCardList.resolveLineFrameLabels` 相当 */

function matchRoundSideCode(roundLabel: string): string {
  const u = roundLabel.toUpperCase();
  if (u.includes("PLAYOFF") || u.includes("プレーオフ")) return "PO";
  if (
    u.includes("PLAY-IN") ||
    u.includes("PLAY IN") ||
    u.includes("プレーイン")
  ) {
    return "PI";
  }
  return "RS";
}

export function resolveLineFrameLabels(
  roundLabel: string,
  pickup: boolean,
  pickupMark: "top" | "left" = "left"
): { top: string; left?: string } {
  if (!pickup) return { top: roundLabel };
  if (pickupMark === "left") {
    return { top: roundLabel, left: "PICK UP" };
  }
  return { top: "PICK UP", left: matchRoundSideCode(roundLabel) };
}
