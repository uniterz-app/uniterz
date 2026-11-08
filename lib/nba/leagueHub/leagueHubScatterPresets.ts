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
    label: { ja: "3P の量と質", en: "3PT VOLUME × ACCURACY" },
    hint: {
      ja: "右ほどたくさん打ち、上ほどよく入る。右上が本物のシューター。",
      en: "Right = more attempts, up = better accuracy. Top right are the real shooters.",
    },
    x: { metric: "fg3a", label: { ja: "3PA / 試合", en: "3PA / G" }, format: "one" },
    y: { metric: "fg3_pct", label: { ja: "3P%", en: "3P%" }, format: "pct" },
    volume: "fg3a",
    volumeLabel: { ja: "3P 試投", en: "3PA" },
    quadrants: {
      tr: { ja: "量も質も", en: "VOLUME + TOUCH" },
      tl: { ja: "少数精鋭", en: "SELECTIVE" },
      br: { ja: "量で勝負", en: "VOLUME" },
      bl: { ja: "控えめ", en: "QUIET" },
    },
  },
  {
    id: "ace",
    label: { ja: "エースの効率", en: "USAGE × EFFICIENCY" },
    hint: {
      ja: "右ほどボールを持ち、上ほど効率よく点を取る。右上はボールを持っても効率が落ちない選手。",
      en: "Right = bigger offensive load, up = more efficient scoring. Top right carry a big load without losing efficiency.",
    },
    x: { metric: "usg", label: { ja: "USG%", en: "USG%" }, format: "pct" },
    y: { metric: "ts_pct", label: { ja: "TS%", en: "TS%" }, format: "pct" },
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "背負って決める", en: "LOAD + EFFICIENT" },
      tl: { ja: "効率よく決める", en: "EFFICIENT" },
      br: { ja: "量で背負う", en: "VOLUME" },
      bl: { ja: "負担も効率も控えめ", en: "LOW LOAD" },
    },
  },
  {
    id: "paint",
    label: { ja: "ゴール下の強さ", en: "PAINT POWER" },
    hint: {
      ja: "右ほどペイントで点を取り、上ほどリング下で確実に決める。",
      en: "Right = more paint points, up = better finishing at the rim.",
    },
    x: { metric: "pts_paint", label: { ja: "ペイント得点", en: "PAINT PTS" }, format: "one" },
    y: { metric: "restricted_fg_pct", label: { ja: "リング下 FG%", en: "RIM FG%" }, format: "pct" },
    volume: "pts_paint",
    volumeLabel: { ja: "ペイント得点", en: "PAINT PTS" },
    quadrants: {
      tr: { ja: "ゴール下の支配者", en: "PAINT BOSS" },
      tl: { ja: "確実な仕上げ", en: "SURE FINISHER" },
      br: { ja: "量で押し込む", en: "GRINDER" },
      bl: { ja: "外寄り", en: "PERIMETER" },
    },
  },
  {
    id: "playmaking",
    label: { ja: "ゲームメイク", en: "PLAYMAKING" },
    hint: {
      ja: "右ほどアシストを作り、上ほどターンオーバーが少ない。右上が安全な司令塔。",
      en: "Right = more assists created, up = fewer turnovers. Top right are safe playmakers.",
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
      tr: { ja: "安全な司令塔", en: "SAFE ENGINE" },
      tl: { ja: "ミスしない", en: "LOW RISK" },
      br: { ja: "攻める司令塔", en: "HIGH RISK" },
      bl: { ja: "フィニッシャー", en: "FINISHER" },
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
    volume: "pts",
    volumeLabel: { ja: "得点", en: "PTS" },
    quadrants: {
      tr: { ja: "守備の要", en: "ANCHOR" },
      tl: { ja: "堅実なマーク", en: "LOCKDOWN" },
      br: { ja: "ボールを狙う", en: "GAMBLER" },
      bl: { ja: "守備の数字は控えめ", en: "QUIET D" },
    },
  },
  {
    id: "clutch",
    label: { ja: "勝負どころ", en: "CLUTCH" },
    hint: {
      ja: "残り 5 分・5 点差以内。右ほどボールを託され、上ほど決める。",
      en: "Last 5 min, within 5. Right = trusted with the ball, up = makes the shots.",
    },
    x: { metric: "clutch_usg", label: { ja: "クラッチ USG%", en: "CLUTCH USG%" }, format: "pct" },
    y: { metric: "clutch_fg_pct", label: { ja: "クラッチ FG%", en: "CLUTCH FG%" }, format: "pct" },
    volume: "clutch_pts",
    volumeLabel: { ja: "クラッチ得点", en: "CLUTCH PTS" },
    quadrants: {
      tr: { ja: "勝負師", en: "CLOSER" },
      tl: { ja: "隠れた決め手", en: "SNEAKY" },
      br: { ja: "託されるが苦戦", en: "FORCED" },
      bl: { ja: "脇役", en: "SUPPORT" },
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
    tr: { ja: "手間を惜しまない", en: "RELENTLESS" },
    tl: { ja: "シュートに寄せる", en: "CONTEST" },
    br: { ja: "ボールを狙う", en: "HANDSY" },
    bl: { ja: "手数は少なめ", en: "LOW ACTIVITY" },
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
      br: { ja: "多用するが平凡", en: "OVERUSED" },
      bl: { ja: "使わない", en: "RARE" },
    },
  };
}
