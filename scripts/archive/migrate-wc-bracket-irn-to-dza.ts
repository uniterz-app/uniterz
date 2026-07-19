/**
 * wcBrackets 内の wc-irn（イラン）予想を wc-dza（アルジェリア）に置換する。
 *
 *   npx tsx scripts/migrate-wc-bracket-irn-to-dza.ts --dry-run
 *   npx tsx scripts/migrate-wc-bracket-irn-to-dza.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import { getWcBracketChampionPick } from "../lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "../lib/wc/wc-knockout-bracket";

const admin = adminPkg as typeof import("firebase-admin");
const dryRun = process.argv.includes("--dry-run");

const FROM = "wc-irn";
const TO = "wc-dza";
const SEASON = "2025-26";
const M85 = "M85";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf8"))),
});

const db = admin.firestore();

type BracketDoc = {
  uid?: string;
  season?: string;
  bracket?: WcBracketState;
  championPick?: string | null;
  isSubmitted?: boolean;
};

function bracketHasTeam(bracket: WcBracketState, teamId: string): boolean {
  return Object.values(bracket).some((pick) => pick?.winner?.trim() === teamId);
}

function replaceTeamInBracket(
  bracket: WcBracketState,
  from: string,
  to: string
): { next: WcBracketState; changedMatches: string[] } {
  const next: WcBracketState = { ...bracket };
  const changedMatches: string[] = [];

  for (const [matchId, pick] of Object.entries(bracket)) {
    if (pick?.winner?.trim() !== from) continue;
    next[matchId as keyof WcBracketState] = { winner: to };
    changedMatches.push(matchId);
  }

  return { next, changedMatches };
}

(async () => {
  console.log(
    `=== WC bracket ${FROM} → ${TO}${dryRun ? " [DRY RUN]" : ""} ===`
  );

  const snap = await db.collection("wcBrackets").get();
  const seasonDocs = snap.docs.filter((d) => d.id.startsWith(`${SEASON}_`));

  let withIranInBracket = 0;
  let withIranM85 = 0;
  let withIranChampion = 0;
  let toUpdate = 0;
  const samples: string[] = [];

  for (const docSnap of seasonDocs) {
    const data = docSnap.data() as BracketDoc;
    const bracket = (data.bracket ?? {}) as WcBracketState;
    const hasAny = bracketHasTeam(bracket, FROM);
    const hasM85 = bracket[M85]?.winner?.trim() === FROM;
    const hasChampion =
      String(data.championPick ?? "").trim() === FROM ||
      getWcBracketChampionPick(bracket) === FROM;

    if (!hasAny && !hasChampion) continue;

    if (hasAny) withIranInBracket += 1;
    if (hasM85) withIranM85 += 1;
    if (hasChampion) withIranChampion += 1;

    const { next, changedMatches } = replaceTeamInBracket(bracket, FROM, TO);
    const nextChampion = getWcBracketChampionPick(next);

    if (samples.length < 8) {
      samples.push(
        `${docSnap.id} uid=${data.uid ?? "?"} M85=${hasM85 ? FROM : "-"} matches=[${changedMatches.join(",")}] champion=${hasChampion ? FROM : "-"}`
      );
    }

    if (dryRun) {
      toUpdate += 1;
      continue;
    }

    await docSnap.ref.update({
      bracket: next,
      championPick: nextChampion,
    });
    toUpdate += 1;
  }

  console.log(`season: ${SEASON}`);
  console.log(`total submitted brackets: ${seasonDocs.length}`);
  console.log(`${FROM} anywhere in bracket picks: ${withIranInBracket}`);
  console.log(`${FROM} as ${M85} winner: ${withIranM85}`);
  console.log(`${FROM} as champion pick: ${withIranChampion}`);
  console.log(`docs to update: ${toUpdate}`);

  if (samples.length > 0) {
    console.log("\nSample affected docs:");
    for (const line of samples) console.log(`  ${line}`);
  }

  console.log(dryRun ? "\n=== DRY RUN complete ===" : "\n=== Migration complete ===");
})().catch((e) => {
  console.error("migrate failed:", e);
  process.exit(1);
});
