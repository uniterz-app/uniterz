import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  cancelRedemptionByUser,
  createRedemptionRequest,
  loadRedemptionsForUid,
  submitDraftRedemption,
} from "@/lib/redemption/redemptionServer";
import type { RedemptionApplicationInput } from "@/lib/redemption/redemptionTypes";
import { normalizeRedemptionProductKind } from "@/lib/redemption/redemptionCatalog";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** 自分の交換申請一覧 + カタログ */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const db = getAdminDb();
    const data = await loadRedemptionsForUid(db, uid);
    return NextResponse.json({ ok: true, ...data });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/redemptions:", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}

/** 申請作成（draft / pending） */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "create";
    const db = getAdminDb();

    if (action === "cancel") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      }
      const result = await cancelRedemptionByUser(db, uid, id);
      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === "submit_draft") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      }
      const result = await submitDraftRedemption(db, uid, id);
      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    const kind = normalizeRedemptionProductKind(body.productKind);
    if (!kind) {
      return NextResponse.json(
        { ok: false, error: "invalid productKind" },
        { status: 400 }
      );
    }

    const input: RedemptionApplicationInput = {
      productKind: kind,
      productName: String(body.productName ?? ""),
      productUrl: String(body.productUrl ?? ""),
      storeName: String(body.storeName ?? ""),
      size: String(body.size ?? ""),
      color: String(body.color ?? ""),
      notes: typeof body.notes === "string" ? body.notes : undefined,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      shippingName: String(body.shippingName ?? ""),
      shippingPostalCode: String(body.shippingPostalCode ?? ""),
      shippingAddress: String(body.shippingAddress ?? ""),
      shippingPhone: String(body.shippingPhone ?? ""),
      shippingCountry: String(body.shippingCountry ?? "JP"),
    };

    const asDraft = body.asDraft === true;
    const result = await createRedemptionRequest(db, uid, input, { asDraft });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("POST /api/me/redemptions:", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
