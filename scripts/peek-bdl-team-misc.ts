/**
 * BDL general/misc の生レスポンス確認。
 * npx tsx scripts/peek-bdl-team-misc.ts
 */
import fs from "fs";
import path from "path";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const { fetchBdlTeamSeasonAverages } = await import(
    "../lib/nba/bdl/fetchBdlTeamSeasonAverages"
  );
  const rows = await fetchBdlTeamSeasonAverages({
    seasonYear: 2025,
    type: "misc",
  });
  console.log("count", rows.length);
  const sample = rows.slice(0, 2).map((r) => ({
    team: r.team?.abbreviation ?? r.team?.id,
    keys: Object.keys(r.stats ?? {}).sort(),
    stats: r.stats,
  }));
  console.log(JSON.stringify(sample, null, 2));
  const withPaint = rows.filter(
    (r) =>
      r.stats &&
      (r.stats.opp_points_paint != null ||
        r.stats.points_paint != null ||
        r.stats.opp_pts_paint != null)
  ).length;
  console.log("rows with paint-ish keys", withPaint);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
