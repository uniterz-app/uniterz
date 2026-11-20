/**
 * LEAGUE スタイルマップ / トレンドのダンプ（Markdown）を、Firestore `nbaLeagueHub/{season}` から作る。
 * 読み取りだけ（BDL なし）。ハブを作り直したあとに実行する。
 *
 *   npx tsx scripts/build-nba-style-map-trend-dump.ts               # 2026-27 → docs/nba-style-map-trend-dump-2026-27.md
 *   npx tsx scripts/build-nba-style-map-trend-dump.ts 2026-27 out.md
 *
 * 認証: `.env.local` の FIREBASE_*
 */
import "./_loadAdminEnv";
import fs from "fs";
import path from "path";
import { getAdminDb } from "../lib/firebaseAdmin";
import { LEAGUE_HUB_PLAYER_SCATTER_PRESETS } from "../lib/nba/leagueHub/leagueHubScatterPresets";

type Num = number | null | undefined;
type Player = {
  playerId: string;
  name: string;
  teamId: string;
  gp: number;
  min: number;
  m: Record<string, Num>;
};

/** 各マップの「TOP選定」（旧ダンプの見出しに合わせる） */
const VOLUME: Record<string, { metric: string; label: string }> = {
  three: { metric: "fg3a", label: "3P 試投" },
  ace: { metric: "pts", label: "得点" },
  shotType: { metric: "fga", label: "FG 試投" },
  source: { metric: "pts", label: "得点" },
  paint: { metric: "pts_paint", label: "ペイント得点" },
  drive: { metric: "drives", label: "ドライブ" },
  driveFinish: { metric: "drives", label: "ドライブ" },
  driveDish: { metric: "drives", label: "ドライブ" },
  foul: { metric: "fta", label: "FT 試投" },
  playmaking: { metric: "ast", label: "アシスト" },
  passCreate: { metric: "potential_ast", label: "ポテンシャル AST" },
  creation: { metric: "fga", label: "FG 試投" },
  defense: { metric: "def_activity", label: "守備の手数" },
  hustle: { metric: "def_activity", label: "守備の手数" },
  contestSplit: { metric: "contested_shots", label: "コンテスト" },
  shotAllow: { metric: "min", label: "出場時間" },
  aceStop: { metric: "ace_guard_min", label: "エースを守った時間" },
  toughStop: { metric: "tough_guard_min", label: "上位3人を守った時間" },
  fouls: { metric: "min", label: "出場時間" },
  touch: { metric: "touches", label: "タッチ" },
  mileage: { metric: "min", label: "出場時間" },
  onCourt: { metric: "min", label: "出場時間" },
  clutch: { metric: "clutch_pts", label: "クラッチ得点" },
  consistency: { metric: "pts", label: "得点" },
  glass: { metric: "reb", label: "リバウンド" },
  rebContest: { metric: "reb", label: "リバウンド" },
  boxOut: { metric: "reb", label: "リバウンド" },
  rebChance: { metric: "reb_chances", label: "リバウンド" },
};

const GROUPS: Array<{ label: string; ids: string[] }> = [
  { label: "SCORING", ids: ["three", "ace", "shotType", "source"] },
  { label: "ATTACK", ids: ["paint", "drive", "driveFinish", "driveDish", "foul", "playmaking", "passCreate", "creation"] },
  { label: "DEFENSE", ids: ["defense", "hustle", "contestSplit", "shotAllow", "aceStop", "toughStop", "fouls"] },
  { label: "BALL", ids: ["touch", "mileage"] },
  { label: "IMPACT", ids: ["onCourt", "clutch", "consistency"] },
  { label: "REB", ids: ["glass", "rebContest", "boxOut", "rebChance"] },
];

const MIN_GP = 5;
const MIN_MIN = 12;
const TOP = 30;

function teamName(teamId: string): string {
  return teamId.replace(/^nba-/, "");
}

function fmt(format: string, v: number): string {
  if (format === "pct") return `${(v * 100).toFixed(1)}%`;
  if (format === "ppp") return v.toFixed(2);
  return v.toFixed(1);
}

function num(v: Num): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function main() {
  const season = process.argv[2] ?? "2026-27";
  const outPath =
    process.argv[3] ??
    path.join(process.cwd(), "docs", `nba-style-map-trend-dump-${season}.md`);

  return (async () => {
    const db = getAdminDb();
    const hub = (await db.collection("nbaLeagueHub").doc(season).get()).data() as any;
    if (!hub) throw new Error(`nbaLeagueHub/${season} がありません`);
    const builtAt = new Date(hub.builtAtMs).toISOString();
    const players: Player[] = (hub.players as Player[]).filter(
      (p) => p.gp >= MIN_GP && p.min >= MIN_MIN
    );
    const byId = new Map(players.map((p) => [p.playerId, p]));
    const lines: string[] = [];
    const push = (s = "") => lines.push(s);

    push("# UNITERZ スタイルマップ / トレンド全出し");
    push(`シーズン: ${season}`);
    push(`取得: ${builtAt}（nbaLeagueHub の作成時刻）`);
    push(`選手プール: hub ${hub.players.length} 人（gp≥${MIN_GP}・min≥${MIN_MIN} で各マップの volume 上位 ${TOP}）`);
    push("※開幕直後のため数字は振れやすい");
    push();

    // --- ace / tough の台本向けハイライト
    const aceRows = players
      .map((p) => ({ p, sup: num(p.m.ace_suppress), mins: num(p.m.ace_guard_min) }))
      .filter((r) => r.sup !== null && r.mins !== null && r.mins >= 20)
      .sort((a, b) => (b.sup as number) - (a.sup as number));
    push("## 台本向けハイライト（エースストッパー）");
    push("suppress = 相手エースの普段の eFG% − 守ったときの FG%。正かつ大きいほど抑えている。");
    push("エースを 20 分以上守った選手の suppress 順位:");
    aceRows.slice(0, 10).forEach((r, i) =>
      push(`${i + 1}. ${r.p.name} (${teamName(r.p.teamId)}) ${fmt("pct", r.sup as number)}（${(r.mins as number).toFixed(1)}分）`)
    );
    push();

    // --- 各プリセット
    const presetById = new Map(LEAGUE_HUB_PLAYER_SCATTER_PRESETS.map((p) => [p.id, p]));
    const renderPreset = (id: string, heading: string, asList: boolean) => {
      const preset = presetById.get(id);
      const vol = VOLUME[id];
      if (!preset || !vol) return;
      const rows = players
        .map((p) => ({ p, x: num(p.m[preset.x.metric]), y: num(p.m[preset.y.metric]), v: num(p.m[vol.metric]) }))
        .filter((r) => r.x !== null && r.y !== null && r.v !== null && (r.v as number) > 0)
        .sort((a, b) => (b.v as number) - (a.v as number))
        .slice(0, TOP);
      push(`#### ${heading}`);
      push(`ヒント: ${preset.hint.ja}`);
      push(`X: ${preset.x.label.ja} · Y: ${preset.y.label.ja}${preset.y.invert ? "（上ほど少ない）" : ""}${preset.x.invert ? " [x 反転]" : ""} · TOP選定: ${vol.label}`);
      push(`象限: TR=${preset.quadrants.tr.ja} / TL=${preset.quadrants.tl.ja} / BR=${preset.quadrants.br.ja} / BL=${preset.quadrants.bl.ja}`);
      if (asList) {
        rows.forEach((r, i) =>
          push(`${i + 1}. ${r.p.name} (${teamName(r.p.teamId)}) ${vol.label}=${fmt(vol.metric.includes("pct") ? "pct" : "one", r.v as number)} / ${fmt(preset.y.format, r.y as number)}`)
        );
      } else {
        push(`| # | 選手 | チーム | ${vol.label} | ${preset.x.label.ja} | ${preset.y.label.ja} |`);
        push("|---|---|---|---|---|---|");
        rows.forEach((r, i) =>
          push(`| ${i + 1} | ${r.p.name} | ${teamName(r.p.teamId)} | ${fmt("one", r.v as number)} | ${fmt(preset.x.format, r.x as number)} | ${fmt(preset.y.format, r.y as number)} |`)
        );
      }
      push();
    };

    push("## 注目: エースストッパー（aceStop）");
    renderPreset("aceStop", "ACE STOPPER (`aceStop`)", true);
    push("## 注目: タフなマッチアップ（toughStop）");
    renderPreset("toughStop", "TOUGH MATCHUPS (`toughStop`)", true);

    push("## スタイルマップ全プリセット TOP30");
    for (const g of GROUPS) {
      push(`### グループ: ${g.label}`);
      push();
      for (const id of g.ids) {
        const preset = presetById.get(id);
        if (!preset) continue;
        renderPreset(id, `${preset.label.ja} / ${preset.label.en} (\`${id}\`)`, false);
      }
    }

    // --- TREND
    const hot = (hub.hot as any[]).slice(0, 10);
    const cold = (hub.cold as any[]).slice(0, 10);
    push("## TREND: HOT");
    push("直近 vs それ以前の得点差（正=HOT）");
    push("| # | 選手 | チーム | 直近 | 以前 | 差 |");
    push("|---|---|---|---|---|---|");
    hot.forEach((r, i) => push(`| ${i + 1} | ${r.name} | ${teamName(r.teamId)} | ${r.recent} | ${r.before} | ${r.diff > 0 ? "+" : ""}${r.diff} |`));
    push();
    push("## TREND: COLD");
    push("| # | 選手 | チーム | 直近 | 以前 | 差 |");
    push("|---|---|---|---|---|---|");
    cold.forEach((r, i) => push(`| ${i + 1} | ${r.name} | ${teamName(r.teamId)} | ${r.recent} | ${r.before} | ${r.diff} |`));
    push();

    // --- VS LAST SEASON（hub.ptsDelta の上がった / 下がった）
    const up = (hub.ptsDelta?.up ?? []).slice(0, 10);
    const down = (hub.ptsDelta?.down ?? []).slice(0, 10);
    push("## VS LAST SEASON: UP");
    push("| # | 選手 | チーム | 前季 | 今季 | 差 |");
    push("|---|---|---|---|---|---|");
    up.forEach((r: any, i: number) => push(`| ${i + 1} | ${r.name} | ${teamName(r.teamId)} | ${r.prevPts} | ${r.pts} | +${r.diff.toFixed(1)} |`));
    push();
    push("## VS LAST SEASON: DOWN");
    push("| # | 選手 | チーム | 前季 | 今季 | 差 |");
    push("|---|---|---|---|---|---|");
    down.forEach((r: any, i: number) => push(`| ${i + 1} | ${r.name} | ${teamName(r.teamId)} | ${r.prevPts} | ${r.pts} | ${r.diff.toFixed(1)} |`));
    push();

    // --- SPLITS（hub.playerSplits: a = home / b = away / diff = a − b）
    const splits = hub.playerSplits as { home: any[]; away: any[] };
    const homeUp = [...splits.home].sort((x, y) => y.diff - x.diff).slice(0, 10);
    const awayUp = [...splits.away].sort((x, y) => x.diff - y.diff).slice(0, 10);
    push("## SPLITS: ホームで得点アップ");
    homeUp.forEach((r, i) => push(`${i + 1}. ${r.name} (${teamName(r.teamId)}) home=${r.a} away=${r.b} diff=${r.diff > 0 ? "+" : ""}${r.diff}`));
    push();
    push("## SPLITS: アウェーで得点アップ（homeが低い）");
    awayUp.forEach((r, i) => push(`${i + 1}. ${r.name} (${teamName(r.teamId)}) home=${r.a} away=${r.b} diff=${r.diff}`));
    push();

    fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
    console.log(`wrote ${outPath} (${lines.length} lines), built ${builtAt}`);
    void byId;
  })();
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
