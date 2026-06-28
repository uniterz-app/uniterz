/**
 * 実行:
 *   npx tsx scripts/seed-wc-2026-knockout-r32.ts
 *   npx tsx scripts/seed-wc-2026-knockout-r32.ts --dry-run
 *
 * 前提: service-account.json がプロジェクトルートに存在
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore
import adminPkg from "firebase-admin";
import { WC_2026_KNOCKOUT_ADVANCEMENT } from "../lib/wc/wc-knockout-advancement-2026";
import {
  WC_2026_R32_CONFIRMED_MATCHES,
  wcKnockoutGameId,
} from "../lib/wc/wc-knockout-r32-confirmed";
import { resolveWcMatchParticipants } from "../lib/wc/wc-knockout-bracket-utils";
import type { WcBracketState } from "../lib/wc/wc-knockout-bracket";
import { getWcKnockoutMatch } from "../lib/wc/wc-knockout-bracket";
import {
  lookupWcTeamDisplay,
  wcTeamIdFromIso3,
} from "../lib/wc/wc-team-display";
import { lookupWcBroadcastLabels } from "../lib/wc/wcBroadcastLabels";

const admin = adminPkg;
const dryRun = process.argv.includes("--dry-run");

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

const SEASON = "2025-26";
const EMPTY_BRACKET: WcBracketState = {};

function isoToTeamRef(iso3: string) {
  const names = lookupWcTeamDisplay(iso3);
  if (!names) throw new Error(`unknown team iso3: ${iso3}`);
  return {
    teamId: wcTeamIdFromIso3(iso3),
    name: names.en,
    nameJa: names.ja,
  };
}

function validateConfirmedMatches() {
  let ok = 0;
  for (const m of WC_2026_R32_CONFIRMED_MATCHES) {
    const def = getWcKnockoutMatch(m.matchId);
    if (!def) throw new Error(`missing bracket def for ${m.matchId}`);

    const resolved = resolveWcMatchParticipants(
      m.matchId,
      EMPTY_BRACKET,
      WC_2026_KNOCKOUT_ADVANCEMENT
    );
    if (!resolved) throw new Error(`${m.matchId}: could not resolve participants`);
    const [home, away] = resolved;
    const expectedHome = wcTeamIdFromIso3(m.homeIso3);
    const expectedAway = wcTeamIdFromIso3(m.awayIso3);

    if (home?.teamId !== expectedHome || away?.teamId !== expectedAway) {
      throw new Error(
        `${m.matchId} mismatch: expected ${expectedHome} vs ${expectedAway}, got ${home?.teamId ?? "?"} vs ${away?.teamId ?? "?"}`
      );
    }
    ok++;
  }
  console.log(`  validated ${ok}/${WC_2026_R32_CONFIRMED_MATCHES.length} R32 matchups`);
}

(async () => {
  console.log(
    `=== WC 2026 knockout R32 seed START (${WC_2026_R32_CONFIRMED_MATCHES.length} matches)${dryRun ? " [DRY RUN]" : ""} ===`
  );

  validateConfirmedMatches();

  if (dryRun) {
    for (const m of WC_2026_R32_CONFIRMED_MATCHES) {
      const id = wcKnockoutGameId(m.matchId);
      console.log(
        `  would seed: ${id}  ${m.homeIso3} vs ${m.awayIso3}  @ ${m.venue}  (${m.startAtIso})`
      );
    }
    console.log(`  would write wcKnockoutAdvancement/${SEASON}`);
    console.log("=== DRY RUN complete ===");
    process.exit(0);
  }

  let batch = db.batch();
  let pending = 0;

  for (const m of WC_2026_R32_CONFIRMED_MATCHES) {
    const id = wcKnockoutGameId(m.matchId);
    const home = isoToTeamRef(m.homeIso3);
    const away = isoToTeamRef(m.awayIso3);
    const startAt = Timestamp.fromDate(new Date(m.startAtIso));
    const broadcastLabels = lookupWcBroadcastLabels(id);

    batch.set(
      db.collection("games").doc(id),
      {
        id,
        league: "wc",
        season: SEASON,
        status: "scheduled",
        startAt,
        startAtJst: startAt,
        venue: m.venue,
        roundLabel: "Round of 32",
        wcStage: "main",
        knockout: true,
        wcKnockoutMatchId: m.matchId,
        ...(broadcastLabels.length > 0 ? { broadcastLabels } : {}),
        home,
        away,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        final: false,
        homeScore: null,
        awayScore: null,
        regulationEtScore: null,
        advancingTeamId: null,
        resultComputedAt: null,
        score: null,
        liveMeta: null,
        finalMeta: null,
        goalScorers: [],
      },
      { merge: true }
    );
    pending++;
    console.log(`  queued: ${id}  ${home.name} vs ${away.name}`);

    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  const adv = WC_2026_KNOCKOUT_ADVANCEMENT;
  await db
    .collection("wcKnockoutAdvancement")
    .doc(SEASON)
    .set(
      {
        season: SEASON,
        source: "group-stage-results-2026-06-28-final",
        updatedAt: FieldValue.serverTimestamp(),
        groupWinners: adv.groupWinners,
        groupRunnersUp: adv.groupRunnersUp,
        groupThirdPlaces: adv.groupThirdPlaces,
        advancingThirdPlaceGroups: [...adv.advancingThirdPlaceGroups],
      },
      { merge: true }
    );
  console.log(`  wrote wcKnockoutAdvancement/${SEASON}`);

  console.log("=== WC 2026 knockout R32 seed COMPLETED ===");
  process.exit(0);
})().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});
