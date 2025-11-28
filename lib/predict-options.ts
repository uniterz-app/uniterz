// lib/predict-options.ts
export type LeagueType = "bj" | "j";

export type PredictOption = {
  id: string;                   // 重複禁止チェック用の安定ID
  label: string;                // UIに出す文言
  side: "home" | "away" | "draw" | null;
};

const B_RANGES = [
  "1–3点差", "4–6点差", "7–9点差",
  "10–14点差", "15–19点差", "20–24点差",
  "25–29点差", "30点差以上",
];

const J_HOME_AWAY = [
  "1-0", "2-0", "2-1", "3-0", "3-1", "3-2", "4点以上",
];

const J_DRAW = ["0-0", "1-1", "2-2", "3点以上"];

/** B.LEAGUE（バスケ）向け */
function buildBasketOptions(home: string, away: string): PredictOption[] {
  const homeList = B_RANGES.map((r, i) => ({
    id: `bj:home:${i}`,
    label: `${home} ${r}で勝利`,
    side: "home" as const,
  }));
  const awayList = B_RANGES.map((r, i) => ({
    id: `bj:away:${i}`,
    label: `${away} ${r}で勝利`,
    side: "away" as const,
  }));
  return [...homeList, ...awayList];
}

/** J1（サッカー）向け（修正済み：HOME → DRAW → AWAY の順で index が重複しない） */
function buildSoccerOptions(home: string, away: string): PredictOption[] {
  // HOME 0〜6
  const homeList = J_HOME_AWAY.map((r, i) => ({
    id: `j:home:${i}`,                // 0〜6
    label: `${home} ${r}で勝利`,
    side: "home" as const,
  }));

  // DRAW 7〜10
  const drawList = J_DRAW.map((r, i) => ({
    id: `j:draw:${i + 7}`,            // 7〜10
    label: `${r} で引き分け`,
    side: "draw" as const,
  }));

  // AWAY 11〜17
  const awayList = J_HOME_AWAY.map((r, i) => ({
    id: `j:away:${i + 11}`,           // 11〜17
    label: `${away} ${r}で勝利`,
    side: "away" as const,
  }));

  return [...homeList, ...drawList, ...awayList];
}

/** 公開API：リーグとチーム名から選択肢を作る */
export function buildPredictOptions(
  league: LeagueType,
  homeName: string,
  awayName: string
): PredictOption[] {
  return league === "j"
    ? buildSoccerOptions(homeName, awayName)
    : buildBasketOptions(homeName, awayName);
}
