/**
 * 質問文の言葉 → スタッツの項目。AI には項目の一覧を渡さず（トークンが増える）、コードで決める。
 * 先に書いたものが優先（「得失点差」は「得点」より前、「オフェンスリバウンド」は「オフェンス」より前）。
 */
export type NbaAskStatWord = { re: RegExp; id: string; ja: string; en: string };

export const NBA_ASK_TEAM_STAT_WORDS: readonly NbaAskStatWord[] = [
  { re: /相手補正|\bADJ\b/i, id: "cleanAdjNet", ja: "相手補正込みNET", en: "Opponent-adjusted NET" },
  { re: /ガベージ|クリーン|\bCLN\b/i, id: "cleanNet", ja: "ガベージタイム抜きNET", en: "Garbage-time-free NET" },
  { re: /クラッチ/, id: "clutchNet", ja: "クラッチのNET", en: "Clutch NET" },
  { re: /オフェンス.?リバウンド|\bOREB/i, id: "orebPct", ja: "オフェンスリバウンド率", en: "OREB%" },
  { re: /オフェンス.?レーティング|\bORTG|攻撃力|オフェンス|攻撃/i, id: "ortg", ja: "ORTG（攻撃効率）", en: "ORTG" },
  { re: /ディフェンス.?レーティング|\bDRTG|守備力|ディフェンス|守備/i, id: "drtg", ja: "DRTG（守備効率）", en: "DRTG" },
  { re: /ネット.?レーティング|\bNET|レーティング|rating/i, id: "netrtg", ja: "NET（得失点効率）", en: "NET" },
  { re: /得失点差/, id: "diff", ja: "得失点差", en: "Point differential" },
  { re: /失点/, id: "papg", ja: "失点", en: "Points allowed" },
  { re: /ペース|テンポ|\bpace/i, id: "pace", ja: "ペース", en: "Pace" },
  { re: /\bTS%|トゥルーシューティング/i, id: "tsPct", ja: "TS%", en: "TS%" },
  { re: /\beFG/i, id: "efgPct", ja: "eFG%", en: "eFG%" },
  { re: /(?:3P|スリー|3ポイント).{0,4}(?:%|成功率|確率)/i, id: "fg3Pct", ja: "3P成功率", en: "3P%" },
  { re: /(?:3P|スリー|3ポイント).{0,6}(?:打|試投|本数|アテンプト)/i, id: "fg3a", ja: "3P試投数", en: "3PA" },
  { re: /\bFG%|フィールドゴール/i, id: "fgPct", ja: "FG成功率", en: "FG%" },
  { re: /\bFT%|フリースロー/i, id: "ftPct", ja: "FT成功率", en: "FT%" },
  { re: /ターンオーバー|\bTOV/i, id: "tovPct", ja: "ターンオーバー率", en: "TOV%" },
  { re: /ペイント/, id: "ptsPaint", ja: "ペイント内の得点", en: "Paint points" },
  { re: /速攻|ファストブレイク|トランジション/, id: "ptsFb", ja: "速攻の得点", en: "Fast-break points" },
  { re: /セカンド.?チャンス/, id: "ptsSecondChance", ja: "セカンドチャンスの得点", en: "Second-chance points" },
  { re: /アイソ/, id: "isoPpp", ja: "アイソレーションの効率", en: "Isolation PPP" },
  { re: /ピック.?(?:アンド|&|＆|ン).?ロール|\bPnR/i, id: "pnrBhPpp", ja: "ピック&ロールの効率", en: "Pick-and-roll PPP" },
  { re: /スポットアップ/, id: "spotupPpp", ja: "スポットアップの効率", en: "Spot-up PPP" },
  { re: /ドライブ/, id: "drives", ja: "ドライブ回数", en: "Drives" },
  { re: /ディフレクション/, id: "deflections", ja: "ディフレクション", en: "Deflections" },
  { re: /ボックスアウト/, id: "boxOuts", ja: "ボックスアウト", en: "Box-outs" },
  { re: /コンテスト/, id: "contestedShots", ja: "シュートへのコンテスト", en: "Contested shots" },
  { re: /勝率/, id: "winPct", ja: "勝率", en: "Win %" },
  { re: /得点|点取|点を取/, id: "ppg", ja: "得点", en: "Points" },
];

export const NBA_ASK_PLAYER_STAT_WORDS: readonly NbaAskStatWord[] = [
  { re: /トリプル.?ダブル/, id: "triple_doubles", ja: "トリプルダブル", en: "Triple-doubles" },
  { re: /ダブル.?ダブル/, id: "double_doubles", ja: "ダブルダブル", en: "Double-doubles" },
  { re: /30点以上/, id: "games_30pts", ja: "30点以上の試合", en: "30-point games" },
  { re: /20点以上/, id: "games_20pts", ja: "20点以上の試合", en: "20-point games" },
  { re: /\bPER\b/i, id: "per", ja: "PER", en: "PER" },
  { re: /\bTS%|トゥルーシューティング/i, id: "ts_pct", ja: "TS%", en: "TS%" },
  { re: /\bUSG|使用率/i, id: "usg", ja: "USG%（使用率）", en: "USG%" },
  { re: /\bPIE\b/i, id: "pie", ja: "PIE", en: "PIE" },
  { re: /\beFG/i, id: "efg_pct", ja: "eFG%", en: "eFG%" },
  { re: /クラッチ/, id: "clutch_pts", ja: "クラッチの得点", en: "Clutch points" },
  { re: /アイソ/, id: "iso_ppp", ja: "アイソレーションの効率", en: "Isolation PPP" },
  { re: /オフェンス.?レーティング|\bORTG/i, id: "ortg", ja: "ORTG", en: "ORTG" },
  { re: /ディフェンス.?レーティング|\bDRTG/i, id: "drtg", ja: "DRTG", en: "DRTG" },
  { re: /アシスト率/, id: "ast_pct", ja: "アシスト率", en: "AST%" },
  { re: /リバウンド率/, id: "reb_pct", ja: "リバウンド率", en: "REB%" },
  { re: /(?:3P|スリー|3ポイント).{0,4}(?:%|成功率|確率)/i, id: "fg3_pct", ja: "3P成功率", en: "3P%" },
  { re: /\bFG%|フィールドゴール|シュート率/i, id: "fg_pct", ja: "FG成功率", en: "FG%" },
  { re: /\bFT%|フリースロー/i, id: "ft_pct", ja: "FT成功率", en: "FT%" },
  { re: /3P|スリー|3ポイント/i, id: "fg3m", ja: "3P成功数", en: "3PM" },
  { re: /ブロック|\bBLK/i, id: "blk", ja: "ブロック", en: "BLK" },
  { re: /スティール|\bSTL/i, id: "stl", ja: "スティール", en: "STL" },
  { re: /ターンオーバー|\bTOV/i, id: "tov", ja: "ターンオーバー", en: "TOV" },
  { re: /オフェンス.?リバウンド|\bOREB/i, id: "oreb", ja: "オフェンスリバウンド", en: "OREB" },
  { re: /リバウンド|\bREB/i, id: "reb", ja: "リバウンド", en: "REB" },
  { re: /アシスト|\bAST/i, id: "ast", ja: "アシスト", en: "AST" },
  { re: /出場時間|何分/, id: "min", ja: "出場時間", en: "MIN" },
  { re: /得点|何点|\bPTS/i, id: "pts", ja: "得点", en: "PTS" },
];

export function nbaAskStatWord(list: readonly NbaAskStatWord[], text: string): NbaAskStatWord | null {
  return list.find((w) => w.re.test(text)) ?? null;
}

/** 0–1 の率、または % 表記の項目 */
export function nbaAskIsPctStat(id: string): boolean {
  return /pct|Pct|_pct|usg|^pie$|Rate$|winPct/.test(id) && !/Ppp|ppp/.test(id);
}
