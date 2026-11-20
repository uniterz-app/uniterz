import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { submitProInsightNarrativeBatch } from "../lib/nba/insights/proInsightLlm/ingestProInsightNarrativeBatch";

const IDS = process.argv.slice(2);

async function main() {
  const db = getAdminDb();
  for (const id of IDS) {
    const t0 = Date.now();
    const r = await submitProInsightNarrativeBatch(db, { gameIds: [id], syncChat: true });
    console.log(id, JSON.stringify({ ok: r.ok, prepared: r.gamesPrepared, fallback: r.writtenFallback, errors: r.errors }), `${Math.round((Date.now() - t0) / 1000)}s`);
  }
}

main().then(() => process.exit(0));
