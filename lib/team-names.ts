// チーム名を2行に分けるルール
export const teamNameRules: Record<string, { line1: string; line2: string }> = {
  "レバンガ北海道": { line1: "レバンガ", line2: "北海道" },
  "秋田ノーザンハピネッツ": { line1: "秋田", line2: "Nハピネッツ" },
  "仙台89ERS": { line1: "仙台", line2: "89ERS" },
  "宇都宮ブレックス": { line1: "宇都宮", line2: "ブレックス" },
  "群馬クレインサンダーズ": { line1: "群馬", line2: "Cサンダーズ" },
  "茨城ロボッツ": { line1: "茨城", line2: "ロボッツ" },
  "千葉ジェッツ": { line1: "千葉", line2: "ジェッツ" },
  "アルバルク東京": { line1: "アルバルク", line2: "東京" },
  "サンロッカーズ渋谷": { line1: "サンロッカーズ", line2: "渋谷" },
  "川崎ブレイブサンダース": { line1: "川崎", line2: "Bサンダース" },
  "横浜ビー・コルセアーズ": { line1: "横浜", line2: "Bコルセアーズ" },
  "信州ブレイブウォリアーズ": { line1: "信州", line2: "Bウォリアーズ" },
  "三遠ネオフェニックス": { line1: "三遠", line2: "Nフェニックス" },
  "シーホース三河": { line1: "シーホース", line2: "三河" },
  "ファイティングイーグルス名古屋": { line1: "FE", line2: "名古屋" },
  "名古屋ダイヤモンドドルフィンズ": { line1: "名古屋", line2: "Dドルフィンズ" },
  "京都ハンナリーズ": { line1: "京都", line2: "ハンナリーズ" },
  "大阪エヴェッサ": { line1: "大阪", line2: "エヴェッサ" },
  "島根スサノオマジック": { line1: "島根", line2: "Sマジック" },
  "広島ドラゴンフライズ": { line1: "広島", line2: "Dフライズ" },
  "佐賀バルーナーズ": { line1: "佐賀", line2: "バルーナーズ" },
  "長崎ヴェルカ": { line1: "長崎", line2: "ヴェルカ" },
  "琉球ゴールデンキングス": { line1: "琉球", line2: "Gキングス" },
  "滋賀レイクス": { line1: "滋賀", line2: "レイクス" },
  "福島ファイヤーボンズ": { line1: "福島", line2: "Fボンズ" },
  "越谷アルファーズ": { line1: "越谷", line2: "アルファーズ" },
  "富山グラウジーズ": { line1: "富山", line2: "グラウジーズ" },
  "アルティーリ千葉": { line1: "アルティーリ", line2: "千葉" },
};
// チーム名を「1行目 / 2行目」に分けるヘルパー
export function splitTeamName(name: string): [string, string] {
  const key = (name ?? "").trim();

  // 1) まずは辞書にヒットするか見る
  //    例: teamNameRules["アルバルク東京"] = { line1: "アルバルク", line2: "東京" }
  //    ↑ この teamNameRules は既にこのファイルにあるやつ
  // @ts-ignore（辞書が同ファイルにある前提）
  const hit = (teamNameRules as Record<string, { line1: string; line2: string }>)[key];
  if (hit) return [hit.line1.trim(), hit.line2.trim()];

  // 2) 辞書にない場合は、よくある区切り記号で二分
  const seps = ["・", "　", " ", "-", "－", "ー", "（", "("]; // 中黒/全角/半角スペース/ハイフン/カッコ
  for (const sep of seps) {
    if (key.includes(sep)) {
      const [a, b = ""] = key.split(sep, 2);
      return [a.trim(), b.trim()];
    }
  }

  // 3) それでも分けられないときは中央で強制二分（見た目安定用）
  if (key.length > 6) {
    const mid = Math.round(key.length / 2);
    return [key.slice(0, mid).trim(), key.slice(mid).trim()];
  }

  // 短い名前などは2行目を空に
  return [key, ""];
}
