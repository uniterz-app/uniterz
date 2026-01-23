// functions/src/judgeWin.ts
export function judgeWin(pred: any, result: { home: number; away: number }) {
  if (pred.winner === "draw") {
    return result.home === result.away;
  }

  return pred.winner === "home"
    ? result.home > result.away
    : result.away > result.home;
}
