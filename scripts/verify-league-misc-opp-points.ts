/**
 * 一時確認: 2025-26 league team misc 失点が載っているか。
 * npx tsx scripts/verify-league-misc-opp-points.ts
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
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { loadLeagueTeamStatsSnapshot } = await import(
    "../lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot"
  );
  const snap = await loadLeagueTeamStatsSnapshot(getAdminDb(), "2025-26");
  const sample = (r: Record<string, unknown> | undefined) =>
    r
      ? {
          team: r.teamId,
          ptsPaint: r.ptsPaint,
          oppPtsPaint: r.oppPtsPaint,
          ptsFb: r.ptsFb,
          oppPtsFb: r.oppPtsFb,
          ptsTov: r.ptsTov,
          oppPtsOffTov: r.oppPtsOffTov,
          ptsSecondChance: r.ptsSecondChance,
          oppPtsSecondChance: r.oppPtsSecondChance,
        }
      : null;
  const heat = snap.bundle.season.find((r) => r.teamId === "nba-heat");
  const tor = snap.bundle.season.find((r) => r.teamId === "nba-raptors");
  const withOpp = snap.bundle.season.filter(
    (r) => typeof r.oppPtsPaint === "number" && r.oppPtsPaint > 0
  ).length;
  console.log(
    JSON.stringify(
      {
        source: snap.source,
        teams: snap.bundle.season.length,
        withOppPtsPaint: withOpp,
        heat: sample(heat as unknown as Record<string, unknown>),
        tor: sample(tor as unknown as Record<string, unknown>),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
