/**
 * アプリ公開前（Web 時代）の登録ユーザー全員に Season Zero — Web Era バッジを付与する。
 * master_badges の登録も同時に行う（merge なので再実行可）。
 * 画像は public/badges-season-zero/ に配置済み前提。
 *
 *   DRY_RUN=1 npx tsx scripts/grant-season-zero-web-era-badge.ts
 *   npx tsx scripts/grant-season-zero-web-era-badge.ts
 *
 * 認証: `.env.local` の FIREBASE_*
 */
import fs from "fs";
import path from "path";
import { FieldValue } from "firebase-admin/firestore";

const BADGE_ID = "season_zero_web_era";

const MASTER = {
  title: "Season Zero — Web Era",
  description:
    "アプリ公開前の Web 版で予想に参加してくれたユーザーに贈られる記念バッジ。UNITERZ の“シーズン 0”を一緒につくってくれた証。",
  titleEn: "Season Zero — Web Era",
  descriptionEn:
    "A commemorative badge for players who joined UNITERZ on the web before the app launched. Proof you helped build Season Zero.",
  icon: "/badges-season-zero/seasonZeroWebEra.png",
  league: "nba",
  type: "commemorative",
};

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

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

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { stampMasterBadgeParticipantCount } = await import(
    "../lib/badges/server/stampMasterBadgeParticipantCount"
  );
  const db = getAdminDb();

  console.log(`=== grant ${BADGE_ID} ===`);
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const users = await db.collection("users").select().get();
  const uids = users.docs.map((d) => d.id);
  console.log(`users: ${uids.length}`);

  if (DRY_RUN) {
    console.log(`dry-run: ${uids.length} user(s) would receive ${BADGE_ID}`);
    process.exit(0);
  }

  await db.collection("master_badges").doc(BADGE_ID).set(MASTER, { merge: true });

  let batch = db.batch();
  let ops = 0;
  for (const uid of uids) {
    batch.set(
      db.collection("user_badges").doc(uid).collection("badges").doc(BADGE_ID),
      {
        badgeId: BADGE_ID,
        grantedAt: FieldValue.serverTimestamp(),
        meta: {
          participantCount: uids.length,
          source: "season_zero_web_era_grant",
        },
      },
      { merge: true }
    );
    ops++;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  await stampMasterBadgeParticipantCount(db, [BADGE_ID], uids.length);

  console.log(`granted: ${uids.length}`);
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
