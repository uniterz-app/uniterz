/**
 * リーグ Team Stats の Advanced 指標（モック）。
 * Firestore スナップショットにはまだ無いので、core 行に後付けする。
 */
import type { NbaLeagueAdvancedCategory } from "@/lib/predict/nbaLeagueStatBoard";
import { chunkForChipGrid, NBA_LEAGUE_STAT_CHIP_COLS } from "@/lib/predict/nbaLeagueStatBoard";

type TeamStatWindow = "season" | "last10";

export type NbaLeagueTeamAdvancedMetric =
  | "fgPct"
  | "ftPct"
  | "tsPct"
  | "ftaRate"
  | "orebPct"
  | "oppEfgPct"
  | "oppTovPct"
  | "oppFtaRate"
  | "oppOrebPct"
  | "pctPts3"
  | "pctPtsPaint"
  | "pctPtsFt"
  | "pctPtsFb"
  | "pctPtsTov"
  | "pts3"
  | "ptsPaint"
  | "ptsFt"
  | "ptsFb"
  | "ptsTov"
  | "clutchNet"
  | "clutchOrtg"
  | "clutchDrtg"
  | "clutchEfg"
  | "isoPpp"
  | "pnrBhPpp"
  | "pnrRollPpp"
  | "spotupPpp"
  | "transPpp"
  | "cutPpp"
  | "postPpp"
  | "isoPts"
  | "pnrBhPts"
  | "pnrRollPts"
  | "spotupPts"
  | "transPts"
  | "cutPts"
  | "postPts"
  | "isoFreq"
  | "pnrBhFreq"
  | "pnrRollFreq"
  | "spotupFreq"
  | "transFreq"
  | "cutFreq"
  | "postFreq"
  | "rimFgPct"
  | "corner3Pct"
  | "fgPctAllowed"
  | "fg3PctAllowed"
  | "rebAllowed"
  | "astAllowed"
  | "tovForced"
  | "drives"
  | "drivePts"
  | "cnsFgPct"
  | "cnsPts"
  | "pullupFgPct"
  | "pullupPts"
  | "passes"
  | "speed"
  | "paintTouches"
  | "paintTouchPts"
  | "deflections"
  | "charges"
  | "looseBalls"
  | "screenAst"
  | "contestedShots";

export type NbaLeagueTeamAdvancedFields = Record<
  NbaLeagueTeamAdvancedMetric,
  number
>;

export type NbaLeagueTeamAdvancedMetricDef = {
  id: NbaLeagueTeamAdvancedMetric;
  short: string;
  label: string;
  higherIsBetter: boolean;
  hintJa: string;
  hintEn: string;
  category: NbaLeagueAdvancedCategory | "basic";
  format: "pct" | "signed" | "ppp" | "one";
  /** false = リーグ表チップに出さない（詳細専用） */
  showInLeague: boolean;
};

function def(
  id: NbaLeagueTeamAdvancedMetric,
  short: string,
  label: string,
  category: NbaLeagueAdvancedCategory | "basic",
  higherIsBetter: boolean,
  format: NbaLeagueTeamAdvancedMetricDef["format"],
  hintJa: string,
  hintEn: string,
  showInLeague = true
): NbaLeagueTeamAdvancedMetricDef {
  return {
    id,
    short,
    label,
    category,
    higherIsBetter,
    format,
    hintJa,
    hintEn,
    showInLeague,
  };
}

export const NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS: readonly NbaLeagueTeamAdvancedMetricDef[] =
  [
    def(
      "fgPct",
      "FG%",
      "Field Goal %",
      "basic",
      true,
      "pct",
      "フィールドゴール成功率。",
      "Field goal percentage."
    ),
    def(
      "ftPct",
      "FT%",
      "Free Throw %",
      "basic",
      true,
      "pct",
      "フリースロー成功率。",
      "Free throw percentage."
    ),
    def(
      "tsPct",
      "TS%",
      "True Shooting %",
      "basic",
      true,
      "pct",
      "3P と FT を込めたシュート効率。",
      "True shooting. Efficiency including 3s and FTs."
    ),
    def(
      "ftaRate",
      "FTr",
      "FT Attempt Rate",
      "fourFactors",
      true,
      "pct",
      "FGA に対する FTA。フリースローをもらう力。",
      "FTA per FGA. Ability to get to the line."
    ),
    def(
      "orebPct",
      "OREB%",
      "Offensive Rebound %",
      "fourFactors",
      true,
      "pct",
      "オフェンスリバウンド率。",
      "Offensive rebound percentage."
    ),
    def(
      "oppEfgPct",
      "oEFG",
      "Opp eFG%",
      "fourFactors",
      false,
      "pct",
      "相手に許した eFG%。低いほど良い。",
      "Opponent eFG%. Lower is better."
    ),
    def(
      "oppTovPct",
      "oTOV",
      "Opp TOV%",
      "fourFactors",
      true,
      "pct",
      "相手のターンオーバー率。高いほど誘発できている。",
      "Opponent turnover rate. Higher means more forced TOs."
    ),
    def(
      "oppFtaRate",
      "oFTr",
      "Opp FT Rate",
      "fourFactors",
      false,
      "pct",
      "相手の FTA レート。低いほどファウルが少ない。",
      "Opponent FT rate. Lower means fewer fouls."
    ),
    def(
      "oppOrebPct",
      "oORB",
      "Opp OREB%",
      "fourFactors",
      false,
      "pct",
      "相手の OREB%。低いほどボックスアウトが良い。",
      "Opponent OREB%. Lower is better boxing out."
    ),
    def(
      "pctPts3",
      "3PT%",
      "% PTS from 3",
      "scoring",
      true,
      "pct",
      "得点のうち 3P の割合。",
      "Share of points from threes.",
      false
    ),
    def(
      "pctPtsPaint",
      "PAINT%",
      "% PTS in paint",
      "scoring",
      true,
      "pct",
      "得点のうちペイントの割合。",
      "Share of points in the paint.",
      false
    ),
    def(
      "pctPtsFt",
      "FT%",
      "% PTS from FT",
      "scoring",
      true,
      "pct",
      "得点のうちフリースローの割合。",
      "Share of points from free throws.",
      false
    ),
    def(
      "pctPtsFb",
      "FB%",
      "% PTS fast break",
      "scoring",
      true,
      "pct",
      "得点のうちファストブレイクの割合。",
      "Share of points from fast breaks.",
      false
    ),
    def(
      "pctPtsTov",
      "TO%",
      "% PTS off TO",
      "scoring",
      true,
      "pct",
      "得点のうち相手 TO 後の割合。",
      "Share of points off turnovers.",
      false
    ),
    def(
      "pts3",
      "3PT",
      "Points from 3 / G",
      "scoring",
      true,
      "one",
      "1試合あたりの3P得点。",
      "Points per game from threes."
    ),
    def(
      "ptsPaint",
      "PAINT",
      "Paint points / G",
      "scoring",
      true,
      "one",
      "1試合あたりのペイント得点。",
      "Points per game in the paint."
    ),
    def(
      "ptsFt",
      "FT",
      "FT points / G",
      "scoring",
      true,
      "one",
      "1試合あたりのフリースロー得点。",
      "Points per game from free throws."
    ),
    def(
      "ptsFb",
      "FB",
      "Fast-break points / G",
      "scoring",
      true,
      "one",
      "1試合あたりのファストブレイク得点。",
      "Points per game on the break."
    ),
    def(
      "ptsTov",
      "TO",
      "Points off TO / G",
      "scoring",
      true,
      "one",
      "1試合あたりの相手TO後の得点。",
      "Points per game off turnovers."
    ),
    def(
      "clutchNet",
      "NET",
      "Clutch Net Rating",
      "clutch",
      true,
      "signed",
      "僅差・終盤のネットレーティング。",
      "Net rating in the clutch."
    ),
    def(
      "clutchOrtg",
      "ORTG",
      "Clutch Off Rating",
      "clutch",
      true,
      "one",
      "僅差・終盤のオフェンスレーティング。",
      "Offensive rating in the clutch."
    ),
    def(
      "clutchDrtg",
      "DRTG",
      "Clutch Def Rating",
      "clutch",
      false,
      "one",
      "僅差・終盤のディフェンスレーティング。低いほど良い。",
      "Defensive rating in the clutch. Lower is better."
    ),
    def(
      "clutchEfg",
      "EFG",
      "Clutch eFG%",
      "clutch",
      true,
      "pct",
      "僅差・終盤の eFG%。",
      "eFG% in the clutch."
    ),
    def(
      "isoPpp",
      "ISO",
      "Isolation PPP",
      "playtype",
      true,
      "ppp",
      "アイソレーションの得点効率。",
      "Isolation points per possession.",
      false
    ),
    def(
      "pnrBhPpp",
      "PnR-B",
      "PnR ball-handler PPP",
      "playtype",
      true,
      "ppp",
      "ピック&ロール（ボールハンドラー）の PPP。",
      "Pick-and-roll ball-handler PPP.",
      false
    ),
    def(
      "pnrRollPpp",
      "PnR-R",
      "PnR roll man PPP",
      "playtype",
      true,
      "ppp",
      "ピック&ロール（ロールマン）の PPP。",
      "Pick-and-roll roll man PPP.",
      false
    ),
    def(
      "spotupPpp",
      "SPOT",
      "Spot-up PPP",
      "playtype",
      true,
      "ppp",
      "スポットアップの PPP。",
      "Spot-up PPP.",
      false
    ),
    def(
      "transPpp",
      "TRAN",
      "Transition PPP",
      "playtype",
      true,
      "ppp",
      "トランジションの PPP。",
      "Transition PPP.",
      false
    ),
    def(
      "cutPpp",
      "CUT",
      "Cut PPP",
      "playtype",
      true,
      "ppp",
      "カットの PPP。",
      "Cut PPP.",
      false
    ),
    def(
      "postPpp",
      "POST",
      "Post-up PPP",
      "playtype",
      true,
      "ppp",
      "ポストアップの PPP。",
      "Post-up PPP.",
      false
    ),
    def(
      "isoPts",
      "ISO",
      "Isolation PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりのアイソ得点。",
      "Isolation points per game."
    ),
    def(
      "pnrBhPts",
      "PnR-B",
      "PnR ball-handler PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりの PnR ハンドラー得点。",
      "Pick-and-roll ball-handler points per game."
    ),
    def(
      "pnrRollPts",
      "PnR-R",
      "PnR roll man PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりの PnR ロール得点。",
      "Pick-and-roll roll-man points per game."
    ),
    def(
      "spotupPts",
      "SPOT",
      "Spot-up PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりのスポットアップ得点。",
      "Spot-up points per game."
    ),
    def(
      "transPts",
      "TRAN",
      "Transition PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりのトランジション得点。",
      "Transition points per game."
    ),
    def(
      "cutPts",
      "CUT",
      "Cut PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりのカット得点。",
      "Cut points per game."
    ),
    def(
      "postPts",
      "POST",
      "Post-up PTS / G",
      "playtype",
      true,
      "one",
      "1試合あたりのポストアップ得点。",
      "Post-up points per game."
    ),
    def(
      "isoFreq",
      "ISO%",
      "Isolation freq",
      "playtype",
      true,
      "pct",
      "アイソの使用割合。",
      "Isolation possession share.",
      false
    ),
    def(
      "pnrBhFreq",
      "PnR-B%",
      "PnR handler freq",
      "playtype",
      true,
      "pct",
      "PnR ハンドラーの使用割合。",
      "PnR ball-handler possession share.",
      false
    ),
    def(
      "pnrRollFreq",
      "PnR-R%",
      "PnR roll freq",
      "playtype",
      true,
      "pct",
      "PnR ロールの使用割合。",
      "PnR roll possession share.",
      false
    ),
    def(
      "spotupFreq",
      "SPOT%",
      "Spot-up freq",
      "playtype",
      true,
      "pct",
      "スポットアップの使用割合。",
      "Spot-up possession share.",
      false
    ),
    def(
      "transFreq",
      "TRAN%",
      "Transition freq",
      "playtype",
      true,
      "pct",
      "トランジションの使用割合。",
      "Transition possession share.",
      false
    ),
    def(
      "cutFreq",
      "CUT%",
      "Cut freq",
      "playtype",
      true,
      "pct",
      "カットの使用割合。",
      "Cut possession share.",
      false
    ),
    def(
      "postFreq",
      "POST%",
      "Post-up freq",
      "playtype",
      true,
      "pct",
      "ポストアップの使用割合。",
      "Post-up possession share.",
      false
    ),
    def(
      "rimFgPct",
      "RIM",
      "Restricted FG%",
      "shooting",
      true,
      "pct",
      "restricted area の FG%。",
      "Restricted-area FG%.",
      false
    ),
    def(
      "corner3Pct",
      "C3",
      "Corner 3%",
      "shooting",
      true,
      "pct",
      "コーナー3の成功率。",
      "Corner three percentage.",
      false
    ),
    def(
      "fgPctAllowed",
      "FG%",
      "Opp FG%",
      "defense",
      false,
      "pct",
      "相手に許した FG%。低いほど良い。",
      "Opponent FG%. Lower is better."
    ),
    def(
      "fg3PctAllowed",
      "3P%",
      "Opp 3P%",
      "defense",
      false,
      "pct",
      "相手に許した 3P%。低いほど良い。",
      "Opponent 3P%. Lower is better."
    ),
    def(
      "rebAllowed",
      "REB",
      "Opp REB / G",
      "defense",
      false,
      "one",
      "相手に許したリバウンド。低いほど良い。",
      "Rebounds allowed per game. Lower is better."
    ),
    def(
      "astAllowed",
      "AST",
      "Opp AST / G",
      "defense",
      false,
      "one",
      "相手に許したアシスト。低いほど良い。",
      "Assists allowed per game. Lower is better."
    ),
    def(
      "tovForced",
      "TOV",
      "TOs forced / G",
      "defense",
      true,
      "one",
      "誘発したターンオーバー。高いほど良い。",
      "Turnovers forced per game."
    ),
    def(
      "drives",
      "DRIVE",
      "Drives / G",
      "tracking",
      true,
      "one",
      "1試合あたりのドライブ数。",
      "Drives per game."
    ),
    def(
      "drivePts",
      "D-PTS",
      "Drive PTS / G",
      "tracking",
      true,
      "one",
      "ドライブからの1試合平均得点。",
      "Points per game from drives."
    ),
    def(
      "cnsFgPct",
      "C&S",
      "Catch & Shoot FG%",
      "tracking",
      true,
      "pct",
      "キャッチ&シュートの FG%。",
      "Catch-and-shoot FG%."
    ),
    def(
      "cnsPts",
      "CS-PTS",
      "Catch & Shoot PTS / G",
      "tracking",
      true,
      "one",
      "キャッチ&シュートからの1試合平均得点。",
      "Points per game from catch-and-shoot."
    ),
    def(
      "pullupFgPct",
      "PULL",
      "Pull-up FG%",
      "tracking",
      true,
      "pct",
      "プルアップの FG%。",
      "Pull-up FG%."
    ),
    def(
      "pullupPts",
      "PU-PTS",
      "Pull-up PTS / G",
      "tracking",
      true,
      "one",
      "プルアップからの1試合平均得点。",
      "Points per game from pull-ups."
    ),
    def(
      "paintTouches",
      "PAINT",
      "Paint touches / G",
      "tracking",
      true,
      "one",
      "ペイントタッチ数。",
      "Paint touches per game."
    ),
    def(
      "paintTouchPts",
      "PT-PTS",
      "Paint-touch PTS / G",
      "tracking",
      true,
      "one",
      "ペイントタッチからの1試合平均得点。",
      "Points per game from paint touches."
    ),
    def(
      "passes",
      "PASS",
      "Passes / G",
      "tracking",
      true,
      "one",
      "1試合あたりのパス数。",
      "Passes per game."
    ),
    def(
      "speed",
      "SPD",
      "Avg speed",
      "tracking",
      true,
      "one",
      "平均スピード。",
      "Average speed."
    ),
    def(
      "deflections",
      "DEFL",
      "Deflections / G",
      "hustle",
      true,
      "one",
      "ディフレクション。",
      "Deflections per game."
    ),
    def(
      "charges",
      "CHG",
      "Charges drawn / G",
      "hustle",
      true,
      "one",
      "チャージングをもらった数。",
      "Charges drawn per game."
    ),
    def(
      "looseBalls",
      "LOOSE",
      "Loose balls / G",
      "hustle",
      true,
      "one",
      "ルーズボールリカバー。",
      "Loose balls recovered per game."
    ),
    def(
      "screenAst",
      "SCRN",
      "Screen assists / G",
      "hustle",
      true,
      "one",
      "スクリーンアシスト。",
      "Screen assists per game."
    ),
    def(
      "contestedShots",
      "CONT",
      "Contested shots / G",
      "hustle",
      true,
      "one",
      "コンテストしたシュート。",
      "Contested shots per game."
    ),
  ];

export const NBA_LEAGUE_TEAM_BASIC_EXTRA_METRICS =
  NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.filter((m) => m.category === "basic");

export function teamAdvancedMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): readonly NbaLeagueTeamAdvancedMetricDef[] {
  return NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.filter(
    (m) => m.category === category && m.showInLeague
  );
}

export function teamAdvancedMetricChipRows(
  category: NbaLeagueAdvancedCategory
) {
  return chunkForChipGrid(
    teamAdvancedMetricsForCategory(category),
    NBA_LEAGUE_STAT_CHIP_COLS
  );
}

type CoreAnchor = {
  teamId: string;
  netrtg: number;
  ortg: number;
  drtg: number;
  efgPct: number;
  tovPct: number;
  papg: number;
  fg3Pct: number;
  ppg: number;
  pace: number;
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function ppp(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildLeagueTeamAdvancedFields(
  core: CoreAnchor,
  window: TeamStatWindow
): NbaLeagueTeamAdvancedFields {
  const rnd = mulberry32(hashSeed(`${core.teamId}:${window}:adv:v1`));
  const tier = Math.max(0, Math.min(1, (core.netrtg + 12) / 24));
  const noise = window === "last10" ? 0.08 : 0.03;

  const fgPct = pct3(0.44 + tier * 0.06 + (rnd() - 0.5) * 0.02);
  const ftPct = pct3(0.74 + tier * 0.08 + (rnd() - 0.5) * 0.03);
  const tsPct = pct3(core.efgPct + 0.04 + (rnd() - 0.5) * 0.015);
  const ftaRate = pct3(0.22 + tier * 0.08 + (rnd() - 0.5) * noise);
  const orebPct = pct3(0.24 + (rnd() - 0.5) * 0.06);
  const oppEfgPct = pct3(0.54 - tier * 0.05 + (rnd() - 0.5) * 0.02);
  const oppTovPct = pct3(0.13 + tier * 0.03 + (rnd() - 0.5) * 0.015);
  const oppFtaRate = pct3(0.26 - tier * 0.05 + (rnd() - 0.5) * noise);
  const oppOrebPct = pct3(0.26 - tier * 0.04 + (rnd() - 0.5) * 0.03);

  const pctPts3 = pct3(0.28 + rnd() * 0.18);
  const pctPtsPaint = pct3(0.32 + rnd() * 0.16);
  const pctPtsFt = pct3(0.12 + rnd() * 0.1);
  const pctPtsFb = pct3(0.08 + rnd() * 0.08);
  const pctPtsTov = pct3(Math.max(0.08, 1 - pctPts3 - pctPtsPaint - pctPtsFt - pctPtsFb));

  const clutchShift = (rnd() - 0.45) * 6;
  const clutchNet = round1(core.netrtg * 0.7 + clutchShift);
  const clutchOrtg = round1(core.ortg + clutchShift * 0.6 + (rnd() - 0.5) * 3);
  const clutchDrtg = round1(clutchOrtg - clutchNet);
  const clutchEfg = pct3(core.efgPct + (rnd() - 0.5) * 0.04);

  const pppBase = 0.88 + tier * 0.22;
  const isoPpp = ppp(pppBase - 0.08 + rnd() * 0.16);
  const pnrBhPpp = ppp(pppBase + (rnd() - 0.5) * 0.14);
  const pnrRollPpp = ppp(1.05 + tier * 0.15 + (rnd() - 0.5) * 0.12);
  const spotupPpp = ppp(0.95 + (rnd() - 0.5) * 0.16);
  const transPpp = ppp(1.12 + tier * 0.1 + (rnd() - 0.5) * 0.1);
  const cutPpp = ppp(1.18 + (rnd() - 0.5) * 0.1);
  const postPpp = ppp(0.9 + (rnd() - 0.5) * 0.16);

  const freqRaw = [
    0.4 + rnd(),
    0.5 + rnd() * 1.2,
    0.35 + rnd(),
    0.45 + rnd() * 1.1,
    0.3 + rnd() * 0.9,
    0.2 + rnd() * 0.7,
    0.15 + rnd() * 0.6,
  ];
  const freqSum = freqRaw.reduce((a, b) => a + b, 0);
  const freqScale = 0.82;
  const isoFreq = pct3((freqRaw[0]! / freqSum) * freqScale);
  const pnrBhFreq = pct3((freqRaw[1]! / freqSum) * freqScale);
  const pnrRollFreq = pct3((freqRaw[2]! / freqSum) * freqScale);
  const spotupFreq = pct3((freqRaw[3]! / freqSum) * freqScale);
  const transFreq = pct3((freqRaw[4]! / freqSum) * freqScale);
  const cutFreq = pct3((freqRaw[5]! / freqSum) * freqScale);
  const postFreq = pct3((freqRaw[6]! / freqSum) * freqScale);

  const rimFgPct = pct3(0.58 + tier * 0.1 + (rnd() - 0.5) * 0.04);
  const corner3Pct = pct3(0.34 + tier * 0.06 + (rnd() - 0.5) * 0.04);

  const fgPctAllowed = pct3(0.48 - tier * 0.04 + (rnd() - 0.5) * 0.02);
  const fg3PctAllowed = pct3(0.37 - tier * 0.03 + (rnd() - 0.5) * 0.02);
  const rebAllowed = round1(42 + (1 - tier) * 6 + (rnd() - 0.5) * 3);
  const astAllowed = round1(24 + (1 - tier) * 5 + (rnd() - 0.5) * 2);
  const tovForced = round1(13 + core.tovPct * 20 + rnd() * 3);

  const drives = round1(40 + rnd() * 22);
  const cnsFgPct = pct3(0.35 + rnd() * 0.08);
  const pullupFgPct = pct3(0.32 + rnd() * 0.1);
  const passes = round1(280 + rnd() * 80);
  const speed = round1(4.2 + rnd() * 0.7);
  const paintTouches = round1(28 + rnd() * 18);

  const deflections = round1(12 + rnd() * 8);
  const charges = round1(0.2 + rnd() * 0.8);
  const looseBalls = round1(6 + rnd() * 4);
  const screenAst = round1(8 + rnd() * 7);
  const contestedShots = round1(40 + rnd() * 18);

  const pts3 = round1(core.ppg * pctPts3);
  const ptsPaint = round1(core.ppg * pctPtsPaint);
  const ptsFt = round1(core.ppg * pctPtsFt);
  const ptsFb = round1(core.ppg * pctPtsFb);
  const ptsTov = round1(core.ppg * pctPtsTov);
  const isoPts = round1(isoPpp * core.pace * isoFreq);
  const pnrBhPts = round1(pnrBhPpp * core.pace * pnrBhFreq);
  const pnrRollPts = round1(pnrRollPpp * core.pace * pnrRollFreq);
  const spotupPts = round1(spotupPpp * core.pace * spotupFreq);
  const transPts = round1(transPpp * core.pace * transFreq);
  const cutPts = round1(cutPpp * core.pace * cutFreq);
  const postPts = round1(postPpp * core.pace * postFreq);
  const drivePts = round1(drives * (0.4 + pctPtsPaint * 0.28));
  const cnsPts = round1(core.ppg * spotupFreq * 0.85);
  const pullupPts = round1(core.ppg * (isoFreq * 0.7 + pnrBhFreq * 0.22));
  const paintTouchPts = round1(paintTouches * (0.26 + rimFgPct * 0.22));

  return {
    fgPct,
    ftPct,
    tsPct,
    ftaRate,
    orebPct,
    oppEfgPct,
    oppTovPct,
    oppFtaRate,
    oppOrebPct,
    pctPts3,
    pctPtsPaint,
    pctPtsFt,
    pctPtsFb,
    pctPtsTov,
    pts3,
    ptsPaint,
    ptsFt,
    ptsFb,
    ptsTov,
    clutchNet,
    clutchOrtg,
    clutchDrtg,
    clutchEfg,
    isoPpp,
    pnrBhPpp,
    pnrRollPpp,
    spotupPpp,
    transPpp,
    cutPpp,
    postPpp,
    isoPts,
    pnrBhPts,
    pnrRollPts,
    spotupPts,
    transPts,
    cutPts,
    postPts,
    isoFreq,
    pnrBhFreq,
    pnrRollFreq,
    spotupFreq,
    transFreq,
    cutFreq,
    postFreq,
    rimFgPct,
    corner3Pct,
    fgPctAllowed,
    fg3PctAllowed,
    rebAllowed,
    astAllowed,
    tovForced,
    drives,
    drivePts,
    cnsFgPct,
    cnsPts,
    pullupFgPct,
    pullupPts,
    passes,
    speed,
    paintTouches,
    paintTouchPts,
    deflections,
    charges,
    looseBalls,
    screenAst,
    contestedShots,
  };
}

export function formatTeamAdvancedValue(
  metric: NbaLeagueTeamAdvancedMetric,
  value: number | null | undefined
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const meta = NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.find((m) => m.id === metric);
  const format = meta?.format ?? "one";
  if (format === "pct") return `${(value * 100).toFixed(1)}%`;
  if (format === "signed") return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  if (format === "ppp") return value.toFixed(2);
  return value.toFixed(1);
}
