/**
 * Pro Insight スモーク — プレシーズン TOR vs MIA を前季（opening）データで Chat 生成。
 *
 *   npx tsx scripts/smoke-pro-insight-tor-mia.ts
 *
 * 要: .env.local の FIREBASE_* / OPENAI_API_KEY
 * 通常 cron はプレシーズン対象外のまま。このスクリプトだけ includePreseason。
 */
import fs from "fs";
import path from "path";
import { Timestamp } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
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

const TOR = "nba-raptors";
const MIA = "nba-heat";

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { submitProInsightNarrativeBatch } = await import(
    "../lib/nba/insights/proInsightLlm/ingestProInsightNarrativeBatch"
  );

  console.log(
    `seasonKey=${CURRENT_NBA_SEASON_KEY} (opening phase → prior 2025-26 facts)`
  );

  const db = getAdminDb();
  const from = Timestamp.fromMillis(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const to = Timestamp.fromMillis(Date.now() + 28 * 24 * 60 * 60 * 1000);
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", from)
    .where("startAtJst", "<=", to)
    .orderBy("startAtJst", "asc")
    .limit(300)
    .get();

  const matches: Array<{ id: string; label: string }> = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const phase = String(d.seasonPhase ?? "").toLowerCase();
    if (phase && phase !== "preseason" && phase !== "pre") continue;
    const home = teamIdFromSide(d.home, d.homeTeamId);
    const away = teamIdFromSide(d.away, d.awayTeamId);
    const pair = new Set([home, away]);
    if (!(pair.has(TOR) && pair.has(MIA))) continue;
    matches.push({
      id: doc.id,
      label: `${away} @ ${home} phase=${phase || "?"} status=${String(d.status ?? "?")}`,
    });
  }

  if (matches.length === 0) {
    console.error("TOR vs MIA preseason game not found in window");
    process.exit(1);
  }
  for (const m of matches) console.log(`candidate ${m.id}  ${m.label}`);

  const target = [matches[matches.length - 1]!.id];
  console.log(`generating for ${target[0]} …`);

  const result = await submitProInsightNarrativeBatch(db, {
    gameIds: target,
    includePreseason: true,
    syncChat: true,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok || result.gamesPrepared === 0) process.exit(1);
  console.log(`ok — Pro Insight narrative written for gameId=${target[0]}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
