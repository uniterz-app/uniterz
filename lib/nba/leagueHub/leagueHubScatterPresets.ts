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
};

export type LeagueHubPlayerScatterPreset = LeagueHubScatterPreset<LeagueHubPlayerMetric> & {
  /** TOP N をこの指標の上位で選ぶ */
  volume: LeagueHubPlayerMetric;
  volumeLabel: Copy;
};

export const LEAGUE_HUB_PLAYER_SCATTER_PRESETS: readonly LeagueHubPlayerScatterPreset[] = [
  {
    id: "three",
    label: { ja: "3P の量と質", en: "3PT" },
    hint: {
      ja: "右ほど 3P をたくさん打ち、上ほどよく入る。右上がボリュームシューター。",
      en: "Right = more 3PA, up = better 3P%. Top right are volume shooters.",
    },
    x: { metric: "fg3a", label: { ja: "3PA / 試合", en: "3PA / G" }, format: "one" },
    y: { metric: "fg3_pct", label: { ja: "3P%", en: "3P%" }, format: "pct" },
    volume: "fg3a",
    volumeLabel: { ja: "3P 試投", en: "3PA" },
    quadrants: {
      tr: { ja: "ボリュームシューター", en: "VOLUME SHOOTER" },
      tl: { ja: "スポットシューター", en: "SPOT SHOOTER" },
      br: { ja: "ハイボリューム", en: "HIGH VOLUME" },
      bl: { ja: "ノンシューター", en: "NON-SHOOTER" },
    },
  },
  {
    id: "ace",
    label: { ja: "得点の負担", en: "USAGE" },
    hint: {
      ja: "右ほど攻撃をボールで終える割合（USG%）が高く、上ほど効率よく点を取る（TS%）。",
      en: "Right = higher usage, up = more efficient scoring (TS%).",
    },
    x: { metric: "usg", label: { ja: "USG%", en: "USG%" }, format: "pct" },
    y: { metric: "ts_pct", label: { ja: "TS%", en: "TS%" }, format: "pct" },
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "ファーストオプション", en: "FIRST OPTION" },
      tl: { ja: "高効率ロールプレーヤー", en: "EFFICIENT ROLE" },
      br: { ja: "ボリュームスコアラー", en: "VOLUME SCORER" },
      bl: { ja: "ロールプレーヤー", en: "ROLE PLAYER" },
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
      bl: { ja: "ペリメーター", en: "PERIMETER" },
    },
  },
  {
    id: "playmaking",
    label: { ja: "ゲームメイク", en: "PLAYMAKING" },
    hint: {
      ja: "右ほど味方のシュートをアシストし（AST%）、上ほどターンオーバーが少ない（TOV%）。",
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
      ja: "右ほどドライブで仕掛け、上ほどドライブ 1 回あたりの得点が高い。",
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
      bl: { ja: "ノンドライバー", en: "NON-DRIVER" },
    },
  },
  {
    id: "shotType",
    label: { ja: "シュートの型", en: "SHOT TYPE" },
    hint: {
      ja: "右ほどキャッチ＆シュート（パスを受けてすぐ打つ）が入り、上ほどプルアップ（ドリブルから打つ）が入る。",
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
    label: { ja: "ファウル獲得", en: "FREE THROWS" },
    hint: {
      ja: "右ほどファウルをもらってフリースローを得て（FTA ÷ FGA）、上ほどフリースローが入る。",
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
      bl: { ja: "ジャンプショット型", en: "JUMP SHOOTER" },
    },
  },
  {
    id: "source",
    label: { ja: "得点の出どころ", en: "SCORING MIX" },
    hint: {
      ja: "得点のうち右ほど 3P、上ほどペイントの割合が高い。四隅は得点の取り方のタイプ。",
      en: "Share of points: right = from 3s, up = from the paint. Corners are scoring types.",
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
    label: { ja: "守備", en: "DEFENSE" },
    hint: {
      ja: "右ほどスティール＋ブロックが多く、上ほどマークした相手の FG% が低い。",
      en: "Right = more steals + blocks, up = lower FG% for the players he guards.",
    },
    x: { metric: "stocks", label: { ja: "STL+BLK", en: "STL+BLK" }, format: "one" },
    y: {
      metric: "matchup_fg_pct",
      label: { ja: "相手 FG%（上ほど低い）", en: "OPP FG% (lower = up)" },
      format: "pct",
      invert: true,
    },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "ディフェンスアンカー", en: "ANCHOR" },
      tl: { ja: "ロックダウン", en: "LOCKDOWN" },
      br: { ja: "ボールハンター", en: "BALL HAWK" },
      bl: { ja: "オフェンス型", en: "OFFENSE FIRST" },
    },
  },
  {
    id: "hustle",
    label: { ja: "ハッスル", en: "HUSTLE" },
    hint: {
      ja: "右ほどパスやドリブルに手を出し（ディフレクション）、上ほどシュートにチェックへ行く（コンテスト）。",
      en: "Right = more deflections, up = more contested shots.",
    },
    x: { metric: "deflections", label: { ja: "ディフレクション", en: "DEFLECTIONS" }, format: "one" },
    y: { metric: "contested_shots", label: { ja: "コンテスト", en: "CONTESTS" }, format: "one" },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "エナジープレーヤー", en: "ENERGY" },
      tl: { ja: "コンテスター", en: "CONTESTER" },
      br: { ja: "ボールハンター", en: "BALL HAWK" },
      bl: { ja: "ポジショニング型", en: "POSITIONAL" },
    },
  },
  {
    id: "onCourt",
    label: { ja: "出場時の強さ", en: "ON COURT" },
    hint: {
      ja: "その選手がコートにいる間のチームの攻撃効率（右）と守備効率（上ほど失点が少ない）。チームの強さにも左右される。",
      en: "Team offense (right) and defense (up = fewer allowed) while he's on the floor. Depends on the team too.",
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
      bl: { ja: "苦しい時間帯", en: "TOUGH MINUTES" },
    },
  },
  {
    id: "clutch",
    label: { ja: "勝負どころ", en: "CLUTCH" },
    hint: {
      ja: "残り 5 分・5 点差以内。右ほどボールを託され（クラッチ USG%）、上ほど決める（クラッチ FG%）。",
      en: "Last 5 min, within 5. Right = trusted with the ball, up = makes the shots.",
    },
    x: { metric: "clutch_usg", label: { ja: "クラッチ USG%", en: "CLUTCH USG%" }, format: "pct" },
    y: { metric: "clutch_fg_pct", label: { ja: "クラッチ FG%", en: "CLUTCH FG%" }, format: "pct" },
    volume: "clutch_pts",
    volumeLabel: { ja: "クラッチ得点", en: "CLUTCH PTS" },
    quadrants: {
      tr: { ja: "クローザー", en: "CLOSER" },
      tl: { ja: "X ファクター", en: "X-FACTOR" },
      br: { ja: "ハイユーセージ", en: "HIGH USAGE" },
      bl: { ja: "サポート", en: "SUPPORT" },
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
  | "postPpp";

export const LEAGUE_HUB_TEAM_STRENGTH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "strength",
  label: { ja: "強さの地図", en: "OFFENSE × DEFENSE" },
  hint: {
    ja: "右ほど攻撃効率が高く、上ほど失点が少ない。ユニフォームが大きいほど試合のペースが速い。",
    en: "Right = better offense, up = better defense. Bigger jersey = faster pace.",
  },
  x: { metric: "ortg", label: { ja: "ORtg", en: "ORtg" }, format: "one" },
  y: {
    metric: "drtg",
    label: { ja: "DRtg（上ほど少ない）", en: "DRtg (lower = up)" },
    format: "one",
    invert: true,
  },
  quadrants: {
    tr: { ja: "攻守とも強い", en: "TWO-WAY" },
    tl: { ja: "守備で勝つ", en: "DEFENSE FIRST" },
    br: { ja: "攻撃で勝つ", en: "OFFENSE FIRST" },
    bl: { ja: "苦しい", en: "STRUGGLING" },
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
    quadrants: {
      tr: { ja: "武器", en: "WEAPON" },
      tl: { ja: "隠れた得意", en: "UNDERUSED" },
      br: { ja: "よく使う", en: "HEAVY USE" },
      bl: { ja: "使わない", en: "RARE" },
    },
  };
}
