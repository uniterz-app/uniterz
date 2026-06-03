/**
 * WC 予想ユーザー向け: users/{uid} の hasNbaPost / hasWcPost を投稿実績から backfill
 *
 * 対象: league === "wc" の投稿が1件以上ある authorUid のみ（件数が少ない想定）
 * 各 UID について NBA 投稿の有無も limit(1) で確認し、フラグを正確に立てる。
 * タブ表示は hasNbaPost && hasWcPost のときのみ（アプリ側と同じ）。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/backfill-result-league-flags-for-wc-users.ts --dry-run
 *   npx tsx scripts/backfill-result-league-flags-for-wc-users.ts
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function authorHasPostInLeague(
  uid: string,
  league: "nba" | "wc"
): Promise<boolean> {
  const snap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("league", "==", league)
    .limit(1)
    .get();
  return !snap.empty;
}

(async () => {
  console.log("=== backfill hasNbaPost / hasWcPost (WC users) ===");
  if (DRY_RUN) console.log(">>> DRY RUN（users は更新しません）\n");

  const wcSnap = await db.collection("posts").where("league", "==", "wc").get();

  const wcUids = new Set<string>();
  for (const doc of wcSnap.docs) {
    const uid = String(doc.data()?.authorUid ?? "").trim();
    if (uid) wcUids.add(uid);
  }

  console.log(`WC 投稿数: ${wcSnap.size}`);
  console.log(`WC 予想ユーザー数: ${wcUids.size}\n`);

  if (wcUids.size === 0) {
    console.log("対象ユーザーなし。終了。");
    process.exit(0);
  }

  let tabsEligible = 0;
  let wcOnly = 0;
  let updated = 0;

  for (const uid of wcUids) {
    const hasWcPost = true;
    const hasNbaPost = await authorHasPostInLeague(uid, "nba");

    if (hasNbaPost) tabsEligible++;
    else wcOnly++;

    const patch = { hasWcPost, hasNbaPost };

    console.log(
      [
        uid,
        `hasWcPost=${hasWcPost}`,
        `hasNbaPost=${hasNbaPost}`,
        hasNbaPost && hasWcPost ? "→ タブ表示対象" : "→ タブなし（WC のみ）",
      ].join("  ")
    );

    if (!DRY_RUN) {
      await db.collection("users").doc(uid).set(patch, { merge: true });
      updated++;
    }
  }

  console.log("\n--- サマリー ---");
  console.log(`WC ユーザー: ${wcUids.size}`);
  console.log(`タブ表示対象（NBA+WC）: ${tabsEligible}`);
  console.log(`WC のみ（タブ非表示）: ${wcOnly}`);
  if (DRY_RUN) {
    console.log("DRY RUN のため users は未更新。本番は --dry-run を外して再実行。");
  } else {
    console.log(`users 更新: ${updated} 件`);
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
