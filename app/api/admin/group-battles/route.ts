import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { createGroupBattle } from "@/lib/groupBattles/server/createBattle";
import {
  GROUP_BATTLE_COLLECTION,
} from "@/lib/groupBattles/constants";
import { parseBattleDoc } from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 大会一覧（新しい開催開始順） */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const snap = await adminDb
      .collection(GROUP_BATTLE_COLLECTION)
      .limit(60)
      .get();
    const battles = snap.docs
      .map((d) => parseBattleDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.battleStartAtMs - a.battleStartAtMs)
      .slice(0, 40);
    return jsonOk({ battles });
  } catch (e) {
    return mapAuthError(e);
  }
}

/** 大会作成 — 募集・対戦期間から週ラベル / Unit 表を自動生成 */
export async function POST(req: Request) {
  try {
    const uid = await requireAdminUid(req);
    const body = await req.json().catch(() => ({}));
    const result = await createGroupBattle(adminDb, {
      name: String(body?.name ?? ""),
      recruitStartAt: String(body?.recruitStartAt ?? ""),
      recruitEndAt: String(body?.recruitEndAt ?? ""),
      battleStartAt: String(body?.battleStartAt ?? ""),
      battleEndAt: String(body?.battleEndAt ?? ""),
      seasonKey:
        body?.seasonKey == null ? undefined : String(body.seasonKey),
      startRecruiting: Boolean(body?.startRecruiting),
      rulesVersion:
        body?.rulesVersion == null ? undefined : String(body.rulesVersion),
      monthlyLabel:
        body?.monthlyLabel == null ? undefined : String(body.monthlyLabel),
      createdByUid: uid,
    });
    if (!result.ok) {
      return jsonErr(result.error, 400);
    }
    return jsonOk({
      battleId: result.battleId,
      battle: result.battle,
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
