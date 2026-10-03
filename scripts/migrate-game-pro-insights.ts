/**
 * games/{id} 上の Pro Insight フィールドを gameProInsights/{id} へ移し、games から削除する。
 *
 *   npx tsx scripts/migrate-game-pro-insights.ts          # dry-run（件数だけ）
 *   npx tsx scripts/migrate-game-pro-insights.ts --apply  # 書き込み
 *
 * 認証: `.env.local` の FIREBASE_*。何度実行しても安全（移行済みは対象外）。
 * gameProInsights に既に値があればそちらを優先し、games 側は消すだけ。
 */
import "./_loadAdminEnv";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  GAME_PRO_INSIGHT_FIELDS,
  gameProInsightRef,
} from "../lib/nba/insights/gameProInsightStore";

async function main() {
  const apply = process.argv.includes("--apply");
  const db = getAdminDb();
  const snap = await db.collection("games").where("league", "==", "nba").get();

  let targets = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const present = GAME_PRO_INSIGHT_FIELDS.filter((k) => data[k] !== undefined);
    if (present.length === 0) continue;
    targets += 1;
    if (!apply) continue;

    const ref = gameProInsightRef(db, doc.id);
    const existing = (await ref.get()).data() ?? {};
    const copy: Record<string, unknown> = {};
    const remove: Record<string, unknown> = {};
    for (const k of present) {
      if (existing[k] === undefined) copy[k] = data[k];
      remove[k] = FieldValue.delete();
    }
    const batch = db.batch();
    if (Object.keys(copy).length > 0) batch.set(ref, copy, { merge: true });
    batch.update(doc.ref, remove);
    await batch.commit();
  }

  console.log(
    `${apply ? "migrated" : "would migrate"} ${targets} / ${snap.size} nba games`
  );
}

main().then(() => process.exit(0));
