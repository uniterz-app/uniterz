/**
 * 月間ランキングバッジの手動付与（既定は dry-run で対象者を表示するだけ）。
 * 自動付与は Functions `grantMonthlyRankingBadgesForLabel`。同じロック doc を使うので二重付与しない。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/grant-monthly-ranking-badges.ts --label 2026-10
 *   npx tsx --tsconfig tsconfig.json scripts/grant-monthly-ranking-badges.ts --label 2026-10 --apply
 */
import "./_loadAdminEnv";
import fs from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  MONTHLY_BADGE_DIVISIONS,
  MONTHLY_BADGE_FIRST_LABEL,
  MONTHLY_BADGE_KINDS,
  monthlyBadgeArt,
  monthlyBadgeGrantsFromSnapshot,
  monthlyBadgeMasterDoc,
  monthlyBadgeRefsForLabel,
  monthlyBadgeSnapshotDocId,
  monthlyBadgeUserMeta,
  monthlyRankingBadgeId,
  formatMonthlyBadgeValue,
  type MonthlyBadgeGrant,
} from "../lib/badges/monthlyRankingBadge";

const LOCK_COLLECTION = "meta/monthlyRankingBadgeGrants/locks";

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function main() {
  const label = arg("--label");
  const apply = process.argv.includes("--apply");
  if (!label || !/^\d{4}-\d{2}$/.test(label)) throw new Error("--label YYYY-MM が必要です");
  if (label < MONTHLY_BADGE_FIRST_LABEL) throw new Error(`${MONTHLY_BADGE_FIRST_LABEL} より前には付与しません`);

  const publicDir = path.resolve(process.cwd(), "public");
  const refs = monthlyBadgeRefsForLabel(label);
  const missingArt = refs.flatMap((ref) => {
    const art = monthlyBadgeArt(ref);
    return [art.full, art.back].filter((p) => !fs.existsSync(path.join(publicDir, p)));
  });
  if (missingArt.length > 0) {
    throw new Error(`画像がありません:\n${[...new Set(missingArt)].join("\n")}`);
  }

  const db = getAdminDb();
  const grants: MonthlyBadgeGrant[] = [];
  const participantByBadge = new Map<string, number>();
  for (const division of MONTHLY_BADGE_DIVISIONS) {
    for (const spec of MONTHLY_BADGE_KINDS) {
      const docId = monthlyBadgeSnapshotDocId(division, label, spec.kind);
      const snap = await db.collection("period_ranking_snapshots").doc(docId).get();
      if (!snap.exists) {
        console.warn(`snapshot なし: ${docId}`);
        continue;
      }
      const data = snap.data() as Record<string, unknown>;
      const range = (data.range ?? {}) as { endKey?: unknown };
      const built = typeof data.snapshotDateKey === "string" ? data.snapshotDateKey : "";
      const endKey = typeof range.endKey === "string" ? range.endKey : "";
      if (!built || !endKey || built <= endKey) {
        throw new Error(`${docId} は月末より後に集計されていません（snapshotDateKey=${built} endKey=${endKey}）`);
      }
      const list = monthlyBadgeGrantsFromSnapshot({ label, division, kind: spec.kind, snapshot: data });
      grants.push(...list);
      const pc = Number(data.participantCount);
      if (Number.isFinite(pc) && pc > 0) {
        for (let rank = 1; rank <= spec.maxRank; rank++) {
          participantByBadge.set(monthlyRankingBadgeId({ division, label, kind: spec.kind, rank }), Math.floor(pc));
        }
      }
    }
  }

  console.log(`\n${label} 月間ランキングバッジ: ${grants.length} 件${apply ? "" : "（dry-run）"}\n`);
  for (const g of grants) {
    const v = formatMonthlyBadgeValue(g.ref.kind, g.value);
    console.log(
      [
        g.ref.division.padEnd(6),
        g.ref.kind.padEnd(7),
        `${g.ref.rank}位`,
        `${g.engravedName}${g.handle ? ` @${g.handle}` : ""}`,
        v ? `${v.value} ${v.unit}` : "-",
        g.participantCount != null ? `/ ${g.participantCount}人` : "",
        g.uid,
      ].join("  ")
    );
  }
  if (!apply) {
    console.log("\n--apply を付けると master_badges と user_badges に書き込みます。");
    return;
  }

  for (const ref of refs) {
    const id = monthlyRankingBadgeId(ref);
    const pc = participantByBadge.get(id);
    await db
      .collection("master_badges")
      .doc(id)
      .set({ ...monthlyBadgeMasterDoc(ref), ...(pc != null ? { participantCount: pc } : {}) }, { merge: true });
  }

  let written = 0;
  let skipped = 0;
  for (const g of grants) {
    const ref = db.collection("user_badges").doc(g.uid).collection("badges").doc(g.badgeId);
    const did = await db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) return false;
      tx.set(ref, { badgeId: g.badgeId, meta: monthlyBadgeUserMeta(g), grantedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (did) written++;
    else skipped++;
  }

  await db.doc(`${LOCK_COLLECTION}/${label}`).set(
    {
      label,
      status: "done",
      source: "script",
      written,
      skipped,
      grantedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`\n書き込み ${written} 件 / 既に付与済み ${skipped} 件`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
