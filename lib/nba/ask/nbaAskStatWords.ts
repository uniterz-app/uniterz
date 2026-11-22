/**
 * 質問文の言葉 → スタッツの項目。AI には項目の一覧を渡さず（トークンが増える）、コードで決める。
 * 先に書いたものが優先（「得失点差」は「得点」より前、「オフェンスリバウンド」は「オフェンス」より前）。
 */
export type NbaAskStatWord = { re: RegExp; id: string; ja: string; en: string };

export const NBA_ASK_TEAM_STAT_WORDS: readonly NbaAskStatWord[] = [
  { re: /相手補正|\bADJ\b/i, id: "cleanAdjNet", ja: "相手補正込みNET", en: "Opponent-adjusted NET" },
  { re: /ガベージ|クリーン|\bCLN\b/i, id: "cleanNet", ja: "ガベージタイム抜きNET", en: "Garbage-time-free NET" },
  { re: /クラッチ/, id: "clutchNet", ja: "クラッチのNET", en: "Clutch NET" },
  { re: /オフェンシ?ブ?.?リバウンド|\bOREB/i, id: "orebPct", ja: "オフェンスリバウンド率", en: "OREB%" },
  { re: /リバウンド|\bREB/i, id: "rebChancePct", ja: "リバウンド確保率（チャンスあたり）", en: "Rebound chance %" },
  { re: /オフェンシ?ブ?.?レーティング|\bORTG|攻撃力|オフェンス|攻撃|offen[cs]e/i, id: "ortg", ja: "ORTG（攻撃効率）", en: "ORTG" },
  { re: /ディフェンシ?ブ?.?レーティング|\bDRTG|守備力|ディフェンス|守備|defen[cs]e/i, id: "drtg", ja: "DRTG（守備効率）", en: "DRTG" },
  { re: /ネット.?レーティング|\bNET|レーティング|rating/i, id: "netrtg", ja: "NET（得失点効率）", en: "NET" },
  { re: /得失点差/, id: "diff", ja: "得失点差", en: "Point differential" },
  { re: /失点/, id: "papg", ja: "失点", en: "Points allowed" },
  { re: /ペース|テンポ|\bpace/i, id: "pace", ja: "ペース", en: "Pace" },
  { re: /\bTS%|トゥルーシューティング/i, id: "tsPct", ja: "TS%", en: "TS%" },
  { re: /\beFG/i, id: "efgPct", ja: "eFG%", en: "eFG%" },
  { re: /(?:3P|スリー|3ポイント).{0,4}(?:%|成功率|確率)/i, id: "fg3Pct", ja: "3P成功率", en: "3P%" },
  { re: /(?:3P|スリー|3ポイント).{0,6}(?:打|試投|本数|アテンプト)/i, id: "fg3a", ja: "3P試投数", en: "3PA" },
  { re: /^(?!.*(?:FG|フィールドゴール|フリースロー)).*(?:3P|スリー|3ポイント)(?!.*(?:%|成功率|確率))/i, id: "fg3a", ja: "3P試投数", en: "3PA" },
  { re: /\bFG%|\bFG.?(?:成功率|確率)|フィールドゴール/i, id: "fgPct", ja: "FG成功率", en: "FG%" },
  { re: /\bFT%|\bFT.?(?:成功率|確率)|フリースロー/i, id: "ftPct", ja: "FT成功率", en: "FT%" },
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
  { re: /ピック.?(?:アンド|&|＆|ン).?ロール|\bPnR/i, id: "pnr_bh_ppp", ja: "ピック&ロール（ボール運び）の効率", en: "PnR ball-handler PPP" },
  { re: /スポットアップ/, id: "spotup_ppp", ja: "スポットアップの効率", en: "Spot-up PPP" },
  { re: /トランジション/, id: "trans_ppp", ja: "トランジションの効率", en: "Transition PPP" },
  { re: /ポストアップ/, id: "post_ppp", ja: "ポストアップの効率", en: "Post-up PPP" },
  { re: /オフェンシ?ブ?.?レーティング|\bORTG/i, id: "ortg", ja: "ORTG", en: "ORTG" },
  { re: /ディフェンシ?ブ?.?レーティング|\bDRTG/i, id: "drtg", ja: "DRTG", en: "DRTG" },
  { re: /アシスト率/, id: "ast_pct", ja: "アシスト率", en: "AST%" },
  { re: /アシスト.{0,2}(?:対|\/|と)?.{0,2}ターンオーバー.{0,2}比|\bAST\/TO|\bA\/TO/i, id: "ast_to", ja: "アシスト/ターンオーバー比", en: "AST/TO" },
  { re: /リバウンド.?チャンス(?:率|.?あたり)|リバウンド確保率/, id: "reb_chance_pct", ja: "リバウンド確保率（チャンスあたり）", en: "Rebound chance %" },
  { re: /リバウンド.?チャンス/, id: "reb_chances", ja: "リバウンドチャンス", en: "Rebound chances" },
  { re: /リバウンド率/, id: "reb_pct", ja: "リバウンド率", en: "REB%" },
  { re: /キャッチ.{0,4}シュート|catch.?(?:and|&).?shoot/i, id: "cns_fg_pct", ja: "キャッチ&シュートのFG成功率", en: "Catch-and-shoot FG%" },
  { re: /プルアップ(?:の?(?:3P|スリー|ジャンパー|シュート))?|pull.?ups?/i, id: "pullup_fg_pct", ja: "プルアップのFG成功率", en: "Pull-up FG%" },
  { re: /リム.?プロテクション|リム.?(?:の|周りの)?守備|ゴール下の守備/, id: "opp_lt6_pct", ja: "6ft以内で守った相手のFG成功率", en: "Opp FG% within 6 ft" },
  { re: /(?:3P|スリー|3ポイント).{0,4}(?:%|成功率|確率)/i, id: "fg3_pct", ja: "3P成功率", en: "3P%" },
  { re: /(?:3P|スリー|3ポイント).{0,6}(?:打|試投|本数|アテンプト)|\b3PA\b/i, id: "fg3a", ja: "3P試投数", en: "3PA" },
  { re: /\bFG%|\bFG.?(?:成功率|確率)|フィールドゴール|シュート率/i, id: "fg_pct", ja: "FG成功率", en: "FG%" },
  { re: /(?:\bFT|フリースロー).{0,4}(?:試投|本数|アテンプト)|(?:\bFT|フリースロー)を?.{0,6}もら|\bFTA\b/i, id: "fta", ja: "FT試投数", en: "FTA" },
  { re: /\bFT%|\bFT.?(?:成功率|確率)|フリースロー/i, id: "ft_pct", ja: "FT成功率", en: "FT%" },
  { re: /3P|スリー|3ポイント/i, id: "fg3m", ja: "3P成功数", en: "3PM" },
  { re: /ドライブ.{0,6}(?:成功率|確率|FG)/i, id: "drive_fg_pct", ja: "ドライブのFG成功率", en: "Drive FG%" },
  { re: /ドライブ.{0,4}(?:から|での|の)?.{0,2}(?:得点|点)/, id: "drive_pts", ja: "ドライブからの得点", en: "Drive points" },
  { re: /ドライブ|\bdrives?\b/i, id: "drives", ja: "ドライブ回数", en: "Drives" },
  { re: /ポテンシャル.?アシスト|potential.?assists?/i, id: "potential_ast", ja: "ポテンシャルアシスト", en: "Potential assists" },
  { re: /パス(?!ポート)|\bpasses\b/i, id: "passes", ja: "パス数", en: "Passes" },
  { re: /ペイント.?タッチ/, id: "paint_touches", ja: "ペイントタッチ", en: "Paint touches" },
  { re: /タッチ|\btouches\b/i, id: "touches", ja: "タッチ数", en: "Touches" },
  { re: /走行距離|走る距離|移動距離/, id: "dist_miles", ja: "走行距離（マイル）", en: "Distance (mi)" },
  { re: /スピード|速さ/, id: "speed", ja: "平均スピード（マイル毎時）", en: "Speed (mph)" },
  { re: /オフボール|オフ.?スクリーン/, id: "offscreen_ppp", ja: "オフスクリーンの効率", en: "Off-screen PPP" },
  { re: /カッティング|カット(?:イン)?(?:の|から)/, id: "cut_ppp", ja: "カットの効率", en: "Cut PPP" },
  { re: /ディフレクション/, id: "deflections", ja: "ディフレクション", en: "Deflections" },
  { re: /ボックスアウト/, id: "box_outs", ja: "ボックスアウト", en: "Box-outs" },
  { re: /ル[ーー]?[スズ]ボール/, id: "loose_balls", ja: "ルーズボール", en: "Loose balls" },
  { re: /チャージ/, id: "charges", ja: "チャージを誘った数", en: "Charges drawn" },
  { re: /コンテスト/, id: "contested_shots", ja: "シュートへのコンテスト", en: "Contested shots" },
  { re: /ブロック|\bBLK/i, id: "blk", ja: "ブロック", en: "BLK" },
  { re: /スティール|\bSTL/i, id: "stl", ja: "スティール", en: "STL" },
  { re: /ターンオーバー|\bTOV/i, id: "tov", ja: "ターンオーバー", en: "TOV" },
  { re: /オフェンシ?ブ?.?リバウンド|\bOREB/i, id: "oreb", ja: "オフェンスリバウンド", en: "OREB" },
  { re: /リバウンド|\bREB/i, id: "reb", ja: "リバウンド", en: "REB" },
  { re: /アシスト|\bAST/i, id: "ast", ja: "アシスト", en: "AST" },
  { re: /出場時間|何分/, id: "min", ja: "出場時間", en: "MIN" },
  { re: /(?<!テクニカル.?|フ[レラ]グラント.?)ファウル(?!.{0,3}(?:を?(?:もら|受け|誘)))|\bPF\b/i, id: "pf", ja: "ファウル", en: "PF" },
  { re: /得点|何点|\bPTS/i, id: "pts", ja: "得点", en: "PTS" },
];

export function nbaAskStatWord(list: readonly NbaAskStatWord[], text: string): NbaAskStatWord | null {
  return list.find((w) => w.re.test(text)) ?? null;
}

/** 「3Pの試投数と成功率」「FG%と3P%」のように並べて聞かれた項目を、質問に出てきた順に全部（拾った部分は伏せて重ねて拾わない） */
export function nbaAskStatWordsAll(list: readonly NbaAskStatWord[], text: string): NbaAskStatWord[] {
  let t = text
    .replace(/(3P|スリー|3ポイント|フリースロー|FT)の?(試投数?|本数)(と|・|、)(成功率|確率|%)/gi, "$1$2$3$1$4")
    .replace(/(3P|スリー|3ポイント|フリースロー|FT)の?(成功率|確率|%)(と|・|、)(試投数?|本数)/gi, "$1$2$3$1$4");
  const hits: Array<{ w: NbaAskStatWord; at: number }> = [];
  for (const w of list) {
    const m = new RegExp(w.re.source, w.re.flags.replace("g", "")).exec(t);
    if (!m || hits.some((h) => h.w.id === w.id)) continue;
    hits.push({ w, at: m.index });
    t = t.slice(0, m.index) + " ".repeat(m[0].length) + t.slice(m.index + m[0].length);
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.w);
}

/** 0–1 の率、または % 表記の項目 */
export function nbaAskIsPctStat(id: string): boolean {
  return /pct|Pct|_pct|usg|^pie$|Rate$|winPct/.test(id) && !/Ppp|ppp/.test(id);
}
