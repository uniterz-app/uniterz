/**
 * 2026-27 ルーキー（draftYear=2026） vs curated ROLE 差分。
 * npx tsx scripts/list-rookies-missing-roles.ts
 */
import fs from "fs";
import path from "path";
import { loadTeamRostersSnapshot } from "../lib/nba/teamRosters/loadTeamRostersSnapshot";
import { NBA_CURATED_PLAYER_ROLES } from "../lib/nba/detailInsights/nbaCuratedPlayerRoles";
import { nbaSeasonRookieDraftYear } from "../lib/predict/seasonAwardsCatalogFromRosters";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

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
  const seasonKey = (process.argv[2] ?? CURRENT_NBA_SEASON_KEY).trim();
  const rookieYear = nbaSeasonRookieDraftYear(seasonKey);
  if (rookieYear == null) {
    console.error("no rookie draft year for", seasonKey);
    process.exit(1);
  }

  const snap = await loadTeamRostersSnapshot(getAdminDb(), seasonKey);
  const teams = snap.bundle?.teams ?? {};

  const curated = new Set<string>();
  for (const season of Object.values(NBA_CURATED_PLAYER_ROLES)) {
    for (const entries of Object.values(season)) {
      for (const e of entries) curated.add(String(e.playerId));
    }
  }

  type Row = {
    id: string;
    name: string;
    teamId: string;
    draftRound: number | null;
    draftNumber: number | null;
    hasRole: boolean;
  };
  const rookies: Row[] = [];
  for (const [teamId, team] of Object.entries(teams)) {
    for (const p of team.players) {
      if (p.draftYear !== rookieYear) continue;
      const id = String(p.id);
      const name =
        `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || String(p.id);
      rookies.push({
        id,
        name,
        teamId,
        draftRound: p.draftRound ?? null,
        draftNumber: p.draftNumber ?? null,
        hasRole: curated.has(id),
      });
    }
  }

  rookies.sort(
    (a, b) =>
      (a.draftRound ?? 99) - (b.draftRound ?? 99) ||
      (a.draftNumber ?? 999) - (b.draftNumber ?? 999) ||
      a.name.localeCompare(b.name)
  );

  const missing = rookies.filter((r) => !r.hasRole);
  const withRole = rookies.filter((r) => r.hasRole);

  console.log(
    JSON.stringify(
      {
        seasonKey,
        rookieDraftYear: rookieYear,
        totalRookiesOnRoster: rookies.length,
        withRoleCount: withRole.length,
        missingRoleCount: missing.length,
        withRole: withRole.map((r) => ({
          name: r.name,
          teamId: r.teamId,
          pick: r.draftNumber,
        })),
        missing: missing.map((r) => ({
          name: r.name,
          teamId: r.teamId,
          playerId: r.id,
          round: r.draftRound,
          pick: r.draftNumber,
        })),
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
