export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { isAdoptedProBgVariant } from "@/lib/profile/profilePlanProAdoptedBgVariants";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import {
  formatProSkinUnlockCondition,
  getProSkinUnlockEntry,
  PRO_SKIN_UNLOCK_CATALOG,
  userDataIsPro,
} from "@/lib/profile/proSkinUnlock";
import { parseProSkinUnlockNoticeIds } from "@/lib/profile/proSkinUnlockNotice";
import {
  ensurePersistedProSkinUnlocks,
  isProSkinIdUnlockedForUser,
  progressFromUserDocOnly,
  readProSkinOwnerCounts,
} from "@/lib/profile/proSkinUnlockServer";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/** 解放進捗・所持人数・カタログ状態 */
export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    const db = getAdminDb();
    const userRef = db.doc(`users/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    const userData = (snap.data() ?? {}) as Record<string, unknown>;
    // users doc のみ。cumulative_stats / period_ranking は読まない
    const progress = progressFromUserDocOnly(userData);
    const unlockedIds = await ensurePersistedProSkinUnlocks(
      db,
      uid,
      userData,
      progress
    );
    const unlockedSet = new Set(unlockedIds);
    const ownerCounts = await readProSkinOwnerCounts(db);
    const savedId = parseUserPlanProBgVariant(userData.planProBgVariant);

    const skins = PRO_SKIN_UNLOCK_CATALOG.map((entry) => {
      const unlocked = unlockedSet.has(entry.id);
      return {
        id: entry.id,
        unlocked,
        unlockKind: entry.unlock.kind,
        conditionJa: formatProSkinUnlockCondition(entry.unlock, "ja"),
        conditionEn: formatProSkinUnlockCondition(entry.unlock, "en"),
        owners: ownerCounts[entry.id] ?? 0,
      };
    });

    const noticeIds = parseProSkinUnlockNoticeIds(
      userData.proSkinUnlockNoticeIds
    );

    return NextResponse.json({
      ok: true,
      progress,
      unlockedIds,
      noticeIds,
      savedId,
      skins,
      ownerCounts,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("GET /api/me/pro-skin:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * - planProBgVariant: スキン適用
 * - dismissNoticeIds: ライブ達成モーダル既読（キュー削除）
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.doc(`users/${uid}`);

    if (Array.isArray(body.dismissNoticeIds)) {
      const ids = parseProSkinUnlockNoticeIds(body.dismissNoticeIds);
      if (ids.length > 0) {
        await userRef.set(
          {
            proSkinUnlockNoticeIds: FieldValue.arrayRemove(...ids),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      return NextResponse.json({ ok: true, dismissed: ids });
    }

    const variant = body.planProBgVariant;
    if (typeof variant !== "string" || !isAdoptedProBgVariant(variant)) {
      return NextResponse.json({ error: "invalid variant" }, { status: 400 });
    }

    const entry = getProSkinUnlockEntry(variant);
    if (!entry) {
      return NextResponse.json({ error: "invalid variant" }, { status: 400 });
    }

    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    const userData = (snap.data() ?? {}) as Record<string, unknown>;
    if (!userDataIsPro(userData)) {
      return NextResponse.json({ error: "pro required" }, { status: 403 });
    }

    const progress = progressFromUserDocOnly(userData);
    const unlockedIds = await ensurePersistedProSkinUnlocks(
      db,
      uid,
      userData,
      progress
    );
    const persisted = new Set(unlockedIds);
    if (!isProSkinIdUnlockedForUser(variant, progress, persisted)) {
      return NextResponse.json(
        { error: "skin locked", condition: formatProSkinUnlockCondition(entry.unlock, "ja") },
        { status: 403 }
      );
    }

    await userRef.set(
      {
        planProBgVariant: variant,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, planProBgVariant: variant });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("POST /api/me/pro-skin:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
