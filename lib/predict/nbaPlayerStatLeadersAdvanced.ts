/**
 * リーグ Player Leaders の Advanced 指標（モック）。
 * BDL leaders の 19 stat_type とは別。season averages 系の置き場。
 */
import type { NbaLeagueAdvancedCategory } from "@/lib/predict/nbaLeagueStatBoard";
import {
  chunkForChipGrid,
  NBA_LEAGUE_STAT_CHIP_COLS,
} from "@/lib/predict/nbaLeagueStatBoard";

export type NbaPlayerAdvancedLeaderMetric =
  | "per"
  | "ts_pct"
  | "usg"
  | "pie"
  | "ast_pct"
  | "reb_pct"
  | "ast_to"
  | "ortg"
  | "drtg"
  | "efg_pct"
  | "fta_rate"
  | "oreb_pct"
  | "tov_pct"
  | "pct_pts_3"
  | "pct_pts_paint"
  | "pct_pts_mid"
  | "pct_pts_ft"
  | "pct_pts_fb"
  | "pct_pts_tov"
  | "pts_3"
  | "pts_paint"
  | "pts_mid"
  | "pts_ft"
  | "pts_fb"
  | "pts_tov"
  | "clutch_pts"
  | "clutch_fg_pct"
  | "clutch_usg"
  | "iso_ppp"
  | "pnr_bh_ppp"
  | "pnr_roll_ppp"
  | "spotup_ppp"
  | "trans_ppp"
  | "cut_ppp"
  | "post_ppp"
  | "handoff_ppp"
  | "offscreen_ppp"
  | "oreb_ppp"
  | "iso_freq"
  | "pnr_bh_freq"
  | "pnr_roll_freq"
  | "spotup_freq"
  | "trans_freq"
  | "cut_freq"
  | "post_freq"
  | "handoff_freq"
  | "offscreen_freq"
  | "oreb_freq"
  | "iso_pts"
  | "pnr_bh_pts"
  | "pnr_roll_pts"
  | "spotup_pts"
  | "trans_pts"
  | "cut_pts"
  | "post_pts"
  | "handoff_pts"
  | "offscreen_pts"
  | "oreb_pts"
  | "matchup_fg_pct"
  | "matchup_3pt_pct"
  | "opp_2p_pct"
  | "opp_3p_pct"
  | "opp_lt6_pct"
  | "restricted_fg_pct"
  | "restricted_pts"
  | "corner3_pct"
  | "corner3_pts"
  | "drives"
  | "drive_pts"
  | "cns_fg_pct"
  | "cns_pts"
  | "pullup_fg_pct"
  | "pullup_pts"
  | "passes"
  | "speed"
  | "paint_touches"
  | "paint_touch_pts"
  | "deflections"
  | "charges"
  | "loose_balls"
  | "screen_ast"
  | "contested_shots";

export type NbaPlayerLeaderMetricKindEx =
  | "pct"
  | "perGame"
  | "minutes"
  | "eff"
  | "ppp"
  | "ratio"
  | "rating";

export type NbaPlayerAdvancedLeaderMetricDef = {
  id: NbaPlayerAdvancedLeaderMetric;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hintJa: string;
  hintEn: string;
  kind: NbaPlayerLeaderMetricKindEx;
  category: NbaLeagueAdvancedCategory;
  /** false = リーグ表チップに出さない（詳細専用） */
  showInLeague: boolean;
};

function def(
  id: NbaPlayerAdvancedLeaderMetric,
  short: string,
  label: string,
  category: NbaLeagueAdvancedCategory,
  higherIsBetter: boolean,
  kind: NbaPlayerLeaderMetricKindEx,
  hintJa: string,
  hintEn: string,
  showInLeague = true
): NbaPlayerAdvancedLeaderMetricDef {
  return {
    id,
    short,
    label,
    category,
    higherIsBetter,
    kind,
    hintJa,
    hintEn,
    showInLeague,
  };
}

export const NBA_PLAYER_ADVANCED_LEADER_METRICS: readonly NbaPlayerAdvancedLeaderMetricDef[] =
  [
    def("per", "PER", "Player Efficiency Rating", "ratings", true, "rating", "得点・リバウンド・アシストなどを足した総合点。高いほど何でもできている。", "All-in-one box score. Higher = does more of everything."),
    def("ts_pct", "TS%", "True Shooting %", "ratings", true, "pct", "3PとFTも入れたシュート効率。高いほど『同じ試投で点が入る』。", "Shooting efficiency including 3s and FTs. Higher = more points per shot."),
    def("usg", "USG", "Usage %", "ratings", true, "pct", "チームの攻撃のうち、何割を自分が使ったか。高い＝ボールを集める主役。点が取れるかは別。", "Share of team plays that go through this player. High = the offense runs through them, not that they score well."),
    def("pie", "PIE", "Player Impact Estimate", "ratings", true, "pct", "試合の出来事のうち、自分が占めた割合。高いほど勝敗への影響が大きい。", "Share of the game’s events. Higher = more impact on the result."),
    def("ast_pct", "AST%", "Assist %", "ratings", true, "pct", "味方が決めた得点のうち、自分のパスから生まれた割合。高いほど組み立て役。", "Share of teammate buckets that started with this player’s pass. Higher = the setup guy."),
    def("reb_pct", "REB%", "Rebound %", "ratings", true, "pct", "落ちたボールのうち、自分が取った割合。高いほどボードを支配している。", "Share of available rebounds grabbed. Higher = owns the glass."),
    def("ast_to", "A/TO", "AST / TO", "ratings", true, "ratio", "ミス1回あたり何回アシストできたか。高いほどパスが安定している。", "Assists per turnover. Higher = cleaner passer."),
    def("ortg", "ORTG", "Offensive Rating", "ratings", true, "rating", "コートにいるときの100possあたり得点。高いほど、自分がいると点が取れる。", "Points per 100 poss while on court. Higher = offense works with them out there."),
    def("drtg", "DRTG", "Defensive Rating", "ratings", false, "rating", "コートにいるときの100possあたり失点。低いほど、自分がいると点が止まる。", "Points allowed per 100 poss while on court. Lower = defense holds with them out there."),
    def("efg_pct", "EFG", "Effective FG%", "fourFactors", true, "pct", "3Pを1.5本分と数えたシュート精度。FG%より『本当に点が入るか』。", "FG% that counts a three as 1.5 makes. Fairer than raw FG%."),
    def("fta_rate", "FTr", "FT Attempt Rate", "fourFactors", true, "pct", "シュート1本あたり何回FTをもらえるか。高いほどゴール下やファウルが上手い。", "FTAs per field-goal attempt. Higher = gets to the line."),
    def("oreb_pct", "OREB%", "Offensive Rebound %", "fourFactors", true, "pct", "味方のミスショットのうち、自分が拾った割合。高いほどセカンドチャンスを作れる。", "Share of missed shots grabbed on offense. Higher = extra possessions."),
    def("tov_pct", "TOV%", "Turnover %", "fourFactors", false, "pct", "自分の攻撃のうち、ミスで終わる割合。低いほどボールを大事にしている。", "Share of plays that end in a turnover. Lower = takes care of the ball."),
    def("pct_pts_3", "3PT%", "% PTS from 3", "scoring", true, "pct", "得点のうち 3P。", "Share of points from threes.", false),
    def("pct_pts_paint", "PAINT%", "% PTS in paint", "scoring", true, "pct", "得点のうちペイント。", "Share of points in the paint.", false),
    def("pct_pts_mid", "MID%", "% PTS mid-range", "scoring", true, "pct", "得点のうちミッドレンジ。", "Share of points from mid-range.", false),
    def("pct_pts_ft", "FT%", "% PTS from FT", "scoring", true, "pct", "得点のうち FT。", "Share of points from free throws.", false),
    def("pct_pts_fb", "FB%", "% PTS fast break", "scoring", true, "pct", "得点のうちファストブレイク。", "Share of points from fast breaks.", false),
    def("pct_pts_tov", "TO%", "% PTS off TO", "scoring", true, "pct", "得点のうち TO 後。", "Share of points off turnovers.", false),
    def("pts_3", "3PT", "Points from 3 / G", "scoring", true, "perGame", "1試合あたりの3P得点。", "Points per game from threes."),
    def("pts_paint", "PAINT", "Paint points / G", "scoring", true, "perGame", "1試合あたりのペイント得点。", "Points per game in the paint."),
    def("pts_mid", "MID", "Mid-range points / G", "scoring", true, "perGame", "1試合あたりのミッドレンジ得点。", "Points per game from mid-range."),
    def("pts_ft", "FT", "FT points / G", "scoring", true, "perGame", "1試合あたりのフリースロー得点。", "Points per game from free throws."),
    def("pts_fb", "FB", "Fast-break points / G", "scoring", true, "perGame", "1試合あたりのファストブレイク得点。", "Points per game on the break."),
    def("pts_tov", "TO", "Points off TO / G", "scoring", true, "perGame", "1試合あたりの相手TO後の得点。", "Points per game off turnovers."),
    def("clutch_pts", "PTS", "Clutch PTS / G", "clutch", true, "perGame", "僅差・終盤の平均得点。", "Points per game in the clutch."),
    def("clutch_fg_pct", "FG%", "Clutch FG%", "clutch", true, "pct", "僅差・終盤の FG%。", "FG% in the clutch."),
    def("clutch_usg", "USG", "Clutch usage", "clutch", true, "pct", "僅差・終盤で、攻撃のボールをどれだけ自分が使ったか。高い＝終盤の主役。", "Share of clutch plays that go through this player. High = the closer, not that they hit."),
    def("iso_ppp", "ISO", "Isolation PPP", "playtype", true, "ppp", "アイソレーションの PPP。", "Isolation points per possession.", false),
    def("pnr_bh_ppp", "PnR-B", "PnR handler PPP", "playtype", true, "ppp", "PnR ボールハンドラーの PPP。", "Pick-and-roll ball-handler PPP.", false),
    def("pnr_roll_ppp", "PnR-R", "PnR roll PPP", "playtype", true, "ppp", "PnR ロールマンの PPP。", "Pick-and-roll roll man PPP.", false),
    def("spotup_ppp", "SPOT", "Spot-up PPP", "playtype", true, "ppp", "スポットアップの PPP。", "Spot-up PPP.", false),
    def("trans_ppp", "TRAN", "Transition PPP", "playtype", true, "ppp", "トランジションの PPP。", "Transition PPP.", false),
    def("cut_ppp", "CUT", "Cut PPP", "playtype", true, "ppp", "カットの PPP。", "Cut PPP.", false),
    def("post_ppp", "POST", "Post-up PPP", "playtype", true, "ppp", "ポストアップの PPP。", "Post-up PPP.", false),
    def("handoff_ppp", "HND", "Handoff PPP", "playtype", true, "ppp", "ハンドオフの PPP。", "Handoff PPP.", false),
    def("offscreen_ppp", "OFFS", "Off-screen PPP", "playtype", true, "ppp", "オフスクリーンの PPP。", "Off-screen PPP.", false),
    def("oreb_ppp", "PUTB", "OREB putback PPP", "playtype", true, "ppp", "オフリブ・プットバックの PPP。", "Offensive rebound putback PPP.", false),
    def("iso_freq", "ISO%", "Isolation freq", "playtype", true, "pct", "アイソレーションの使用率。", "Isolation possession frequency.", false),
    def("pnr_bh_freq", "PnR-B%", "PnR handler freq", "playtype", true, "pct", "PnR ボールハンドラーの使用率。", "Pick-and-roll ball-handler frequency.", false),
    def("pnr_roll_freq", "PnR-R%", "PnR roll freq", "playtype", true, "pct", "PnR ロールマンの使用率。", "Pick-and-roll roll man frequency.", false),
    def("spotup_freq", "SPOT%", "Spot-up freq", "playtype", true, "pct", "スポットアップの使用率。", "Spot-up frequency.", false),
    def("trans_freq", "TRAN%", "Transition freq", "playtype", true, "pct", "トランジションの使用率。", "Transition frequency.", false),
    def("cut_freq", "CUT%", "Cut freq", "playtype", true, "pct", "カットの使用率。", "Cut frequency.", false),
    def("post_freq", "POST%", "Post-up freq", "playtype", true, "pct", "ポストアップの使用率。", "Post-up frequency.", false),
    def("handoff_freq", "HND%", "Handoff freq", "playtype", true, "pct", "ハンドオフの使用率。", "Handoff frequency.", false),
    def("offscreen_freq", "OFFS%", "Off-screen freq", "playtype", true, "pct", "オフスクリーンの使用率。", "Off-screen frequency.", false),
    def("oreb_freq", "PUTB%", "Putback freq", "playtype", true, "pct", "プットバックの使用率。", "Putback frequency.", false),
    def("iso_pts", "ISO", "Isolation PTS / G", "playtype", true, "perGame", "1試合あたりのアイソ得点。", "Isolation points per game."),
    def("pnr_bh_pts", "PnR-B", "PnR handler PTS / G", "playtype", true, "perGame", "1試合あたりの PnR ハンドラー得点。", "Pick-and-roll ball-handler points per game."),
    def("pnr_roll_pts", "PnR-R", "PnR roll PTS / G", "playtype", true, "perGame", "1試合あたりの PnR ロール得点。", "Pick-and-roll roll-man points per game."),
    def("spotup_pts", "SPOT", "Spot-up PTS / G", "playtype", true, "perGame", "1試合あたりのスポットアップ得点。", "Spot-up points per game."),
    def("trans_pts", "TRAN", "Transition PTS / G", "playtype", true, "perGame", "1試合あたりのトランジション得点。", "Transition points per game."),
    def("cut_pts", "CUT", "Cut PTS / G", "playtype", true, "perGame", "1試合あたりのカット得点。", "Cut points per game."),
    def("post_pts", "POST", "Post-up PTS / G", "playtype", true, "perGame", "1試合あたりのポストアップ得点。", "Post-up points per game."),
    def("handoff_pts", "HND", "Handoff PTS / G", "playtype", true, "perGame", "1試合あたりのハンドオフ得点。", "Handoff points per game."),
    def("offscreen_pts", "OFFS", "Off-screen PTS / G", "playtype", true, "perGame", "1試合あたりのオフスクリーン得点。", "Off-screen points per game."),
    def("oreb_pts", "PUTB", "Putback PTS / G", "playtype", true, "perGame", "1試合あたりのプットバック得点。", "Putback points per game."),
    def("matchup_fg_pct", "M-FG%", "Matchup FG%", "defense", false, "pct", "マッチアップ相手の FG%。低いほど守れている。", "Opponent FG% when guarded. Lower is better."),
    def("matchup_3pt_pct", "M-3P%", "Matchup 3P%", "defense", false, "pct", "マッチアップ相手の 3P%。低いほど守れている。", "Opponent 3P% when guarded. Lower is better."),
    def("opp_2p_pct", "D-2P", "Opponent 2P%", "defense", false, "pct", "相手の 2P%。低いほど守れている。", "Opponent 2P%. Lower is better."),
    def("opp_3p_pct", "D-3P", "Opponent 3P%", "defense", false, "pct", "相手の 3P%。低いほど守れている。", "Opponent 3P%. Lower is better."),
    def("opp_lt6_pct", "D-6ft", "Opp FG% < 6ft", "defense", false, "pct", "6ft 以内の相手 FG%。低いほどリムを守れている。", "Opponent FG% inside 6 feet. Lower is better."),
    def("restricted_fg_pct", "RIM", "Restricted FG%", "shooting", true, "pct", "restricted area の FG%。", "Restricted-area FG%."),
    def("restricted_pts", "R-PTS", "Restricted PTS / G", "shooting", true, "perGame", "restricted からの1試合平均得点。", "Points per game from the restricted area."),
    def("corner3_pct", "C3", "Corner 3%", "shooting", true, "pct", "コーナー3の成功率。", "Corner three percentage."),
    def("corner3_pts", "C3-PTS", "Corner 3 PTS / G", "shooting", true, "perGame", "コーナー3からの1試合平均得点。", "Points per game from corner threes."),
    def("drives", "DRIVE", "Drives / G", "tracking", true, "perGame", "ドライブ数。", "Drives per game."),
    def("drive_pts", "D-PTS", "Drive PTS / G", "tracking", true, "perGame", "ドライブからの1試合平均得点。", "Points per game from drives."),
    def("cns_fg_pct", "C&S", "Catch & Shoot FG%", "tracking", true, "pct", "キャッチ&シュート FG%。", "Catch-and-shoot FG%."),
    def("cns_pts", "CS-PTS", "Catch & Shoot PTS / G", "tracking", true, "perGame", "キャッチ&シュートからの1試合平均得点。", "Points per game from catch-and-shoot."),
    def("pullup_fg_pct", "PULL", "Pull-up FG%", "tracking", true, "pct", "プルアップ FG%。", "Pull-up FG%."),
    def("pullup_pts", "PU-PTS", "Pull-up PTS / G", "tracking", true, "perGame", "プルアップからの1試合平均得点。", "Points per game from pull-ups."),
    def("paint_touches", "PAINT", "Paint touches / G", "tracking", true, "perGame", "ペイントタッチ。", "Paint touches per game."),
    def("paint_touch_pts", "PT-PTS", "Paint-touch PTS / G", "tracking", true, "perGame", "ペイントタッチからの1試合平均得点。", "Points per game from paint touches."),
    def("passes", "PASS", "Passes / G", "tracking", true, "perGame", "パス数。", "Passes per game."),
    def("speed", "SPD", "Avg speed", "tracking", true, "rating", "平均スピード。", "Average speed."),
    def("deflections", "DEFL", "Deflections / G", "hustle", true, "perGame", "ディフレクション。", "Deflections per game."),
    def("charges", "CHG", "Charges drawn / G", "hustle", true, "perGame", "チャージング。", "Charges drawn per game."),
    def("loose_balls", "LOOSE", "Loose balls / G", "hustle", true, "perGame", "ルーズボール。", "Loose balls recovered per game."),
    def("screen_ast", "SCRN", "Screen assists / G", "hustle", true, "perGame", "スクリーンアシスト。", "Screen assists per game."),
    def("contested_shots", "CONT", "Contested shots / G", "hustle", true, "perGame", "コンテストショット。", "Contested shots per game."),
  ];

export function playerAdvancedMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): readonly NbaPlayerAdvancedLeaderMetricDef[] {
  return NBA_PLAYER_ADVANCED_LEADER_METRICS.filter(
    (m) => m.category === category && m.showInLeague
  );
}

export function playerAdvancedMetricChipRows(category: NbaLeagueAdvancedCategory) {
  return chunkForChipGrid(
    playerAdvancedMetricsForCategory(category),
    NBA_LEAGUE_STAT_CHIP_COLS
  );
}

export function playerAdvancedMetricDef(
  id: NbaPlayerAdvancedLeaderMetric
): NbaPlayerAdvancedLeaderMetricDef {
  const found = NBA_PLAYER_ADVANCED_LEADER_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown player advanced metric ${id}`);
  return found;
}

function pct(n: number) {
  return Math.round(n * 1000) / 1000;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function ppp(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildPlayerAdvancedMetricValue(
  metric: NbaPlayerAdvancedLeaderMetric,
  rnd: () => number
): number {
  switch (metric) {
    case "per":
      return round1(8 + rnd() * 22);
    case "ts_pct":
      return pct(0.48 + rnd() * 0.2);
    case "usg":
      return pct(0.12 + rnd() * 0.22);
    case "pie":
      return pct(0.04 + rnd() * 0.14);
    case "ast_pct":
      return pct(0.08 + rnd() * 0.32);
    case "reb_pct":
      return pct(0.05 + rnd() * 0.18);
    case "ast_to":
      return round1(0.8 + rnd() * 3.2);
    case "ortg":
      return round1(98 + rnd() * 28);
    case "drtg":
      return round1(102 + rnd() * 22);
    case "efg_pct":
      return pct(0.42 + rnd() * 0.2);
    case "fta_rate":
      return pct(0.12 + rnd() * 0.28);
    case "oreb_pct":
      return pct(0.02 + rnd() * 0.14);
    case "tov_pct":
      return pct(0.08 + rnd() * 0.12);
    case "pct_pts_3":
      return pct(0.1 + rnd() * 0.4);
    case "pct_pts_paint":
      return pct(0.2 + rnd() * 0.4);
    case "pct_pts_mid":
      return pct(0.06 + rnd() * 0.22);
    case "pct_pts_ft":
      return pct(0.08 + rnd() * 0.18);
    case "pct_pts_fb":
      return pct(0.04 + rnd() * 0.14);
    case "pct_pts_tov":
      return pct(0.06 + rnd() * 0.12);
    case "pts_3":
      return round1(1 + rnd() * 12);
    case "pts_paint":
      return round1(2 + rnd() * 16);
    case "pts_mid":
      return round1(0.6 + rnd() * 8);
    case "pts_ft":
      return round1(0.8 + rnd() * 8);
    case "pts_fb":
      return round1(0.4 + rnd() * 6);
    case "pts_tov":
      return round1(0.6 + rnd() * 6);
    case "clutch_pts":
      return round1(1 + rnd() * 8);
    case "clutch_fg_pct":
      return pct(0.32 + rnd() * 0.22);
    case "clutch_usg":
      return pct(0.14 + rnd() * 0.24);
    case "iso_ppp":
    case "pnr_bh_ppp":
    case "spotup_ppp":
    case "post_ppp":
      return ppp(0.72 + rnd() * 0.45);
    case "pnr_roll_ppp":
    case "trans_ppp":
    case "cut_ppp":
      return ppp(0.95 + rnd() * 0.4);
    case "handoff_ppp":
    case "offscreen_ppp":
      return ppp(0.78 + rnd() * 0.42);
    case "oreb_ppp":
      return ppp(1.05 + rnd() * 0.35);
    case "iso_freq":
    case "pnr_bh_freq":
    case "spotup_freq":
      return pct(0.06 + rnd() * 0.22);
    case "pnr_roll_freq":
    case "trans_freq":
    case "cut_freq":
      return pct(0.04 + rnd() * 0.16);
    case "post_freq":
    case "handoff_freq":
    case "offscreen_freq":
      return pct(0.03 + rnd() * 0.14);
    case "oreb_freq":
      return pct(0.02 + rnd() * 0.1);
    case "iso_pts":
    case "pnr_bh_pts":
    case "spotup_pts":
      return round1(0.6 + rnd() * 9);
    case "pnr_roll_pts":
    case "trans_pts":
    case "cut_pts":
      return round1(0.4 + rnd() * 7);
    case "post_pts":
    case "handoff_pts":
    case "offscreen_pts":
      return round1(0.3 + rnd() * 6);
    case "oreb_pts":
      return round1(0.2 + rnd() * 4);
    case "matchup_fg_pct":
      return pct(0.4 + rnd() * 0.16);
    case "matchup_3pt_pct":
      return pct(0.32 + rnd() * 0.14);
    case "opp_2p_pct":
      return pct(0.46 + rnd() * 0.14);
    case "opp_3p_pct":
      return pct(0.33 + rnd() * 0.12);
    case "opp_lt6_pct":
      return pct(0.55 + rnd() * 0.16);
    case "restricted_fg_pct":
      return pct(0.55 + rnd() * 0.22);
    case "restricted_pts":
      return round1(1.2 + rnd() * 12);
    case "corner3_pct":
      return pct(0.32 + rnd() * 0.18);
    case "corner3_pts":
      return round1(0.3 + rnd() * 5);
    case "drives":
      return round1(1 + rnd() * 14);
    case "drive_pts":
      return round1(0.5 + rnd() * 8);
    case "cns_fg_pct":
      return pct(0.32 + rnd() * 0.16);
    case "cns_pts":
      return round1(0.5 + rnd() * 8);
    case "pullup_fg_pct":
      return pct(0.28 + rnd() * 0.16);
    case "pullup_pts":
      return round1(0.4 + rnd() * 9);
    case "passes":
      return round1(12 + rnd() * 50);
    case "speed":
      return round1(3.8 + rnd() * 1.2);
    case "paint_touches":
      return round1(1 + rnd() * 10);
    case "paint_touch_pts":
      return round1(0.4 + rnd() * 7);
    case "deflections":
      return round1(0.4 + rnd() * 3.2);
    case "charges":
      return round1(rnd() * 0.6);
    case "loose_balls":
      return round1(0.3 + rnd() * 2.2);
    case "screen_ast":
      return round1(0.2 + rnd() * 4);
    case "contested_shots":
      return round1(2 + rnd() * 10);
    default:
      return rnd();
  }
}

export function formatPlayerAdvancedLeaderValue(
  metric: NbaPlayerAdvancedLeaderMetric,
  value: number | null | undefined
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const kind = playerAdvancedMetricDef(metric).kind;
  if (kind === "pct") return `${(value * 100).toFixed(1)}%`;
  if (kind === "ppp") return value.toFixed(2);
  if (kind === "ratio") return value.toFixed(2);
  return value.toFixed(1);
}
