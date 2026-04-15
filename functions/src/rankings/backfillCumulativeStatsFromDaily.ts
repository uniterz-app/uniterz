import { onRequest } from "firebase-functions/v2/https";
import { FieldPath, FieldValue, getFirestore } from "firebase-admin/firestore";

type Totals = {
  posts: number;
  wins: number;
  points: number;
  upset: number;
  precision: number;
};

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mergeAll(base: Totals, all: any): Totals {
  return {
    posts: base.posts + safeNum(all?.posts),
    wins: base.wins + safeNum(all?.wins),
    points: base.points + safeNum(all?.pointsSumV3),
    upset: base.upset + safeNum(all?.upsetPointsSum),
    precision: base.precision + safeNum(all?.scorePrecisionSum),
  };
}

async function recomputeTotalsFromDaily(uid: string): Promise<Totals> {
  const db = getFirestore();
  const snap = await db
    .collection("user_stats_v2_daily")
    .where(FieldPath.documentId(), ">=", `${uid}_`)
    .where(FieldPath.documentId(), "<", `${uid}_\uf8ff`)
    .get();

  let totals: Totals = {
    posts: 0,
    wins: 0,
    points: 0,
    upset: 0,
    precision: 0,
  };
  snap.docs.forEach((d) => {
    totals = mergeAll(totals, d.data()?.all);
  });
  return totals;
}

export const backfillCumulativeStatsFromDailyHttp = onRequest(async (req, res) => {
  try {
    const db = getFirestore();
    const uid = typeof req.query.uid === "string" ? req.query.uid.trim() : "";
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
    const dryRun = !(req.query.apply === "1" || req.query.apply === "true");
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 0;
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 2000)
        : 500;

    const targets: string[] = [];
    if (uid) {
      targets.push(uid);
    } else {
      let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db
        .collection("user_stats_v2")
        .select()
        .orderBy(FieldPath.documentId())
        .limit(limit);
      if (cursor) {
        q = q.startAfter(cursor);
      }
      const userSnap = await q.get();
      userSnap.docs.forEach((d) => targets.push(d.id));
    }

    const results: Array<{
      uid: string;
      posts: number;
      wins: number;
      points: number;
      upset: number;
      precision: number;
      wrote: boolean;
    }> = [];

    for (const targetUid of targets) {
      const totals = await recomputeTotalsFromDaily(targetUid);
      const winRate = totals.posts > 0 ? totals.wins / totals.posts : 0;
      if (!dryRun) {
        await db.doc(`cumulative_stats/${targetUid}`).set(
          {
            uid: targetUid,
            totalPosts: totals.posts,
            totalWins: totals.wins,
            totalPoints: totals.points,
            totalUpset: totals.upset,
            totalPrecision: totals.precision,
            winRate,
            updatedAt: FieldValue.serverTimestamp(),
            backfilledFromDailyAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      results.push({ ...totals, uid: targetUid, wrote: !dryRun });
    }

    const nextCursor =
      !uid && targets.length === limit ? targets[targets.length - 1] : null;
    res.status(200).json({
      ok: true,
      dryRun,
      count: results.length,
      limit,
      cursor: cursor || null,
      nextCursor,
      allUsersDone: !uid && nextCursor == null,
      results,
      usage: {
        allUsersPreview: `${req.path}?limit=500`,
        allUsersPreviewNextPage: `${req.path}?limit=500&cursor=<NEXT_CURSOR_FROM_RESPONSE>`,
        applySingleUid: `${req.path}?uid=<UID>&apply=1`,
        applyFirstNUsers: `${req.path}?limit=500&apply=1`,
        applyNextPage: `${req.path}?limit=500&cursor=<NEXT_CURSOR_FROM_RESPONSE>&apply=1`,
      },
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});
