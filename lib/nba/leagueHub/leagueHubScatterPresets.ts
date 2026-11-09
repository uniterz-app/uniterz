/**
 * LEAGUE タブの散布図（軸の組み合わせ）。
 * invert = 低いほど良い指標。図では良い側を右 / 上に寄せる。
 */
import type { LeagueHubPlayerMetric } from "@/lib/nba/leagueHub/leagueHubTypes";

type Copy = { ja: string; en: string };

export type LeagueHubAxisFormat = "pct" | "one" | "ppp";

export type LeagueHubAxis<M extends string> = {
  metric: M;
  label: Copy;
  format: LeagueHubAxisFormat;
  invert?: boolean;
};

export type LeagueHubQuadrants = {
  /** 右上（両方良い） */
  tr: Copy;
  tl: Copy;
  br: Copy;
  bl: Copy;
};

export type LeagueHubScatterPreset<M extends string> = {
  id: string;
  label: Copy;
  hint: Copy;
  x: LeagueHubAxis<M>;
  y: LeagueHubAxis<M>;
  quadrants: LeagueHubQuadrants;
  /** 図の隅の大きな透かし。tl = 上へ行くほど良いもの（または図の名前）、br = 右へ行くほど良いもの */
  marks?: { tl?: string; br?: string };
};

export type LeagueHubPlayerScatterPreset = LeagueHubScatterPreset<LeagueHubPlayerMetric> & {
  /** TOP N をこの指標の上位で選ぶ */
  volume: LeagueHubPlayerMetric;
  volumeLabel: Copy;
};

/** スタイルマップのグループ（先頭が既定）。IMPACT = 攻守まとめた出場時の影響と勝負どころ */
export const LEAGUE_HUB_PLAYER_SCATTER_GROUPS = [
  { id: "scoring", label: "SCORING", presetIds: ["three", "ace", "shotType", "source"] },
  { id: "attack", label: "ATTACK", presetIds: ["paint", "drive", "foul", "playmaking"] },
  { id: "defense", label: "DEFENSE", presetIds: ["defense", "hustle", "fouls"] },
  { id: "impact", label: "IMPACT", presetIds: ["onCourt", "clutch", "consistency"] },
  { id: "rebound", label: "REB", presetIds: ["glass", "rebContest", "boxOut", "rebChance"] },
] as const;

export type LeagueHubPlayerScatterGroupId = (typeof LEAGUE_HUB_PLAYER_SCATTER_GROUPS)[number]["id"];

export const LEAGUE_HUB_PLAYER_SCATTER_PRESETS: readonly LeagueHubPlayerScatterPreset[] = [
  {
    id: "three",
    label: { ja: "3P の量と質", en: "3PT" },
    hint: {
      ja: "右ほど 3P を多く打ち、上ほどよく入る。",
      en: "Right = more 3PA, up = better 3P%.",
    },
    x: { metric: "fg3a", label: { ja: "3PA / 試合", en: "3PA / G" }, format: "one" },
    y: { metric: "fg3_pct", label: { ja: "3P%", en: "3P%" }, format: "pct" },
    volume: "fg3a",
    volumeLabel: { ja: "3P 試投", en: "3PA" },
    quadrants: {
      tr: { ja: "エリートシューター", en: "ELITE SHOOTER" },
      tl: { ja: "セレクティブシューター", en: "SELECTIVE SHOOTER" },
      br: { ja: "ボリュームシューター", en: "VOLUME SHOOTER" },
      bl: { ja: "不調", en: "COLD" },
    },
  },
  {
    id: "ace",
    label: { ja: "得点の負担", en: "USAGE" },
    hint: {
      ja: "右ほど攻撃を任され（USG%）、上ほど効率よく取る（TS%）。",
      en: "Right = higher usage, up = more efficient scoring (TS%).",
    },
    x: { metric: "usg", label: { ja: "USG%", en: "USG%" }, format: "pct" },
    y: { metric: "ts_pct", label: { ja: "TS%", en: "TS%" }, format: "pct" },
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "ファーストオプション", en: "FIRST OPTION" },
      tl: { ja: "効率型スコアラー", en: "EFFICIENT SCORER" },
      br: { ja: "ボリュームスコアラー", en: "VOLUME SCORER" },
      bl: { ja: "セカンドオプション", en: "SECOND OPTION" },
    },
  },
  {
    id: "paint",
    label: { ja: "ゴール下", en: "PAINT" },
    hint: {
      ja: "右ほどペイントで点を取り、上ほどリング下でよく決める。",
      en: "Right = more paint points, up = better finishing at the rim.",
    },
    x: { metric: "pts_paint", label: { ja: "ペイント得点", en: "PAINT PTS" }, format: "one" },
    y: { metric: "restricted_fg_pct", label: { ja: "リング下 FG%", en: "RIM FG%" }, format: "pct" },
    volume: "pts_paint",
    volumeLabel: { ja: "ペイント得点", en: "PAINT PTS" },
    quadrants: {
      tr: { ja: "ペイントビースト", en: "PAINT BEAST" },
      tl: { ja: "フィニッシャー", en: "FINISHER" },
      br: { ja: "インサイドスコアラー", en: "INSIDE SCORER" },
      bl: { ja: "ペイント控えめ", en: "LIGHT PAINT" },
    },
  },
  {
    id: "playmaking",
    label: { ja: "ゲームメイク", en: "PLAYMAKING" },
    hint: {
      ja: "右ほどアシストが多く（AST%）、上ほどミスが少ない（TOV%）。",
      en: "Right = higher AST%, up = lower TOV%.",
    },
    x: { metric: "ast_pct", label: { ja: "AST%", en: "AST%" }, format: "pct" },
    y: {
      metric: "tov_pct",
      label: { ja: "TOV%（上ほど少ない）", en: "TOV% (lower = up)" },
      format: "pct",
      invert: true,
    },
    volume: "ast",
    volumeLabel: { ja: "アシスト", en: "AST" },
    quadrants: {
      tr: { ja: "フロアジェネラル", en: "FLOOR GENERAL" },
      tl: { ja: "コネクター", en: "CONNECTOR" },
      br: { ja: "アグレッシブパサー", en: "AGGRESSIVE PASSER" },
      bl: { ja: "スコアラー型", en: "SCORER" },
    },
  },
  {
    id: "drive",
    label: { ja: "ドライブ", en: "DRIVES" },
    hint: {
      ja: "右ほどドライブが多く、上ほど 1 回あたりの得点が高い。",
      en: "Right = more drives, up = more points per drive.",
    },
    x: { metric: "drives", label: { ja: "ドライブ / 試合", en: "DRIVES / G" }, format: "one" },
    y: { metric: "drive_ppd", label: { ja: "1 回の得点", en: "PTS / DRIVE" }, format: "ppp" },
    volume: "drives",
    volumeLabel: { ja: "ドライブ", en: "DRIVES" },
    quadrants: {
      tr: { ja: "スラッシャー", en: "SLASHER" },
      tl: { ja: "セレクティブドライバー", en: "SELECTIVE DRIVER" },
      br: { ja: "ボリュームドライバー", en: "VOLUME DRIVER" },
      bl: { ja: "ドライブ控えめ", en: "LIGHT DRIVER" },
    },
  },
  {
    id: "shotType",
    label: { ja: "シュートの型", en: "SHOT TYPE" },
    hint: {
      ja: "右ほどキャッチ＆シュート、上ほどプルアップが入る。",
      en: "Right = better catch-and-shoot FG%, up = better pull-up FG%.",
    },
    x: { metric: "cns_fg_pct", label: { ja: "C&S FG%", en: "C&S FG%" }, format: "pct" },
    y: { metric: "pullup_fg_pct", label: { ja: "プルアップ FG%", en: "PULL-UP FG%" }, format: "pct" },
    volume: "fga",
    volumeLabel: { ja: "FG 試投", en: "FGA" },
    quadrants: {
      tr: { ja: "オールラウンドシューター", en: "ALL-AROUND SHOOTER" },
      tl: { ja: "ショットクリエイター", en: "SHOT CREATOR" },
      br: { ja: "キャッチ＆シューター", en: "CATCH & SHOOT" },
      bl: { ja: "インサイド型", en: "INSIDE" },
    },
  },
  {
    id: "foul",
    label: { ja: "ファウル獲得", en: "FT DRAW" },
    hint: {
      ja: "右ほどフリースローを多くもらい、上ほどよく決める。",
      en: "Right = more free throws per shot (FTA / FGA), up = better FT%.",
    },
    x: { metric: "fta_rate", label: { ja: "FT 獲得率", en: "FT RATE" }, format: "pct" },
    y: { metric: "ft_pct", label: { ja: "FT%", en: "FT%" }, format: "pct" },
    volume: "fta",
    volumeLabel: { ja: "FT 試投", en: "FTA" },
    quadrants: {
      tr: { ja: "ファウルドローワー", en: "FOUL DRAWER" },
      tl: { ja: "ピュアシューター", en: "PURE SHOOTER" },
      br: { ja: "アタッカー", en: "ATTACKER" },
      bl: { ja: "FT に課題", en: "FT WOES" },
    },
  },
  {
    id: "source",
    label: { ja: "得点の出どころ", en: "PTS MIX" },
    hint: {
      ja: "得点のうち右ほど 3P、上ほどペイントの割合が高い。",
      en: "Share of points: right = from 3s, up = from the paint.",
    },
    x: { metric: "pct_pts_3", label: { ja: "3P の割合", en: "% PTS 3P" }, format: "pct" },
    y: { metric: "pct_pts_paint", label: { ja: "ペイントの割合", en: "% PTS PAINT" }, format: "pct" },
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "モダン型", en: "MODERN" },
      tl: { ja: "インサイド型", en: "INSIDE" },
      br: { ja: "アウトサイド型", en: "OUTSIDE" },
      bl: { ja: "ミッドレンジ型", en: "MIDRANGE" },
    },
  },
  {
    id: "defense",
    label: { ja: "守備", en: "STL+BLK" },
    hint: {
      ja: "右ほど STL＋BLK が多く、上ほどマーク相手の FG% が低い。",
      en: "Right = more STL + BLK, up = lower opponent FG%.",
    },
    x: { metric: "stocks", label: { ja: "STL+BLK", en: "STL+BLK" }, format: "one" },
    y: {
      metric: "matchup_fg_pct",
      label: { ja: "相手 FG%（上ほど低い）", en: "OPP FG% (lower = up)" },
      format: "pct",
      invert: true,
    },
    volume: "def_activity",
    volumeLabel: { ja: "守備の手数", en: "DEFENSIVE ACTIVITY" },
    quadrants: {
      tr: { ja: "ディフェンスアンカー", en: "ANCHOR" },
      tl: { ja: "ロックダウン", en: "LOCKDOWN" },
      br: { ja: "ギャンブラー", en: "GAMBLER" },
      bl: { ja: "ハッスル型", en: "HUSTLER" },
    },
  },
  {
    id: "hustle",
    label: { ja: "ハッスル", en: "HUSTLE" },
    hint: {
      ja: "右ほどパスに手を出し、上ほどシュートにチェックへ行く。",
      en: "Right = more deflections, up = more contested shots.",
    },
    x: { metric: "deflections", label: { ja: "ディフレクション", en: "DEFLECTIONS" }, format: "one" },
    y: { metric: "contested_shots", label: { ja: "コンテスト", en: "CONTESTS" }, format: "one" },
    volume: "def_activity",
    volumeLabel: { ja: "守備の手数", en: "DEFENSIVE ACTIVITY" },
    quadrants: {
      tr: { ja: "エナジープレーヤー", en: "ENERGY" },
      tl: { ja: "コンテスター", en: "CONTESTER" },
      br: { ja: "ボールハンター", en: "BALL HAWK" },
      bl: { ja: "ポジショニング型", en: "POSITIONAL" },
    },
  },
  {
    id: "glass",
    label: { ja: "リバウンドの量と割合", en: "GLASS" },
    hint: {
      ja: "右ほど 1 試合の本数が多く、上ほど出ている間に拾える分をよく取る（REB%）。",
      en: "Right = more rebounds per game, up = higher share of available rebounds (REB%).",
    },
    x: { metric: "reb", label: { ja: "REB / 試合", en: "REB / G" }, format: "one" },
    y: { metric: "reb_pct", label: { ja: "REB%", en: "REB%" }, format: "pct" },
    volume: "reb",
    volumeLabel: { ja: "リバウンド", en: "REB" },
    quadrants: {
      tr: { ja: "支配的リバウンダー", en: "GLASS CLEANER" },
      tl: { ja: "短い時間でよく拾う", en: "EFFICIENT BOARDER" },
      br: { ja: "長く出て数を稼ぐ", en: "VOLUME BOARDER" },
      bl: { ja: "リバウンド控えめ", en: "LIGHT GLASS" },
    },
  },
  {
    id: "rebContest",
    label: { ja: "競り合い", en: "CONTESTED" },
    hint: {
      ja: "右ほどリバウンドが多く、上ほど相手と競り合って取った割合が高い。",
      en: "Right = more rebounds, up = more of them contested.",
    },
    x: { metric: "reb", label: { ja: "REB / 試合", en: "REB / G" }, format: "one" },
    y: {
      metric: "reb_contest_pct",
      label: { ja: "競り合いの割合", en: "CONTESTED %" },
      format: "pct",
    },
    volume: "reb",
    volumeLabel: { ja: "リバウンド", en: "REB" },
    quadrants: {
      tr: { ja: "混戦の主", en: "TRAFFIC KING" },
      tl: { ja: "体を張る", en: "PHYSICAL" },
      br: { ja: "フリーで拾う", en: "CLEANUP" },
      bl: { ja: "リバウンド控えめ", en: "LIGHT GLASS" },
    },
  },
  {
    id: "boxOut",
    label: { ja: "ボックスアウト", en: "BOX OUT" },
    hint: {
      ja: "右ほど相手を締め出し、上ほど自分でリバウンドを取る。",
      en: "Right = more box outs, up = more rebounds of his own.",
    },
    x: { metric: "box_outs", label: { ja: "ボックスアウト", en: "BOX OUTS" }, format: "one" },
    y: { metric: "reb", label: { ja: "REB / 試合", en: "REB / G" }, format: "one" },
    volume: "reb",
    volumeLabel: { ja: "リバウンド", en: "REB" },
    quadrants: {
      tr: { ja: "締めて取る", en: "SEAL & GRAB" },
      tl: { ja: "ボールに飛び込む", en: "CHASER" },
      br: { ja: "味方に取らせる", en: "ENABLER" },
      bl: { ja: "リバウンド控えめ", en: "LIGHT GLASS" },
    },
  },
  {
    id: "rebChance",
    label: { ja: "チャンスを取り切る", en: "CHANCES" },
    hint: {
      ja: "右ほどボールの近くにいる回数が多く、上ほどそのチャンスを自分で取る。",
      en: "Right = more rebound chances, up = more of them converted.",
    },
    x: {
      metric: "reb_chances",
      label: { ja: "チャンス / 試合", en: "CHANCES / G" },
      format: "one",
    },
    y: {
      metric: "reb_chance_pct",
      label: { ja: "取った割合", en: "CHANCE %" },
      format: "pct",
    },
    volume: "reb",
    volumeLabel: { ja: "リバウンド", en: "REB" },
    quadrants: {
      tr: { ja: "支配的リバウンダー", en: "DOMINANT" },
      tl: { ja: "確実に取る", en: "SURE HANDS" },
      br: { ja: "位置取りで勝つ", en: "POSITIONER" },
      bl: { ja: "リバウンド控えめ", en: "LIGHT GLASS" },
    },
  },
  {
    id: "onCourt",
    label: { ja: "出場時の強さ", en: "ON-COURT RTG" },
    hint: {
      ja: "出場中のチームの攻撃（右）と守備（上）。チーム力も影響する。",
      en: "Team offense (right) and defense (up) while on the floor.",
    },
    x: { metric: "ortg", label: { ja: "出場時 ORtg", en: "ON ORtg" }, format: "one" },
    y: {
      metric: "drtg",
      label: { ja: "出場時 DRtg（上ほど少ない）", en: "ON DRtg (lower = up)" },
      format: "one",
      invert: true,
    },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "ツーウェイ", en: "TWO-WAY" },
      tl: { ja: "ディフェンス型", en: "DEFENSE FIRST" },
      br: { ja: "オフェンス型", en: "OFFENSE FIRST" },
      bl: { ja: "苦戦中", en: "STRUGGLING" },
    },
  },
  {
    id: "clutch",
    label: { ja: "勝負どころ", en: "CLUTCH" },
    hint: {
      ja: "残り 5 分・5 点差以内。右ほどボールを託され、上ほど決める。",
      en: "Last 5 min within 5. Right = gets the ball, up = makes shots.",
    },
    x: { metric: "clutch_usg", label: { ja: "クラッチ USG%", en: "CLUTCH USG%" }, format: "pct" },
    y: { metric: "clutch_fg_pct", label: { ja: "クラッチ FG%", en: "CLUTCH FG%" }, format: "pct" },
    volume: "clutch_pts",
    volumeLabel: { ja: "クラッチ得点", en: "CLUTCH PTS" },
    quadrants: {
      tr: { ja: "クローザー", en: "CLOSER" },
      tl: { ja: "X ファクター", en: "X-FACTOR" },
      br: { ja: "ボリュームスコアラー", en: "VOLUME SCORER" },
      bl: { ja: "サポート", en: "SUPPORT" },
    },
  },
  {
    id: "consistency",
    label: { ja: "得点の安定感", en: "CONSISTENCY" },
    hint: {
      ja: "右ほど平均得点が高く、上ほど毎試合の得点がぶれない。",
      en: "Right = more points, up = steadier game to game.",
    },
    x: { metric: "pts", label: { ja: "平均得点", en: "PTS" }, format: "one" },
    y: {
      metric: "pts_sd",
      label: { ja: "得点の振れ幅（上ほど小さい）", en: "PTS SWING (smaller = up)" },
      format: "one",
      invert: true,
    },
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "計算できるエース", en: "STEADY STAR" },
      tl: { ja: "堅実", en: "RELIABLE" },
      br: { ja: "当たり外れ型", en: "BOOM OR BUST" },
      bl: { ja: "波がある", en: "STREAKY" },
    },
  },
  {
    id: "fouls",
    label: { ja: "ファウル", en: "FOULS" },
    hint: {
      ja: "右ほど長く出て、上ほどファウルが少ない（36 分あたり）。",
      en: "Right = more minutes, up = fewer fouls per 36.",
    },
    x: { metric: "min", label: { ja: "出場時間", en: "MIN" }, format: "one" },
    y: {
      metric: "pf36",
      label: { ja: "36 分あたりファウル（上ほど少ない）", en: "PF / 36 (fewer = up)" },
      format: "one",
      invert: true,
    },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "クリーンな主力", en: "CLEAN STARTER" },
      tl: { ja: "クリーン", en: "CLEAN" },
      br: { ja: "ファウルトラブル型", en: "FOUL TROUBLE" },
      bl: { ja: "ファウル多め", en: "HACKER" },
    },
  },
];

/** チーム散布図で使う `NbaLeagueTeamStatsRow` のキー */
export type LeagueHubTeamMetric =
  | "ortg"
  | "drtg"
  | "pace"
  | "deflections"
  | "contestedShots"
  | "clutchOrtg"
  | "clutchDrtg"
  | "isoFreq"
  | "isoPpp"
  | "pnrBhFreq"
  | "pnrBhPpp"
  | "pnrRollFreq"
  | "pnrRollPpp"
  | "spotupFreq"
  | "spotupPpp"
  | "transFreq"
  | "transPpp"
  | "cutFreq"
  | "cutPpp"
  | "postFreq"
  | "postPpp"
  | "fg3a"
  | "fg3Pct"
  | "efgPct"
  | "tovPct"
  | "orebPct"
  | "ftaRate"
  | "oppEfgPct"
  | "oppTovPct"
  | "oppOrebPct"
  | "oppFtaRate";

export const LEAGUE_HUB_TEAM_STRENGTH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "strength",
  label: { ja: "強さの地図", en: "OFFENSE × DEFENSE" },
  hint: {
    ja: "右ほど攻撃効率が高く、上ほど失点が少ない。四角が大きいほど試合のペースが速い。",
    en: "Right = better offense, up = better defense. Bigger square = faster pace.",
  },
  x: { metric: "ortg", label: { ja: "ORtg", en: "ORtg" }, format: "one" },
  y: {
    metric: "drtg",
    label: { ja: "DRtg（上ほど少ない）", en: "DRtg (lower = up)" },
    format: "one",
    invert: true,
  },
  marks: { tl: "DEF", br: "OFF" },
  quadrants: {
    tr: { ja: "攻守とも強い", en: "TWO-WAY" },
    tl: { ja: "守備で勝つ", en: "DEFENSE FIRST" },
    br: { ja: "攻撃で勝つ", en: "OFFENSE FIRST" },
    bl: { ja: "苦しい", en: "STRUGGLING" },
  },
};

export const LEAGUE_HUB_TEAM_THREE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "three",
  label: { ja: "3P の量と質", en: "3PT" },
  hint: {
    ja: "右ほど 3P をよく打ち、上ほど決める。",
    en: "Right = more 3PA, up = better 3P%.",
  },
  x: { metric: "fg3a", label: { ja: "3PA / 試合", en: "3PA / G" }, format: "one" },
  y: { metric: "fg3Pct", label: { ja: "3P%", en: "3P%" }, format: "pct" },
  marks: { tl: "3PT" },
  quadrants: {
    tr: { ja: "撃って決める", en: "BOMBERS" },
    tl: { ja: "少なく確実", en: "SELECTIVE" },
    br: { ja: "量で勝負", en: "VOLUME" },
    bl: { ja: "3P が武器でない", en: "INSIDE TEAM" },
  },
};

export const LEAGUE_HUB_TEAM_HUSTLE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "hustle",
  label: { ja: "守備の泥臭さ", en: "HUSTLE" },
  hint: {
    ja: "右ほどパスやドリブルに手を出し、上ほどシュートにチェックへ行く。",
    en: "Right = more deflections, up = more contested shots.",
  },
  x: { metric: "deflections", label: { ja: "ディフレクション", en: "DEFLECTIONS" }, format: "one" },
  y: { metric: "contestedShots", label: { ja: "コンテスト", en: "CONTESTS" }, format: "one" },
  marks: { tl: "HUSTLE" },
  quadrants: {
    tr: { ja: "エナジー", en: "ENERGY" },
    tl: { ja: "コンテスト型", en: "CONTEST" },
    br: { ja: "ボールハンター", en: "BALL HAWK" },
    bl: { ja: "ポジショニング型", en: "POSITIONAL" },
  },
};

export const LEAGUE_HUB_TEAM_CLUTCH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "clutch",
  label: { ja: "勝負どころ", en: "CLUTCH" },
  hint: {
    ja: "残り 5 分・5 点差以内の攻撃効率と守備効率。右上が接戦に強いチーム。",
    en: "Offense and defense in the last 5 min within 5. Top right win close games.",
  },
  x: { metric: "clutchOrtg", label: { ja: "クラッチ ORtg", en: "CLUTCH ORtg" }, format: "one" },
  y: {
    metric: "clutchDrtg",
    label: { ja: "クラッチ DRtg（上ほど少ない）", en: "CLUTCH DRtg (lower = up)" },
    format: "one",
    invert: true,
  },
  marks: { tl: "CLUTCH" },
  quadrants: {
    tr: { ja: "接戦に強い", en: "CLOSERS" },
    tl: { ja: "守って逃げ切る", en: "LOCK IT UP" },
    br: { ja: "撃ち合いで勝つ", en: "SHOOTOUT" },
    bl: { ja: "接戦で苦戦中", en: "STRUGGLING LATE" },
  },
};

export type LeagueHubPlayTypeId = "iso" | "pnrBh" | "pnrRoll" | "spotup" | "trans" | "cut" | "post";

export const LEAGUE_HUB_PLAY_TYPES: readonly {
  id: LeagueHubPlayTypeId;
  short: string;
  label: Copy;
}[] = [
  { id: "iso", short: "ISO", label: { ja: "アイソレーション", en: "Isolation" } },
  { id: "pnrBh", short: "P&R BH", label: { ja: "P&R ボール保持者", en: "P&R ball handler" } },
  { id: "pnrRoll", short: "P&R ROLL", label: { ja: "P&R ロールマン", en: "P&R roll man" } },
  { id: "spotup", short: "SPOT UP", label: { ja: "スポットアップ", en: "Spot up" } },
  { id: "trans", short: "TRANS", label: { ja: "トランジション", en: "Transition" } },
  { id: "cut", short: "CUT", label: { ja: "カット", en: "Cut" } },
  { id: "post", short: "POST", label: { ja: "ポストアップ", en: "Post up" } },
];

export function leagueHubPlayTypePreset(
  id: LeagueHubPlayTypeId
): LeagueHubScatterPreset<LeagueHubTeamMetric> {
  const pt = LEAGUE_HUB_PLAY_TYPES.find((p) => p.id === id) ?? LEAGUE_HUB_PLAY_TYPES[0]!;
  return {
    id: `pt-${id}`,
    label: { ja: "得意なプレー", en: "PLAY TYPES" },
    hint: {
      ja: `${pt.label.ja}。右ほどよく使い、上ほど 1 回あたりの得点が高い。`,
      en: `${pt.label.en}. Right = used more often, up = more points per possession.`,
    },
    x: {
      metric: `${id}Freq` as LeagueHubTeamMetric,
      label: { ja: "頻度", en: "FREQ" },
      format: "pct",
    },
    y: {
      metric: `${id}Ppp` as LeagueHubTeamMetric,
      label: { ja: "PPP", en: "PPP" },
      format: "ppp",
    },
    marks: { tl: pt.short },
    quadrants: {
      tr: { ja: "武器", en: "WEAPON" },
      tl: { ja: "隠れた得意", en: "UNDERUSED" },
      br: { ja: "よく使う", en: "HEAVY USE" },
      bl: { ja: "使わない", en: "RARE" },
    },
  };
}
