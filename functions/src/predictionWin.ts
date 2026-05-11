import { judgeWin } from "./judgeWin";
import { footballWinnerCorrect } from "./footballTotalScore";
import type { SettlementGameInput } from "./settlementGame";
import { leagueToSport } from "./settlementGame";

export function predictionWin(
  prediction: any,
  game: SettlementGameInput
): boolean {
  if (leagueToSport(game.league) === "football") {
    return footballWinnerCorrect(prediction, game);
  }
  return judgeWin(prediction, {
    home: game.homeScore,
    away: game.awayScore,
  });
}
