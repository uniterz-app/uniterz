/**
 * SEASON ZERO（Web Era）バッジを master_badges に登録する。
 * 画像は public/season-zero/season-zero.png。
 *
 *   npm run badges:season-zero:seed
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const BADGE = {
  id: "season_zero_web",
  title: "SEASON ZERO",
  titleEn: "SEASON ZERO",
  description: "Web版で予想を投稿してくれた人に贈る、最初のシーズンの証。",
  descriptionEn:
    "Awarded to everyone who posted a prediction on the UNITERZ website. The mark of Season Zero.",
  icon: "/season-zero/season-zero.png",
};

async function seed() {
  console.log("=== seed SEASON ZERO web badge ===");
  await db.collection("master_badges").doc(BADGE.id).set(
    {
      title: BADGE.title,
      titleEn: BADGE.titleEn,
      description: BADGE.description,
      descriptionEn: BADGE.descriptionEn,
      icon: BADGE.icon,
      type: "event",
      source: "web_era",
    },
    { merge: true }
  );
  console.log(`ok ${BADGE.id}`);
  console.log("=== done ===");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
