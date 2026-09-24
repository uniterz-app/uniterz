/**
 * 引退/ロスター外の確認用: BDL で選手を検索。
 *   npx tsx scripts/lookup-nba-players-bdl.ts "Carmelo Anthony"
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
  const key =
    process.env.BALLDONTLIE_API_KEY?.trim() ||
    process.env.BDL_API_KEY?.trim() ||
    "";
  if (!key) {
    console.error("BALLDONTLIE_API_KEY missing");
    process.exit(1);
  }
  const queries = process.argv.slice(2);
  const list =
    queries.length > 0
      ? queries
      : [
          "Carmelo Anthony",
          "Vince Carter",
          "Tony Parker",
          "Dirk Nowitzki",
          "Pau Gasol",
          "Manu Ginobili",
          "Kawhi Leonard",
        ];

  for (const q of list) {
    const url = new URL("https://api.balldontlie.io/nba/v1/players");
    url.searchParams.set("search", q);
    url.searchParams.set("per_page", "5");
    const res = await fetch(url, {
      headers: { Authorization: key },
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: Array<{
        id: number;
        first_name?: string;
        last_name?: string;
        position?: string;
        team?: { abbreviation?: string; full_name?: string } | null;
      }>;
      error?: string;
    };
    if (!res.ok) {
      console.log(q, "ERR", res.status, body.error ?? "");
      continue;
    }
    for (const p of body.data ?? []) {
      console.log(
        JSON.stringify({
          query: q,
          playerId: String(p.id),
          name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
          position: p.position || null,
          team: p.team?.abbreviation ?? null,
          teamName: p.team?.full_name ?? null,
        })
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
