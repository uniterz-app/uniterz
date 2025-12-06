// lib/teams-nba.ts
export type TeamColor = { primary: string; secondary?: string; textOnPrimary?: string };
export type TeamColorMap = Record<string, TeamColor>;

export const teamColorsNBA: TeamColorMap = {
  "Atlanta Hawks":        { primary: "#E03A3E", secondary: "#C1D32F" },     // 赤 / ライム
  "Boston Celtics":       { primary: "#007A33", secondary: "#BA9653" },     // グリーン / ゴールド
  "Brooklyn Nets":        { primary: "#000000", secondary: "#FFFFFF", textOnPrimary: "#fff" }, // 黒 / 白
  "Charlotte Hornets":    { primary: "#1D1160", secondary: "#00788C" },     // パープル / ティール
  "Chicago Bulls":        { primary: "#CE1141", secondary: "#000000" },     // レッド / 黒
  "Cleveland Cavaliers":  { primary: "#6F263D", secondary: "#FFB81C" },     // ワイン / ゴールド
  "Dallas Mavericks":     { primary: "#00538C", secondary: "#B8C4CA" },     // ブルー / シルバー
  "Denver Nuggets":       { primary: "#0E2240", secondary: "#FEC524" },     // ネイビー / ゴールド
  "Detroit Pistons":      { primary: "#C8102E", secondary: "#006BB6" },     // レッド / ブルー
  "Golden State Warriors":{ primary: "#1D428A", secondary: "#FFC72C" },     // ロイヤルブルー / ゴールド
  "Houston Rockets":      { primary: "#CE1141", secondary: "#000000" },     // レッド / 黒
  "Indiana Pacers":       { primary: "#002D62", secondary: "#FDBB30" },     // ネイビー / イエロー
  "LA Clippers":          { primary: "#C8102E", secondary: "#1D428A" },     // レッド / ブルー
  "Los Angeles Lakers":   { primary: "#552583", secondary: "#FDB927" },     // パープル / ゴールド
  "Memphis Grizzlies":    { primary: "#5D76A9", secondary: "#12173F" },     // ブルー / ネイビー
  "Miami Heat":           { primary: "#98002E", secondary: "#F9A01B" },     // ダークレッド / イエロー
  "Milwaukee Bucks":      { primary: "#00471B", secondary: "#EEE1C6" },     // グリーン / クリーム
  "Minnesota Timberwolves":{ primary: "#0C2340", secondary: "#236192" },    // ネイビー / ブルー
  "New Orleans Pelicans": { primary: "#0C2340", secondary: "#C8102E" },     // ネイビー / レッド
  "New York Knicks":      { primary: "#006BB6", secondary: "#F58426" },     // ブルー / オレンジ
  "Oklahoma City Thunder":{ primary: "#007AC1", secondary: "#EF3B24" },     // サンダーブルー / オレンジ
  "Orlando Magic":        { primary: "#0077C0", secondary: "#000000" },     // ブルー / 黒
  "Philadelphia 76ers":   { primary: "#006BB6", secondary: "#ED174C" },     // ブルー / レッド
  "Phoenix Suns":         { primary: "#1D1160", secondary: "#E56020" },     // パープル / オレンジ
  "Portland Trail Blazers":{ primary: "#E03A3E", secondary: "#000000" },    // レッド / 黒
  "Sacramento Kings":     { primary: "#5A2D81", secondary: "#63727A" },     // パープル / グレー
  "San Antonio Spurs":    { primary: "#C4CED4", secondary: "#000000", textOnPrimary: "#000" }, // シルバー / 黒
  "Toronto Raptors":      { primary: "#CE1141", secondary: "#000000" },     // レッド / 黒
  "Utah Jazz":            { primary: "#002B5C", secondary: "#00471B" },     // ネイビー / グリーン
  "Washington Wizards":   { primary: "#002B5C", secondary: "#E31837" },     // ネイビー / レッド
};
