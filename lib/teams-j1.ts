// lib/teams-j1.ts
export type TeamColor = { primary: string; secondary?: string; textOnPrimary?: string };
export type TeamColorMap = Record<string, TeamColor>;

/**
 * 2024-25想定のJ1 20クラブ
 * 必要ならあなたのシーズンに合わせて増減・色調整してください。
 */
export const teamColorsJ1: TeamColorMap = {
  "北海道コンサドーレ札幌": { primary: "#D50032", secondary: "#000000" },     // 赤/黒
  "鹿島アントラーズ":       { primary: "#8A1538", secondary: "#13294B" },     // ボルドー/ネイビー
  "浦和レッズ":             { primary: "#D7000F", secondary: "#111111" },     // レッズレッド/黒
  "柏レイソル":             { primary: "#FFDD00", secondary: "#000000", textOnPrimary: "#000" }, // イエロー/黒
  "FC東京":                 { primary: "#004097", secondary: "#E60012" },     // 青/赤
  "東京ヴェルディ":         { primary: "#00853E", secondary: "#C9B037" },     // グリーン/ゴールド
  "川崎フロンターレ":       { primary: "#00A0E9", secondary: "#000000" },     // サックス/黒
  "横浜F・マリノス":        { primary: "#00205B", secondary: "#C8102E" },     // ネイビー/赤（+金）
  "湘南ベルマーレ":         { primary: "#00A859", secondary: "#0073CF" },     // グリーン/ブルー
  "アルビレックス新潟":     { primary: "#FF6A13", secondary: "#0057B7" },     // オレンジ/ブルー
  "名古屋グランパス":       { primary: "#E60012", secondary: "#F5A300" },     // レッド/ゴールド
  "京都サンガF.C.":         { primary: "#53284F", secondary: "#000000" },     // パープル/黒
  "ガンバ大阪":             { primary: "#003087", secondary: "#000000" },     // ブルー/黒
  "セレッソ大阪":           { primary: "#FF4F9A", secondary: "#1B1464" },     // ピンク/ネイビー
  "ヴィッセル神戸":         { primary: "#800020", secondary: "#FFFFFF" },     // バーガンディ/白
  "サンフレッチェ広島":     { primary: "#4C2F92", secondary: "#C9B037" },     // パープル/ゴールド
  "アビスパ福岡":           { primary: "#0A2A5E", secondary: "#00AEEF" },     // ネイビー/シアン
  "サガン鳥栖":             { primary: "#00B2E5", secondary: "#EC6EA7" },     // シアン/ピンク
  "ジュビロ磐田":           { primary: "#6FA8DC", secondary: "#F9E27D" },     // ライトブルー/イエロー
  "FC町田ゼルビア":         { primary: "#1B4EA1", secondary: "#C9AA00" },     // ブルー/ゴールド
  "清水エスパルス": {
  primary: "#F6A800",     // オレンジ
  secondary: "#002855"    // ネイビー
},
"ファジアーノ岡山": {
  primary: "#870042",     // ワインレッド
  secondary: "#002052"    // ネイビー
},
"横浜FC": {
  primary: "#33A6CC",     // フォックスブルー
  secondary: "#002B55"    // ネイビー
},

};
