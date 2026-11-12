/**
 * 協力者へのお礼などで Pro を期間限定で無料付与する（自動更新なし）。
 * 期限が来たら `expireProUsers`（毎日 03:00 JST）が Free に戻す。
 * 課金中の Pro ユーザーには付与しない（サブスクの状態を壊すため）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/grant-pro-gift.ts --handle someone --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/grant-pro-gift.ts --handle someone --reason "AoC NBA referral thanks"
 *   npx tsx --tsconfig tsconfig.json scripts/grant-pro-gift.ts --uid abc123 --days 30
 */
import "./_loadAdminEnv";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import { applyProEntitlement } from "../lib/billing/applyProEntitlement";

const DAY_MS = 86_400_000;

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

async function resolveUid(db: FirebaseFirestore.Firestore): Promise<string> {
  const uid = arg("uid")?.trim();
  if (uid) return uid;
  const handle = arg("handle")?.trim().replace(/^@/, "");
  if (!handle) throw new Error("--uid か --handle を指定してください");
  const snap = await db.collection("users").where("handle", "==", handle).limit(2).get();
  if (snap.size === 0) throw new Error(`handle が見つかりません: @${handle}`);
  if (snap.size > 1) throw new Error(`handle が複数ヒットしました: @${handle}（--uid で指定してください）`);
  return snap.docs[0].id;
}

async function main() {
  const db = getAdminDb();
  const dryRun = process.argv.includes("--dry-run");
  const days = Number(arg("days") ?? "30");
  if (!Number.isFinite(days) || days <= 0 || days > 366) {
    throw new Error("--days は 1〜366");
  }
  const reason = arg("reason") ?? "";

  const uid = await resolveUid(db);
  const user = (await db.doc(`users/${uid}`).get()).data();
  if (!user) throw new Error(`users/${uid} がありません`);

  const now = Date.now();
  const currentUntil =
    user.proUntil instanceof Timestamp ? user.proUntil.toMillis() : 0;
  const activePaid =
    user.plan === "pro" && currentUntil > now && user.cancelAtPeriodEnd !== true;
  if (activePaid) {
    throw new Error(
      `@${user.handle ?? uid} は課金中の Pro（${new Date(currentUntil).toISOString()} まで・自動更新）なので付与しません`
    );
  }

  const proUntil = new Date(Math.max(now, currentUntil) + days * DAY_MS);
  console.log({
    uid,
    handle: user.handle ?? null,
    displayName: user.displayName ?? null,
    currentPlan: user.plan ?? "free",
    days,
    proUntil: proUntil.toISOString(),
    reason,
    dryRun,
  });
  if (dryRun) return;

  await applyProEntitlement(db, uid, {
    planType: "monthly",
    proUntil,
    cancelAtPeriodEnd: true,
  });
  await db.collection("proGifts").add({
    uid,
    days,
    proUntil: Timestamp.fromDate(proUntil),
    reason,
    grantedAt: FieldValue.serverTimestamp(),
  });
  console.log("granted");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
