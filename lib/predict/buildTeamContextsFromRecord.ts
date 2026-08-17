import {
  currentLoseStreak,
  currentWinStreak,
  MAX_TEAM_CONTEXTS,
  type PredictTeamContext,
  type PredictTeamTone,
} from "@/lib/predict/predictTeamIntel";

type LastGameRow = { at?: { toMillis?: () => number }; isWin?: boolean };

/** MatchCard.toLast5WL と同趣旨（右端が最新） */
export function lastGamesToRecentForm(
  lastGames: LastGameRow[] | undefined
): ("W" | "L")[] {
  if (!Array.isArray(lastGames) || lastGames.length === 0) return [];

  return [...lastGames]
    .sort((a, b) => {
      const ams = a?.at?.toMillis ? a.at.toMillis() : 0;
      const bms = b?.at?.toMillis ? b.at.toMillis() : 0;
      return bms - ams;
    })
    .slice(0, 5)
    .map((g) => (g?.isWin ? "W" : "L"))
    .reverse();
}

/**
 * lastGames から表示用チーム文脈を組み立てる（現状: 連勝/連敗/直近フォーム）。
 * sideForm / vsTop / rest は別ソース（日程・順位）から後段で合流。
 * 得失点傾向は Pro Info では出さずチームスタッツ側で表示。
 */
export function buildTeamContextsFromRecord(input: {
  lastGames?: LastGameRow[];
}): PredictTeamContext[] {
  const form = lastGamesToRecentForm(input.lastGames);
  if (form.length === 0) return [];

  const contexts: PredictTeamContext[] = [];
  const winStreak = currentWinStreak(form);
  const loseStreak = currentLoseStreak(form);

  if (winStreak >= 2) {
    contexts.push({
      id: "winStreak",
      tone: "up",
      params: { streak: winStreak },
    });
  } else if (loseStreak >= 2) {
    contexts.push({
      id: "loseStreak",
      tone: "down",
      params: { streak: loseStreak },
    });
  }

  if (form.length >= 3) {
    const wins = form.filter((r) => r === "W").length;
    const losses = form.filter((r) => r === "L").length;
    const tone: PredictTeamTone =
      wins > losses ? "up" : wins < losses ? "down" : "neutral";
    contexts.push({
      id: "recentForm",
      tone,
      params: { window: form.length, wins, draws: 0, losses },
    });
  }

  return contexts.slice(0, MAX_TEAM_CONTEXTS);
}
