/**
 * npx tsx scripts/grant-nba-xmas-badge.ts
 *
 * NBA Christmas 25-26 バッジを対象ユーザーに一括付与
 * 既存があっても merge で安全
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ===== Firebase Admin 初期化 =====
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===== 付与するバッジ =====
const BADGE_ID = "nba_xmas_25-26_winner";

// ===== 対象ユーザー =====
const users = [
  { uid: "0vhyFVAABIgRB9TwNB8QsFv7Hpj1", wins: 4 },
    { uid: "2is1LLV520Me1CisoZDuc8k81273", wins: 4 },
    { uid: "3HIED7Inc5XLiJIjfk1Z9BVh9T92", wins: 4 },
    { uid: "3oF5z77sxXRPOlWjIbZzs8UuSPI3", wins: 4 },
    { uid: "50mNF9x5BuQWFb7rFoTOfzWAdQ62", wins: 4 },
    { uid: "5RGtbbp2AjZtUYio2ya3jJGSR5M2", wins: 4 },
    { uid: "78z9dF4nPvc09Idx9KUznRJ5dBI2", wins: 4 },
    { uid: "7ByXqTDxiOh0Cos9XjCqP2CCWFf2", wins: 4 },
    { uid: "7dOWFeNZ6Sablhpale06OiikVYy1", wins: 4 },
    { uid: "AqIDqhJ7JtTHGQvdT1jFZvjOwR32", wins: 4 },
    { uid: "CDLFtwaB7Eho7tD618mcyF4gIww1", wins: 4 },
    { uid: "D6AJz1l9l6c1AXF6wzUzCSQ2Al52", wins: 4 },
    { uid: "EEVghW64JIVtn9jeVClGC1kC8V53", wins: 4 },
    { uid: "FYod0FmVQOfklUELgZcU9hsBHQx1", wins: 5 },
    { uid: "G0MfeDiGQdY2W0NGiVkYUWuFMMT2", wins: 4 },
    { uid: "GDpiPjWEOwTdjOKPGIpNYktEmXW2", wins: 4 },
    { uid: "GIHfmmhPA0SFPwSjoSSQpPUPJIz2", wins: 4 },
    { uid: "HoyAQOVeQ0c8yGVHewCF9xAE8ys1", wins: 4 },
    { uid: "HwF6T5xdAuUygCiNIUvl840OcCE3", wins: 4 },
    { uid: "HzjEOXCqKyfDibKLpP6Ne8FEhOR2", wins: 5 },
    { uid: "K6qO5qM9PiWLeevoAzTCwB4oLAz1", wins: 4 },
    { uid: "LM4mwJo5xYgpszJpMUiJ1TW3lJ42", wins: 4 },
    { uid: "Ly6Fs79n0PhBQlXCcHOS8umu9kG3", wins: 4 },
    { uid: "N7oJJiSpm0dEkgpM5BSMOaXfGF92", wins: 4 },
    { uid: "NLT5zIslPOdrehNhw5ZxuTSwYxA3", wins: 5 },
    { uid: "NPsrV7ZjRzLktJzFAjmC0fbeFbU2", wins: 5 },
    { uid: "PjeS144tS7PqE2GRrvnS3rbEmdp2", wins: 4 },
    { uid: "Q0C7EymN5idIp2f20mZZthpC9sw1", wins: 4 },
    { uid: "QPxSPPYyK0VTgBCwMwtuxmiyYH82", wins: 4 },
    { uid: "QQOvq0a4t3OwFcfNiOPpNmnwL5G2", wins: 5 },
    { uid: "R4HLzNwsfSWuGlRpx69KO5yZtJl1", wins: 5 },
    { uid: "RFadRNSgyqRLlDFe51doWpawhup1", wins: 4 },
    { uid: "RrpBO7C9XeOe4SSsW6RqNIqPABD2", wins: 4 },
    { uid: "SatcOw1JfCWjaHv68YChg5SgIsz2", wins: 4 },
    { uid: "UK0ocU5pt9SUbiNCJFNa61nBIZI2", wins: 4 },
    { uid: "Y1tHnCnrt9aPiRrsu6YlTXdiCLp2", wins: 4 },
    { uid: "YEo6ZfmuA6ULUE777IoIXZuy6fd2", wins: 4 },
    { uid: "e36hhruDM4UTeG2H8l5zCFTqwIB2", wins: 4 },
    { uid: "eSpfTpks8SVFCEJHFYpZBtOQcEv1", wins: 4 },
    { uid: "ewlgXTnRZMWnpLNmvoOGgk4hoO62", wins: 5 },
    { uid: "ex6nf0Di1ENKHlBNCM55cXMKjeG3", wins: 4 },
    { uid: "g01NGZbtodO9rFgCI8FDYthtuBK2", wins: 4 },
    { uid: "h8FMyoTeapRz9fAmdEaH7xq4gSd2", wins: 4 },
    { uid: "lTpjZSsRDPN5VdPQ6BfVhyHNEGo1", wins: 4 },
    { uid: "n5AmNbaWZgaSA0hpzZWME21kjZf1", wins: 4 },
    { uid: "o5xRoDlCEEa3kisuLpsVmTQnxCx2", wins: 4 },
    { uid: "oIYTPV6xldbKdLrcbFFneIPgnTG3", wins: 4 },
    { uid: "pwK4s65XOaXqbu0aaAoiRI8SGkn1", wins: 4 },
    { uid: "rLdiFLy9qEQIXQASAN8fcKmiWRj2", wins: 4 },
    { uid: "rMka65se6sggexHvNtyWAZgnHQy2", wins: 4 },
    { uid: "ruY6ZDfyvgNje1ECiOMOuKn7rGB2", wins: 4 },
    { uid: "ugo4VOTad8VxtHGuiUL4as14VjA2", wins: 4 },
    { uid: "ux1esEE0rpPoqjY8kxNogpX1wMJ3", wins: 4 },
    { uid: "wAHXVZ13jzc2dPkm7S9k1BdI7lm1", wins: 4 },
];

// ===== 実行 =====
async function grant() {
  console.log("=== grant nba_xmas badge start ===");

  const now = admin.firestore.Timestamp.now();

  for (const u of users) {
    const ref = db
      .collection("user_badges")
      .doc(u.uid)
      .collection("badges")
      .doc(BADGE_ID);

    await ref.set(
      {
        badgeId: BADGE_ID,
        grantedAt: now,
        meta: {
          wins: u.wins,
          source: "nba_xmas_25-26",
        },
      },
      { merge: true }
    );

    console.log(`✔ granted to ${u.uid}`);
  }

  console.log("=== grant completed ===");
  process.exit(0);
}

grant().catch((e) => {
  console.error("❌ grant failed:", e);
  process.exit(1);
});
