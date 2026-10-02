/**
 * Inspect one game's proInsightNarrative + MATCHUP facts.
 * npx tsx scripts/inspect-pro-insight-game.ts nba-bdl-21717897
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
  const gameId = process.argv[2] || "nba-bdl-21717897";
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const snap = await getAdminDb().collection("games").doc(gameId).get();
  if (!snap.exists) {
    console.error("missing", gameId);
    process.exit(1);
  }
  const data = snap.data()!;
  const n = data.proInsightNarrative as Record<string, unknown> | undefined;
  const f = data.proInsightFacts as {
    phase?: string;
    sections?: Record<string, Array<Record<string, unknown>>>;
  };
  const sections = (n?.sections as Array<{ kind: string; items: Array<{ body?: { ja?: string }; evidence?: Array<{ ja?: string }> }> }>) ?? [];
  console.log(
    JSON.stringify(
      {
        source: n?.source,
        model: n?.model,
        phase: f?.phase,
        narrative: sections.map((s) => ({
          kind: s.kind,
          items: (s.items ?? []).map((it) => ({
            ja: it.body?.ja,
            evidence: it.evidence?.[0]?.ja,
          })),
        })),
        matchupFacts: (f?.sections?.MATCHUP ?? []).map((x) => ({
          id: x.id,
          kind: x.kind,
          mode: x.mode,
          hintEn: x.hintEn,
          players: x.players,
          metrics: x.metrics,
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
