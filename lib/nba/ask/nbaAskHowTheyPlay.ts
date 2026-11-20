/**
 * 「ドライブに関するスタッツ」のようにジャンルを聞かれたら、選手詳細の HOW THEY PLAY の
 * そのタブ（TRACKING はグループまで）を答えの下に出す。「ドライブの数は」のような 1 項目は数字を答えて、そのタブを下に出す。
 */
export type NbaAskHowTab =
  | "ratings"
  | "fourFactors"
  | "scoring"
  | "playtype"
  | "clutch"
  | "defense"
  | "hustle"
  | "rebounding"
  | "tracking";

export type NbaAskHowGroup = "shot" | "drive" | "pass" | "ball";

export type NbaAskHowFocus = {
  tab: NbaAskHowTab;
  group?: NbaAskHowGroup;
  ja: string;
  en: string;
  /** 答えの文に並べる項目（選手詳細の同じタブの並び） */
  ids: readonly string[];
};

const FOCUS: ReadonlyArray<NbaAskHowFocus & { re: RegExp }> = [
  { re: /ドライブ|\bdrives?\b/i, tab: "tracking", group: "drive", ja: "ドライブ", en: "Drives", ids: ["drives", "drive_fg_pct", "drive_passes", "drive_tov"] },
  {
    re: /キャッチ|プルアップ|シュートの(?:スタッツ|データ|打ち方|種類)|catch.?(?:and|&).?shoot|pull.?ups?/i,
    tab: "tracking",
    group: "shot",
    ja: "シュートの打ち方",
    en: "Shot types",
    ids: ["cns_fg_pct", "pullup_fg_pct", "pct_assisted_2pt", "pct_assisted_3pt"],
  },
  { re: /パス(?!ポート)|\bpass(?:es|ing)?\b/i, tab: "tracking", group: "pass", ja: "パス", en: "Passing", ids: ["passes", "potential_ast", "ast_pts_created", "secondary_ast", "ft_ast"] },
  { re: /タッチ|走行距離|走る距離|スピード|ボール保持|\btouch(?:es)?\b|\bspeed\b/i, tab: "tracking", group: "ball", ja: "ボール保持・運動量", en: "Ball & movement", ids: ["touches", "sec_per_touch", "paint_touches", "dist_miles", "speed"] },
  {
    re: /ハッスル|ディフレクション|ルーズボール|チャージ|\bhustle\b/i,
    tab: "hustle",
    ja: "ハッスル",
    en: "Hustle",
    ids: ["deflections", "charges", "loose_balls", "screen_ast", "contested_shots"],
  },
  { re: /リバウンド|\brebound/i, tab: "rebounding", ja: "リバウンド", en: "Rebounding", ids: ["reb_pct", "box_outs", "reb_chances", "reb_chance_pct", "reb_contest_pct"] },
  { re: /ディフェンス|守備|\bdefen[cs]e/i, tab: "defense", ja: "ディフェンス", en: "Defense", ids: ["matchup_fg_pct", "matchup_3pt_pct", "opp_2p_pct", "opp_3p_pct", "opp_lt6_pct"] },
  { re: /クラッチ|\bclutch/i, tab: "clutch", ja: "クラッチ", en: "Clutch", ids: ["clutch_pts", "clutch_fg_pct", "clutch_usg"] },
  { re: /フォー.?ファクター|4.?ファクター|four.?factors?/i, tab: "fourFactors", ja: "フォーファクター", en: "Four factors", ids: ["efg_pct", "tov_pct", "fta_rate", "oreb_pct"] },
  {
    re: /プレー.?タイプ|プレイ.?タイプ|アイソ|ピック.?(?:アンド|&|＆|ン).?ロール|スポットアップ|トランジション|ポストアップ|play.?types?/i,
    tab: "playtype",
    ja: "プレータイプ",
    en: "Play types",
    ids: ["iso_ppp", "pnr_bh_ppp", "spotup_ppp", "trans_ppp", "post_ppp", "cut_ppp"],
  },
  { re: /レーティング|効率|\bratings?\b|advanced/i, tab: "ratings", ja: "レーティング", en: "Ratings", ids: ["per", "ts_pct", "usg", "ortg", "drtg"] },
];

/** チーム詳細の HOW THEY PLAY（RATINGS / DEFENSE のタブは無い）。行は画面と同じ計算で取る */
export type NbaAskTeamHowFocus = Omit<NbaAskHowFocus, "ids"> & {
  /** TRACKING のグループの行（チーム詳細と同じ並び） */
  ids?: readonly string[];
};

const TEAM_FOCUS: ReadonlyArray<NbaAskTeamHowFocus & { re: RegExp }> = [
  { re: /ドライブ|\bdrives?\b/i, tab: "tracking", group: "drive", ja: "ドライブ", en: "Drives", ids: ["drives", "driveFgPct"] },
  { re: /キャッチ|プルアップ|catch.?(?:and|&).?shoot|pull.?ups?/i, tab: "tracking", group: "shot", ja: "シュートの打ち方", en: "Shot types", ids: ["cnsFgPct", "pullupFgPct"] },
  { re: /パス(?!ポート)|\bpass(?:es|ing)?\b/i, tab: "tracking", group: "pass", ja: "パス", en: "Passing", ids: ["passes", "potentialAst", "astPtsCreated", "screenAstPts"] },
  { re: /タッチ|走行距離|走る距離|スピード|ボール保持|\btouch(?:es)?\b|\bspeed\b/i, tab: "tracking", group: "ball", ja: "ボール保持・運動量", en: "Ball & movement", ids: ["touches", "secPerTouch", "paintTouches", "distMiles", "speed"] },
  { re: /ハッスル|ディフレクション|ルーズボール|チャージ|\bhustle\b/i, tab: "hustle", ja: "ハッスル", en: "Hustle" },
  { re: /リバウンド|\brebound/i, tab: "rebounding", ja: "リバウンド", en: "Rebounding" },
  { re: /クラッチ|\bclutch/i, tab: "clutch", ja: "クラッチ", en: "Clutch" },
  { re: /フォー.?ファクター|4.?ファクター|four.?factors?/i, tab: "fourFactors", ja: "フォーファクター", en: "Four factors" },
  { re: /プレー.?タイプ|プレイ.?タイプ|アイソ|ピック.?(?:アンド|&|＆|ン).?ロール|スポットアップ|トランジション|play.?types?/i, tab: "playtype", ja: "プレータイプ", en: "Play types" },
  { re: /得点の内訳|得点源|得点パターン|どこで点|scoring/i, tab: "scoring", ja: "得点の内訳", en: "Scoring" },
];

/** ジャンルをまとめて聞いている言い方 */
const BROAD = /関する|関連|内訳|教えて|まわり|周り|系|について|スタッツ|データ|数字|指標|詳しく|全般|一覧|全部|どう|\bstats\b|\babout\b/i;
/** ジャンルの名前だけで聞いている（「ヨキッチのプレータイプ」「ハーデンのハッスル」） */
const GENRE = /プレー.?タイプ|プレイ.?タイプ|play.?types?|ハッスル|\bhustle\b|シュートの(?:スタッツ|データ|打ち方|種類)/i;
/** 1 項目を聞いている言い方（「数字」は除く） */
const SINGLE = /数(?!字)|何回|何本|何位|何%|何パーセント|\bhow many\b|\brank/i;

/** 「何回」「何位」など 1 項目を聞いている */
export function nbaAskIsSingleQuestion(question: string): boolean {
  return SINGLE.test(question);
}

/** まとめて聞いているか（1 項目だけなら数字だけで答える） */
export function nbaAskIsBroadQuestion(question: string): boolean {
  return BROAD.test(question) && !SINGLE.test(question);
}

export function nbaAskHowTheyPlayFocus(question: string): NbaAskHowFocus | null {
  if (!nbaAskIsBroadQuestion(question) && !(GENRE.test(question) && !SINGLE.test(question))) return null;
  const hit = FOCUS.find((f) => f.re.test(question));
  if (!hit) return null;
  const { re: _re, ...focus } = hit;
  return focus;
}

/** 1 項目の質問（「ドライブの数は」）で、その項目が載っている HOW THEY PLAY のタブ */
export function nbaAskHowTheyPlayFocusForStat(question: string, statId: string): NbaAskHowFocus | null {
  const hit = FOCUS.find((f) => f.re.test(question) && f.ids.includes(statId));
  if (!hit) return null;
  const { re: _re, ...focus } = hit;
  return focus;
}

export function nbaAskTeamHowTheyPlayFocus(question: string): NbaAskTeamHowFocus | null {
  if (!nbaAskIsBroadQuestion(question)) return null;
  const hit = TEAM_FOCUS.find((f) => f.re.test(question));
  if (!hit) return null;
  const { re: _re, ...focus } = hit;
  return focus;
}
