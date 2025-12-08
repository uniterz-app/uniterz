export type TeamColor = { primary: string; secondary?: string; textOnPrimary?: string };
export type TeamColorMap = Record<string, TeamColor>;

/**
 * J1（+追加クラブ含む）teamId ベース カラーマップ
 */
export const teamColorsJ1: TeamColorMap = {
  "j1-hokkaido": { primary: "#D50032", secondary: "#000000" },  // 北海道コンサドーレ札幌
  "j1-kashima": { primary: "#8A1538", secondary: "#13294B" },   // 鹿島アントラーズ
  "j1-urawa": { primary: "#D7000F", secondary: "#111111" },     // 浦和レッズ
  "j1-kashiwa": { primary: "#FFDD00", secondary: "#000000", textOnPrimary: "#000" }, // 柏レイソル
  "j1-fctokyo": { primary: "#004097", secondary: "#E60012" },   // FC東京
  "j1-verdy": { primary: "#00853E", secondary: "#C9B037" },     // 東京ヴェルディ
  "j1-kawasaki": { primary: "#00A0E9", secondary: "#000000" },  // 川崎フロンターレ
  "j1-marinos": { primary: "#00205B", secondary: "#C8102E" },   // 横浜F・マリノス
  "j1-shonan": { primary: "#00A859", secondary: "#0073CF" },    // 湘南ベルマーレ
  "j1-niigata": { primary: "#FF6A13", secondary: "#0057B7" },   // アルビレックス新潟
  "j1-grampus": { primary: "#E60012", secondary: "#F5A300" },   // 名古屋グランパス
  "j1-kyoto": { primary: "#53284F", secondary: "#000000" },      // 京都サンガF.C.
  "j1-gamba": { primary: "#003087", secondary: "#000000" },      // ガンバ大阪
  "j1-cerezo": { primary: "#FF4F9A", secondary: "#1B1464" },     // セレッソ大阪
  "j1-kobe": { primary: "#800020", secondary: "#FFFFFF" },       // ヴィッセル神戸
  "j1-hiroshima": { primary: "#4C2F92", secondary: "#C9B037" },  // サンフレッチェ広島
  "j1-fukuoka": { primary: "#0A2A5E", secondary: "#00AEEF" },    // アビスパ福岡
  "j1-tosu": { primary: "#00B2E5", secondary: "#EC6EA7" },       // サガン鳥栖
  "j1-iwata": { primary: "#6FA8DC", secondary: "#F9E27D" },      // ジュビロ磐田
  "j1-machida": { primary: "#1B4EA1", secondary: "#C9AA00" },    // FC町田ゼルビア

  // 追加クラブ（あなたがリストした分を teamId 化）
  "j1-shimizu": { primary: "#F6A800", secondary: "#002855" },    // 清水エスパルス
  "j1-okayama": { primary: "#870042", secondary: "#002052" },    // ファジアーノ岡山
  "j1-yokohamafc": { primary: "#33A6CC", secondary: "#002B55" }, // 横浜FC
};
