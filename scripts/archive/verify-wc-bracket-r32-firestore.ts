/**
 * Firestore の advancement + R32 games がブラケット表示と一致するか確認
 *   npx tsx scripts/verify-wc-bracket-r32-firestore.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import { parseWcKnockoutAdvancementDoc } from "../lib/wc/wc-knockout-advancement-store";
import { resolveWcMatchParticipants } from "../lib/wc/wc-knockout-bracket-utils";
import { getWcMatchContestants } from "../lib/wc/wc-bracket-display";
import { WC_2026_R32_CONFIRMED_MATCHES } from "../lib/wc/wc-knockout-r32-confirmed";

const admin = adminPkg as typeof import("firebase-admin");
const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf8"))),
});

const db = admin.firestore();
const SEASON = "2025-26";

(async () => {
  const advSnap = await db.doc(`wcKnockoutAdvancement/${SEASON}`).get();
  const adv = parseWcKnockoutAdvancementDoc(advSnap.data());
  if (!adv) {
    console.error("FAIL: wcKnockoutAdvancement parse failed");
    process.exit(1);
  }

  console.log("Firestore advancement:");
  console.log("  groupRunnersUp.J:", adv.groupRunnersUp.J ?? "(missing)");
  console.log(
    "  runnersUp groups:",
    Object.keys(adv.groupRunnersUp).sort().join(", ")
  );

  let ok = true;
  for (const m of WC_2026_R32_CONFIRMED_MATCHES) {
    const gameId = `wc-2026-ko-${m.matchId}`;
    const gameSnap = await db.doc(`games/${gameId}`).get();
    if (!gameSnap.exists) {
      console.error(`FAIL: missing games/${gameId}`);
      ok = false;
      continue;
    }
    const g = gameSnap.data()!;
    const gameHome = String(g.homeTeamId ?? g.home?.teamId ?? "");
    const gameAway = String(g.awayTeamId ?? g.away?.teamId ?? "");

    const resolved = resolveWcMatchParticipants(m.matchId, {}, adv);
    const [rh, ra] = resolved ?? [null, null];
    const display = getWcMatchContestants(
      m.matchId as Parameters<typeof getWcMatchContestants>[0],
      {},
      adv
    );

    const expectHome = `wc-${m.homeIso3}`;
    const expectAway = `wc-${m.awayIso3}`;

    const match =
      gameHome === expectHome &&
      gameAway === expectAway &&
      rh?.teamId === expectHome &&
      ra?.teamId === expectAway &&
      display[0].teamId === expectHome &&
      display[1].teamId === expectAway;

    if (!match) {
      console.error(`FAIL ${m.matchId}:`, {
        game: `${gameHome} vs ${gameAway}`,
        adv: `${rh?.teamId} vs ${ra?.teamId}`,
        display: `${display[0].teamId} vs ${display[1].teamId}`,
        expect: `${expectHome} vs ${expectAway}`,
      });
      ok = false;
    } else {
      console.log(`OK ${m.matchId}: ${g.home?.name} vs ${g.away?.name}`);
    }
  }

  console.log(ok ? "\nALL 16 R32 — Firestore ↔ advancement ↔ bracket display aligned" : "\nISSUES FOUND");
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
