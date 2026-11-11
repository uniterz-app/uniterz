/**
 * LEAGUE タブの散布図（軸の組み合わせ）。
 * invert = 低いほど良い指標。図では良い側を右 / 上に寄せる。
 */
import type {
  LeagueHubPlayerMetric,
  LeagueHubTeamStyleMetric,
} from "@/lib/nba/leagueHub/leagueHubTypes";

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
  { id: "attack", label: "ATTACK", presetIds: ["paint", "drive", "driveFinish", "driveDish", "foul", "playmaking", "passCreate", "creation"] },
  { id: "defense", label: "DEFENSE", presetIds: ["defense", "hustle", "contestSplit", "shotAllow", "aceStop", "fouls"] },
  { id: "ball", label: "BALL", presetIds: ["touch", "mileage"] },
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
    id: "driveFinish",
    label: { ja: "ドライブの決定力", en: "DRIVE FG%" },
    hint: {
      ja: "右ほどドライブが多く、上ほどドライブのシュートが入る。",
      en: "Right = more drives, up = better FG% on drives.",
    },
    x: { metric: "drives", label: { ja: "ドライブ / 試合", en: "DRIVES / G" }, format: "one" },
    y: { metric: "drive_fg_pct", label: { ja: "ドライブ FG%", en: "DRIVE FG%" }, format: "pct" },
    volume: "drives",
    volumeLabel: { ja: "ドライブ", en: "DRIVES" },
    quadrants: {
      tr: { ja: "決めるスラッシャー", en: "FINISHING SLASHER" },
      tl: { ja: "選んで決める", en: "SELECTIVE FINISHER" },
      br: { ja: "量で切る", en: "VOLUME DRIVER" },
      bl: { ja: "ドライブが武器でない", en: "NOT A DRIVER" },
    },
  },
  {
    id: "passCreate",
    label: { ja: "パスの価値", en: "PASS VALUE" },
    hint: {
      ja: "右ほどパスがシュート試投につながり、上ほどアシストで生んだ得点が多い。",
      en: "Right = more potential assists, up = more points created by assists.",
    },
    x: { metric: "potential_ast", label: { ja: "ポテンシャル AST", en: "POTENTIAL AST" }, format: "one" },
    y: { metric: "ast_pts_created", label: { ja: "アシストで生んだ得点", en: "AST PTS CREATED" }, format: "one" },
    volume: "potential_ast",
    volumeLabel: { ja: "ポテンシャル AST", en: "POTENTIAL AST" },
    quadrants: {
      tr: { ja: "得点を作るパサー", en: "CREATOR" },
      tl: { ja: "1本の価値が高い", en: "HIGH VALUE" },
      br: { ja: "たくさん打たせる", en: "CHANCE MAKER" },
      bl: { ja: "パスが主武器でない", en: "NOT A CREATOR" },
    },
  },
  {
    id: "driveDish",
    label: { ja: "ドライブのさばき", en: "DRIVE PASS" },
    hint: {
      ja: "右ほどドライブからパスを出し、上ほどドライブでボールを失う。",
      en: "Right = more passes out of drives, up = more turnovers on drives.",
    },
    x: { metric: "drive_passes", label: { ja: "ドライブパス", en: "DRIVE PASSES" }, format: "one" },
    y: { metric: "drive_tov", label: { ja: "ドライブ TOV", en: "DRIVE TOV" }, format: "one" },
    volume: "drives",
    volumeLabel: { ja: "ドライブ", en: "DRIVES" },
    quadrants: {
      tr: { ja: "出して失う", en: "LOOSE CREATOR" },
      tl: { ja: "ドライブで失う", en: "LOOSE DRIVER" },
      br: { ja: "ドライブでさばく", en: "DISH DRIVER" },
      bl: { ja: "ドライブが少ない", en: "NOT A DRIVER" },
    },
  },
  {
    id: "creation",
    label: { ja: "もらいシュート", en: "ASSISTED SHOTS" },
    hint: {
      ja: "右ほど 2P をアシストでもらい、上ほど 3P をアシストでもらう。",
      en: "Right = more assisted twos, up = more assisted threes.",
    },
    x: { metric: "pct_assisted_2pt", label: { ja: "2P のアシスト割合", en: "ASSISTED 2P" }, format: "pct" },
    y: { metric: "pct_assisted_3pt", label: { ja: "3P のアシスト割合", en: "ASSISTED 3P" }, format: "pct" },
    volume: "fga",
    volumeLabel: { ja: "FG 試投", en: "FGA" },
    quadrants: {
      tr: { ja: "パスをもらって打つ", en: "OFF-BALL" },
      tl: { ja: "3P はもらう", en: "SPOT-UP" },
      br: { ja: "2P はもらう", en: "CUTTER" },
      bl: { ja: "自分で作る", en: "SELF CREATED" },
    },
  },
  {
    id: "touch",
    label: { ja: "ボールの持ち方", en: "TOUCH" },
    hint: {
      ja: "右ほどボールに触る回数が多く、上ほど 1 回のタッチが長い。",
      en: "Right = more touches, up = longer possession per touch.",
    },
    x: { metric: "touches", label: { ja: "タッチ", en: "TOUCHES" }, format: "one" },
    y: { metric: "sec_per_touch", label: { ja: "秒 / タッチ", en: "SEC / TOUCH" }, format: "one" },
    volume: "touches",
    volumeLabel: { ja: "タッチ", en: "TOUCHES" },
    quadrants: {
      tr: { ja: "長く多く持つ", en: "PRIMARY" },
      tl: { ja: "少なく長く持つ", en: "POST" },
      br: { ja: "短くつなぐ", en: "CONNECTOR" },
      bl: { ja: "ボールを持たない", en: "OFF BALL" },
    },
  },
  {
    id: "mileage",
    label: { ja: "走行", en: "MILEAGE" },
    hint: {
      ja: "右ほど走った距離が長く、上ほど平均速度が速い。",
      en: "Right = more miles, up = higher average speed.",
    },
    x: { metric: "dist_miles", label: { ja: "マイル", en: "MILES" }, format: "one" },
    y: { metric: "speed", label: { ja: "平均速度", en: "SPEED" }, format: "one" },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "よく走って速い", en: "ENGINE" },
      tl: { ja: "短い距離を速い", en: "SPRINTER" },
      br: { ja: "長く走る", en: "HIGH MILEAGE" },
      bl: { ja: "動かない", en: "STATIONARY" },
    },
  },
  {
    id: "shotAllow",
    label: { ja: "守る距離", en: "SHOT DISTANCE" },
    hint: {
      ja: "右ほど 10ft 以内を打たせ、上ほど 15ft より外を打たせる。どちらも低いほど守れている。軸は上が低い。",
      en: "Right = opponent FG% inside 10 ft, up = lower opponent FG% outside 15 ft.",
    },
    x: { metric: "opp_lt10_pct", label: { ja: "10ft 以内 FG%", en: "FG% < 10FT" }, format: "pct" },
    y: {
      metric: "opp_gt15_pct",
      label: { ja: "15ft より外（上ほど低い）", en: "FG% > 15FT (lower = up)" },
      format: "pct",
      invert: true,
    },
    volume: "min",
    volumeLabel: { ja: "出場時間", en: "MIN" },
    quadrants: {
      tr: { ja: "外は守る", en: "RIM LEAK" },
      tl: { ja: "距離を問わず守る", en: "WALL" },
      br: { ja: "どこも打たせる", en: "OPEN" },
      bl: { ja: "中は守る", en: "RIM PROTECTOR" },
    },
  },
  {
    id: "aceStop",
    label: { ja: "エースストッパー", en: "ACE STOPPER" },
    hint: {
      ja: "右ほど相手の得点源を長く守り、上ほどその選手の普段の eFG% よりシュートを落とす。",
      en: "Right = more minutes on the other team's top scorer, up = FG% below that scorer's usual eFG%.",
    },
    x: { metric: "ace_guard_min", label: { ja: "エースを守った時間", en: "MIN ON ACE" }, format: "one" },
    y: { metric: "ace_suppress", label: { ja: "抑えた FG%", en: "FG% SUPPRESSED" }, format: "pct" },
    volume: "ace_guard_min",
    volumeLabel: { ja: "エースを守った時間", en: "MIN ON ACE" },
    quadrants: {
      tr: { ja: "エースを抑える", en: "ACE STOPPER" },
      tl: { ja: "短時間で抑える", en: "SPOT STOPPER" },
      br: { ja: "付いているが抑えない", en: "ASSIGNED" },
      bl: { ja: "エースは守らない", en: "NOT THE STOPPER" },
    },
  },
  {
    id: "contestSplit",
    label: { ja: "コンテストの場所", en: "CONTEST" },
    hint: {
      ja: "右ほど 2P に手を出し、上ほど 3P に手を出す。",
      en: "Right = more contested 2s, up = more contested 3s.",
    },
    x: { metric: "contested_2pt", label: { ja: "2P コンテスト", en: "CONTESTED 2P" }, format: "one" },
    y: { metric: "contested_3pt", label: { ja: "3P コンテスト", en: "CONTESTED 3P" }, format: "one" },
    volume: "contested_shots",
    volumeLabel: { ja: "コンテスト", en: "CONTESTS" },
    quadrants: {
      tr: { ja: "どこでも手が出る", en: "EVERYWHERE" },
      tl: { ja: "外で飛ばす", en: "PERIMETER" },
      br: { ja: "中で手を出す", en: "INTERIOR" },
      bl: { ja: "コンテストが少ない", en: "HANDS DOWN" },
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

/** チーム散布図で使う `NbaLeagueTeamStatsRow` のキー + hub の `teams[].m` */
export type LeagueHubTeamMetric =
  | LeagueHubTeamStyleMetric
  | "winPct"
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
  | "oppFtaRate"
  | "pctPtsFb"
  | "passes"
  | "potentialAst"
  | "astPtsCreated"
  | "drives"
  | "driveFgPct"
  | "screenAst"
  | "screenAstPts"
  | "touches"
  | "secPerTouch"
  | "distMiles"
  | "oppLt10Pct"
  | "oppGt15Pct"
  | "contestedShots2"
  | "contestedShots3"
  | "fgPctAllowed"
  | "fg3PctAllowed"
  | "cnsPts"
  | "pullupPts";

export const LEAGUE_HUB_TEAM_STRENGTH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "strength",
  label: { ja: "強さの地図", en: "OFFENSE × DEFENSE" },
  hint: {
    ja: "右ほど攻撃効率が高く、上ほど失点が少ない。四角が大きいほど試合のペースが速い。",
    en: "Right = better offense, up = better defense. Bigger square = faster pace.",
  },
  x: {
    metric: "ortg",
    label: { ja: "ORtg（100 回の攻撃で取る点）", en: "ORtg (pts per 100 poss)" },
    format: "one",
  },
  y: {
    metric: "drtg",
    label: {
      ja: "DRtg（100 回の守備で取られる点・上ほど少ない）",
      en: "DRtg (pts allowed per 100 poss, lower = up)",
    },
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

export const LEAGUE_HUB_TEAM_DRIVE_FINISH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "driveFinish",
  label: { ja: "ドライブの決定力", en: "DRIVE FG%" },
  hint: {
    ja: "右ほどドライブが多く、上ほどドライブのシュートが入る。",
    en: "Right = more drives, up = better FG% on drives.",
  },
  x: { metric: "drives", label: { ja: "ドライブ", en: "DRIVES" }, format: "one" },
  y: { metric: "driveFgPct", label: { ja: "ドライブ FG%", en: "DRIVE FG%" }, format: "pct" },
  marks: { tl: "DRIVE" },
  quadrants: {
    tr: { ja: "切って決める", en: "FINISHING" },
    tl: { ja: "少なく決める", en: "SELECTIVE" },
    br: { ja: "量で切る", en: "VOLUME" },
    bl: { ja: "ドライブが武器でない", en: "NOT A DRIVE TEAM" },
  },
};

export const LEAGUE_HUB_TEAM_SCREEN: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "screen",
  label: { ja: "スクリーン", en: "SCREENS" },
  hint: {
    ja: "右ほどスクリーンアシストが多く、上ほどそれで生んだ得点が多い。",
    en: "Right = more screen assists, up = more points from those screens.",
  },
  x: { metric: "screenAst", label: { ja: "スクリーン AST", en: "SCREEN AST" }, format: "one" },
  y: { metric: "screenAstPts", label: { ja: "スクリーンの得点", en: "SCREEN PTS" }, format: "one" },
  marks: { tl: "SCREEN" },
  quadrants: {
    tr: { ja: "スクリーンで点を作る", en: "SCREEN GAME" },
    tl: { ja: "1本の価値が高い", en: "HIGH VALUE" },
    br: { ja: "回数は多い", en: "VOLUME SCREENS" },
    bl: { ja: "スクリーンが少ない", en: "LITTLE SCREENING" },
  },
};

export const LEAGUE_HUB_TEAM_SHOT_ALLOW: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "shotAllow",
  label: { ja: "打たせる距離", en: "SHOT DISTANCE" },
  hint: {
    ja: "右ほど 10ft 以内を打たせ、上ほど 15ft より外の成功率が低い。",
    en: "Right = opponent FG% inside 10 ft, up = lower opponent FG% outside 15 ft.",
  },
  x: { metric: "oppLt10Pct", label: { ja: "10ft 以内 FG%", en: "FG% < 10FT" }, format: "pct" },
  y: {
    metric: "oppGt15Pct",
    label: { ja: "15ft より外（上ほど低い）", en: "FG% > 15FT (lower = up)" },
    format: "pct",
    invert: true,
  },
  marks: { tl: "ALLOW" },
  quadrants: {
    tr: { ja: "外は守る", en: "RIM LEAK" },
    tl: { ja: "距離を問わず守る", en: "WALL" },
    br: { ja: "どこも打たせる", en: "OPEN" },
    bl: { ja: "中は守る", en: "RIM PROTECTION" },
  },
};

export const LEAGUE_HUB_TEAM_PASS_VALUE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "passValue",
  label: { ja: "パスの価値", en: "PASS VALUE" },
  hint: {
    ja: "右ほどパスがシュート試投につながり、上ほどアシストで生んだ得点が多い。",
    en: "Right = more potential assists, up = more points created by assists.",
  },
  x: { metric: "potentialAst", label: { ja: "ポテンシャル AST", en: "POTENTIAL AST" }, format: "one" },
  y: { metric: "astPtsCreated", label: { ja: "アシストで生んだ得点", en: "AST PTS CREATED" }, format: "one" },
  marks: { tl: "PASS" },
  quadrants: {
    tr: { ja: "得点を作る", en: "CREATORS" },
    tl: { ja: "1本の価値が高い", en: "HIGH VALUE" },
    br: { ja: "たくさん打たせる", en: "CHANCE MAKERS" },
    bl: { ja: "パスが主武器でない", en: "NOT A PASSING TEAM" },
  },
};

export const LEAGUE_HUB_TEAM_CONTEST: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "contestSplit",
  label: { ja: "コンテストの場所", en: "CONTEST" },
  hint: {
    ja: "右ほど 2P に手を出し、上ほど 3P に手を出す。",
    en: "Right = more contested 2s, up = more contested 3s.",
  },
  x: { metric: "contestedShots2", label: { ja: "2P コンテスト", en: "CONTESTED 2P" }, format: "one" },
  y: { metric: "contestedShots3", label: { ja: "3P コンテスト", en: "CONTESTED 3P" }, format: "one" },
  marks: { tl: "CONTEST" },
  quadrants: {
    tr: { ja: "どこでも手が出る", en: "EVERYWHERE" },
    tl: { ja: "外で飛ばす", en: "PERIMETER" },
    br: { ja: "中で手を出す", en: "INTERIOR" },
    bl: { ja: "コンテストが少ない", en: "HANDS DOWN" },
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

export const LEAGUE_HUB_TEAM_REBOUND: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "rebound",
  label: { ja: "リバウンド", en: "REB" },
  hint: {
    ja: "右ほど自分のシュートの外れを取り返し、上ほど相手に取り返させない。",
    en: "Right = grab more of own misses, up = give opponents fewer second chances.",
  },
  x: {
    metric: "orebPct",
    label: { ja: "OREB%（攻撃リバウンドを取った割合）", en: "OREB% (own misses rebounded)" },
    format: "pct",
  },
  y: {
    metric: "oppOrebPct",
    label: {
      ja: "相手 OREB%（相手に取られた割合・上ほど少ない）",
      en: "OPP OREB% (lower = up)",
    },
    format: "pct",
    invert: true,
  },
  marks: { tl: "REB" },
  quadrants: {
    tr: { ja: "ゴール下を支配", en: "OWN THE GLASS" },
    tl: { ja: "守りで固める", en: "CLEAN DEF GLASS" },
    br: { ja: "攻めで取りに行く", en: "CRASH THE GLASS" },
    bl: { ja: "リバウンドに弱い", en: "OUTREBOUNDED" },
  },
};

export const LEAGUE_HUB_TEAM_TEMPO: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "tempo",
  label: { ja: "速攻とテンポ", en: "TEMPO" },
  hint: {
    ja: "右ほど試合のペースが速く、上ほど得点のうち速攻の割合が高い。",
    en: "Right = faster pace, up = bigger share of points from fast breaks.",
  },
  x: {
    metric: "pace",
    label: { ja: "Pace（48 分あたりの攻撃回数）", en: "PACE (poss per 48 min)" },
    format: "one",
  },
  y: {
    metric: "pctPtsFb",
    label: { ja: "速攻得点%（得点のうち速攻の割合）", en: "FAST BREAK % of points" },
    format: "pct",
  },
  marks: { tl: "TEMPO" },
  quadrants: {
    tr: { ja: "走って取る", en: "RUN AND GUN" },
    tl: { ja: "隙を突いて走る", en: "OPPORTUNISTIC" },
    br: { ja: "早打ち", en: "QUICK TRIGGER" },
    bl: { ja: "じっくり攻める", en: "GRIND IT OUT" },
  },
};

export const LEAGUE_HUB_TEAM_TURNOVER: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "turnover",
  label: { ja: "ミスの攻防", en: "TOV" },
  hint: {
    ja: "右ほど自分のミスが少なく、上ほど相手のミスを誘う。",
    en: "Right = fewer own turnovers, up = force more turnovers.",
  },
  x: {
    metric: "tovPct",
    label: {
      ja: "TOV%（攻撃がミスで終わる割合・右ほど少ない）",
      en: "TOV% (lower = right)",
    },
    format: "pct",
    invert: true,
  },
  y: {
    metric: "oppTovPct",
    label: { ja: "相手 TOV%（相手の攻撃をミスで終わらせた割合）", en: "OPP TOV% (forced)" },
    format: "pct",
  },
  marks: { tl: "TOV" },
  quadrants: {
    tr: { ja: "ミスなく奪う", en: "WIN THE TOV BATTLE" },
    tl: { ja: "奪うが失う", en: "CHAOS" },
    br: { ja: "大事に運ぶ", en: "CAREFUL" },
    bl: { ja: "ミス合戦で負け", en: "LOSE THE TOV BATTLE" },
  },
};

export const LEAGUE_HUB_TEAM_ATTACK: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "attack",
  label: { ja: "攻めの作り方", en: "ATTACK" },
  hint: {
    ja: "右ほどパスを回し、上ほどドライブで切り込む。良し悪しではなく攻め方の違い。",
    en: "Right = more passes, up = more drives. A style, not a grade.",
  },
  x: { metric: "passes", label: { ja: "パス / 試合", en: "PASSES / G" }, format: "one" },
  y: { metric: "drives", label: { ja: "ドライブ / 試合", en: "DRIVES / G" }, format: "one" },
  marks: { tl: "ATTACK" },
  quadrants: {
    tr: { ja: "全方位で攻める", en: "ATTACK EVERYWHERE" },
    tl: { ja: "個人で切り込む", en: "DRIVE FIRST" },
    br: { ja: "パスで崩す", en: "BALL MOVEMENT" },
    bl: { ja: "外で組み立てる", en: "PERIMETER SET" },
  },
};

export const LEAGUE_HUB_TEAM_SHOT_DEFENSE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "shotDefense",
  label: { ja: "守備の質", en: "OPP FG%" },
  hint: {
    ja: "右ほど相手のシュート全体を落とさせ、上ほど相手の 3P を落とさせる。",
    en: "Right = lower opponent FG%, up = lower opponent 3P%.",
  },
  x: {
    metric: "fgPctAllowed",
    label: { ja: "相手 FG%（右ほど低い）", en: "OPP FG% (lower = right)" },
    format: "pct",
    invert: true,
  },
  y: {
    metric: "fg3PctAllowed",
    label: { ja: "相手 3P%（上ほど低い）", en: "OPP 3P% (lower = up)" },
    format: "pct",
    invert: true,
  },
  marks: { tl: "DEF" },
  quadrants: {
    tr: { ja: "内も外も守れる", en: "LOCKDOWN" },
    tl: { ja: "外は守れる", en: "PERIMETER D" },
    br: { ja: "中は守れる", en: "INTERIOR D" },
    bl: { ja: "どちらも苦しい", en: "LEAKY" },
  },
};

export const LEAGUE_HUB_TEAM_SHOT_CREATION: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "shotCreation",
  label: { ja: "シュートの作り方", en: "C&S × PULLUP" },
  hint: {
    ja: "右ほどパスを受けてそのまま打つシュートの得点が多く、上ほどドリブルから打つシュートの得点が多い。良し悪しではなく作り方の違い。",
    en: "Right = more catch-and-shoot points, up = more pull-up points. A style, not a grade.",
  },
  x: {
    metric: "cnsPts",
    label: { ja: "キャッチ&シュート得点 / 試合", en: "CATCH & SHOOT PTS / G" },
    format: "one",
  },
  y: {
    metric: "pullupPts",
    label: { ja: "プルアップ得点 / 試合", en: "PULL-UP PTS / G" },
    format: "one",
  },
  marks: { tl: "SHOT" },
  quadrants: {
    tr: { ja: "どちらでも取る", en: "BOTH WAYS" },
    tl: { ja: "個人で作る", en: "SELF-CREATED" },
    br: { ja: "パスから打つ", en: "CATCH AND SHOOT" },
    bl: { ja: "ゴール下で取る", en: "INSIDE SCORING" },
  },
};

const WIN_PCT_AXIS: LeagueHubAxis<LeagueHubTeamMetric> = {
  metric: "winPct",
  label: { ja: "勝率", en: "WIN%" },
  format: "pct",
};

export const LEAGUE_HUB_TEAM_ACE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "ace",
  label: { ja: "エース依存度", en: "ACE" },
  hint: {
    ja: "右ほどチームの得点をエース 1 人が背負い、上ほど勝っている。エースはチーム試合の半分以上・平均 10 分以上出ている選手の最多得点者。",
    en: "Right = one scorer carries more of the offense, up = more wins. Ace = top scorer among players in half the games at 10+ min.",
  },
  x: {
    metric: "aceShare",
    label: { ja: "エースの得点割合（チーム得点のうち）", en: "ACE SHARE of team points" },
    format: "pct",
  },
  y: WIN_PCT_AXIS,
  marks: { tl: "ACE" },
  quadrants: {
    tr: { ja: "エースで勝つ", en: "STAR POWERED" },
    tl: { ja: "全員で勝つ", en: "BY COMMITTEE" },
    br: { ja: "エース頼みで苦戦", en: "ONE-MAN SHOW" },
    bl: { ja: "決め手がない", en: "NO GO-TO" },
  },
};

export const LEAGUE_HUB_TEAM_DEPTH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "depth",
  label: { ja: "得点源の数", en: "DEPTH" },
  hint: {
    ja: "右ほど得点を取る選手が多く散らばり、上ほど勝っている。数字は「同じだけ点を取る選手が何人いるのと同じか」。",
    en: "Right = scoring spread across more players, up = more wins. Value = equivalent number of equal scorers.",
  },
  x: {
    metric: "scorerCount",
    label: { ja: "得点源の数（人）", en: "SCORERS (effective)" },
    format: "one",
  },
  y: WIN_PCT_AXIS,
  marks: { tl: "DEPTH" },
  quadrants: {
    tr: { ja: "層の厚さで勝つ", en: "DEEP AND WINNING" },
    tl: { ja: "少数精鋭", en: "TOP-HEAVY" },
    br: { ja: "層は厚いが勝てない", en: "DEEP, NOT WINNING" },
    bl: { ja: "頼れる人が少ない", en: "THIN" },
  },
};

export const LEAGUE_HUB_TEAM_BENCH: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "bench",
  label: { ja: "ベンチ力", en: "BENCH" },
  hint: {
    ja: "右ほど控え選手の得点が多く、上ほど勝っている。",
    en: "Right = more points from the bench, up = more wins.",
  },
  x: {
    metric: "benchShare",
    label: { ja: "ベンチ得点の割合（チーム得点のうち）", en: "BENCH SHARE of team points" },
    format: "pct",
  },
  y: WIN_PCT_AXIS,
  marks: { tl: "BENCH" },
  quadrants: {
    tr: { ja: "控えも強い", en: "DEEP BENCH" },
    tl: { ja: "先発で勝つ", en: "STARTERS CARRY" },
    br: { ja: "控え頼み", en: "BENCH RELIANT" },
    bl: { ja: "控えが弱い", en: "THIN BENCH" },
  },
};

export const LEAGUE_HUB_TEAM_PAYROLL: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "payroll",
  label: { ja: "コスパ", en: "PAYROLL" },
  hint: {
    ja: "右ほど選手の年俸総額が高く、上ほど勝っている。左上ほど安く勝っている。",
    en: "Right = bigger payroll, up = more wins. Top left = winning on a budget.",
  },
  x: {
    metric: "payrollM",
    label: { ja: "年俸総額（百万ドル）", en: "PAYROLL ($M)" },
    format: "one",
  },
  y: WIN_PCT_AXIS,
  marks: { tl: "$" },
  quadrants: {
    tr: { ja: "お金をかけて勝つ", en: "PAID AND WINNING" },
    tl: { ja: "安く勝つ", en: "BARGAIN" },
    br: { ja: "高いのに勝てない", en: "OVERPAID" },
    bl: { ja: "再建中", en: "REBUILDING" },
  },
};

export const LEAGUE_HUB_TEAM_AGE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "age",
  label: { ja: "若さと強さ", en: "AGE" },
  hint: {
    ja: "右ほどベテランが多く（ドラフトからの年数を出場時間で平均。ドラフト外は除く）、上ほど勝っている。",
    en: "Right = more experienced (years since draft, minutes-weighted; undrafted excluded), up = more wins.",
  },
  x: {
    metric: "experience",
    label: { ja: "経験年数（出場時間で平均）", en: "EXPERIENCE (yrs, min-weighted)" },
    format: "one",
  },
  y: WIN_PCT_AXIS,
  marks: { tl: "AGE" },
  quadrants: {
    tr: { ja: "経験で勝つ", en: "VETERAN CONTENDER" },
    tl: { ja: "若くて強い", en: "YOUNG RISERS" },
    br: { ja: "ベテランが苦戦", en: "AGING" },
    bl: { ja: "若手を育成中", en: "DEVELOPING" },
  },
};

export const LEAGUE_HUB_TEAM_SIZE: LeagueHubScatterPreset<LeagueHubTeamMetric> = {
  id: "size",
  label: { ja: "サイズ", en: "SIZE" },
  hint: {
    ja: "右ほど背の高い選手が長く出ていて（出場時間で平均）、上ほど試合のペースが速い。良し悪しではなく戦い方の違い。",
    en: "Right = taller lineup (minutes-weighted height), up = faster pace. A style, not a grade.",
  },
  x: {
    metric: "heightCm",
    label: { ja: "平均身長 cm（出場時間で平均）", en: "HEIGHT cm (min-weighted)" },
    format: "one",
  },
  y: {
    metric: "pace",
    label: { ja: "Pace（48 分あたりの攻撃回数）", en: "PACE (poss per 48 min)" },
    format: "one",
  },
  marks: { tl: "SIZE" },
  quadrants: {
    tr: { ja: "大きくて走る", en: "BIG AND FAST" },
    tl: { ja: "スモールボール", en: "SMALL BALL" },
    br: { ja: "大きくてじっくり", en: "BIG AND SLOW" },
    bl: { ja: "小さくてじっくり", en: "SMALL HALF-COURT" },
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
      label: { ja: "頻度（攻撃のうちこのプレーの割合）", en: "FREQ (share of possessions)" },
      format: "pct",
    },
    y: {
      metric: `${id}Ppp` as LeagueHubTeamMetric,
      label: { ja: "PPP（1 回あたりの得点）", en: "PPP (pts per possession)" },
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
