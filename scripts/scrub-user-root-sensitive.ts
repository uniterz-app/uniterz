/**
 * 公開 users ルートから sensitive を除去する一括移行。
 *
 * - 旧課金 ID → secure/billing
 * - 招待コード → secure/referral + inviteCodes マップ
 * - notificationPrefs → private/notificationPrefs
 * - email / billingProvider / nextPlanType などルート残骸を delete
 *
 * cancelAtPeriodEnd / referredByUid / referralStats は
 * Functions・投稿経路がまだルートを見るため、このスクリプトでは消さない。
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/scrub-user-root-sensitive.ts
 *   DRY_RUN=1 npx tsx scripts/scrub-user-root-sensitive.ts
 */
import "./_loadAdminEnv";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import { migrateLegacyUserBillingIfNeeded } from "../lib/billing/userBillingSecure";
import { writeUserInviteCodeSecure } from "../lib/referral/userReferralSecure";
import { normalizeReferralInviteCode } from "../lib/referral/referralInviteCode";
import { USER_PRIVATE_NOTIFICATION_PREFS_DOC } from "../lib/user/userPrivatePaths";

/** ルートから消してよい（移行先あり / 残骸のみ） */
const SCRUB_ROOT_KEYS = [
  "email",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "googlePurchaseToken",
  "appleOriginalTransactionId",
  "billingProvider",
  "nextPlanType",
  "inviteCode",
  "notificationPrefs",
] as const;

async function main() {
  const db = getAdminDb();
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  let scanned = 0;
  let billingMigrated = 0;
  let inviteMoved = 0;
  let prefsMoved = 0;
  let scrubbed = 0;
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db.collection("users").orderBy("__name__").limit(200);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const data = doc.data();
      const patch: Record<string, unknown> = {};
      let touched = false;

      // 1) 課金 → secure
      const hasBilling = [
        "stripeCustomerId",
        "stripeSubscriptionId",
        "googlePurchaseToken",
        "appleOriginalTransactionId",
      ].some((k) => data[k] != null && String(data[k]).trim());
      if (hasBilling) {
        if (dryRun) {
          billingMigrated += 1;
          console.log(`[dry-run] billing → secure ${doc.id}`);
        } else {
          const ok = await migrateLegacyUserBillingIfNeeded(db, doc.id, data);
          if (ok) {
            billingMigrated += 1;
            console.log(`billing → secure ${doc.id}`);
          }
        }
      }

      // 2) inviteCode → secure/referral
      const invite = normalizeReferralInviteCode(
        String(data.inviteCode ?? "")
      );
      if (invite) {
        if (dryRun) {
          inviteMoved += 1;
          console.log(`[dry-run] inviteCode → secure ${doc.id}`);
        } else {
          await writeUserInviteCodeSecure(db, doc.id, invite);
          await db
            .collection("inviteCodes")
            .doc(invite)
            .set(
              { uid: doc.id, createdAt: FieldValue.serverTimestamp() },
              { merge: true }
            );
          inviteMoved += 1;
          console.log(`inviteCode → secure ${doc.id}`);
        }
      }

      // 3) notificationPrefs → private/
      if (data.notificationPrefs != null) {
        if (dryRun) {
          prefsMoved += 1;
          console.log(`[dry-run] notificationPrefs → private ${doc.id}`);
        } else {
          await db
            .collection("users")
            .doc(doc.id)
            .collection("private")
            .doc(USER_PRIVATE_NOTIFICATION_PREFS_DOC)
            .set(
              {
                prefs: data.notificationPrefs,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          prefsMoved += 1;
          console.log(`notificationPrefs → private ${doc.id}`);
        }
        patch.notificationPrefs = FieldValue.delete();
        touched = true;
      }

      // 4) ルート delete（inviteCode は writeUserInviteCodeSecure が消す）
      for (const key of SCRUB_ROOT_KEYS) {
        if (key === "inviteCode") continue; // 上で処理
        if (key === "notificationPrefs") continue; // 上で patch
        if (data[key] == null) continue;
        patch[key] = FieldValue.delete();
        touched = true;
      }

      if (!touched) continue;
      if (dryRun) {
        scrubbed += 1;
        console.log(
          `[dry-run] scrub ${Object.keys(patch).join(",")} ${doc.id}`
        );
        continue;
      }
      patch.updatedAt = FieldValue.serverTimestamp();
      await doc.ref.set(patch, { merge: true });
      scrubbed += 1;
      console.log(`scrubbed ${Object.keys(patch).filter((k) => k !== "updatedAt").join(",")} ${doc.id}`);
    }

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 200) break;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned,
        billingMigrated,
        inviteMoved,
        prefsMoved,
        scrubbed,
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
