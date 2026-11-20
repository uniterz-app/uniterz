import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";

type Line = { playerId: string; min: number; pts: number; reb: number; ast: number; stl: number; blk: number; plusMinus: number; name: string; teamId: string };

async function main() {
  const db = getAdminDb();
  const s = "2026-27";
  const hub = (await db.collection("nbaLeagueHub").doc(s).get()).data() as any;
  const pl: any[] = hub.players;
  const teamWins: Record<string, number> = {};
  for (const t of hub.teams as any[]) teamWins[t.teamId] = t.wins;

  // 今日（JST 11/19）の確定試合の箱
  const dayStart = Date.parse("2026-11-18T15:00:00Z");
  const dayEnd = Date.parse("2026-11-19T15:00:00Z");
  const gs = await db.collection("games").where("season", "==", s).get();
  const today = new Map<string, Line>();
  let todayGames = 0;
  for (const d of gs.docs) {
    const g = d.data() as any;
    if (g.status !== "final" && g.phase !== "final") continue;
    const t = g.startAt?.toDate?.()?.getTime?.() ?? Date.parse(g.startAt);
    if (!(t >= dayStart && t < dayEnd)) continue;
    todayGames++;
    const box = g.liveStats?.box ?? {};
    for (const side of ["away", "home"]) {
      for (const p of (box[side] ?? []) as any[]) {
        if (!p.min) continue;
        const cur = today.get(String(p.playerId)) ?? { playerId: String(p.playerId), min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, plusMinus: 0, name: `${p.firstName} ${p.lastName}`, teamId: side };
        cur.min += p.min; cur.pts += p.pts; cur.reb += p.reb; cur.ast += p.ast; cur.stl += p.stl; cur.blk += p.blk; cur.plusMinus += p.plusMinus ?? 0;
        today.set(String(p.playerId), cur);
      }
    }
  }
  console.log("today final games:", todayGames, "players with minutes:", today.size);

  const rows = pl
    .filter((p) => p.onOff && p.onOff.onMin >= 300)
    .map((p) => {
      const diff = p.onOff.onNet - p.onOff.offNet;
      return { p, diff, wins: teamWins[p.teamId] ?? 0, t: today.get(p.playerId) };
    })
    .sort((a, b) => b.diff - a.diff);

  console.log("RANK | name | team(wins) | onNet-offNet | onNet | offNet | gp | min | pts | reb | ast | stocks | pie | today(min pts reb ast +/-)");
  for (const r of rows.slice(0, 25)) {
    const p = r.p;
    const tt = r.t ? `${r.t.min.toFixed(0)}m ${r.t.pts}p ${r.t.reb}r ${r.t.ast}a ${r.t.plusMinus >= 0 ? "+" : ""}${r.t.plusMinus}` : "-";
    console.log([p.name, String(p.teamId).replace("nba-", "") + `(${r.wins})`, r.diff.toFixed(1), p.onOff.onNet, p.onOff.offNet, p.gp, p.min, p.m.pts, p.m.reb, p.m.ast, p.m.stocks, p.m.pie?.toFixed?.(3), tt].join(" | "));
  }
}

main().then(() => process.exit(0));
