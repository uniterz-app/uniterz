import { NextResponse } from "next/server";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  adminUpdateRedemption,
  loadAllRedemptionsAdmin,
} from "@/lib/redemption/redemptionServer";
import type { RedemptionRequestStatus } from "@/lib/redemption/redemptionTypes";

export const runtime = "nodejs";

function errStatus(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status: number }).status;
  }
  return 500;
}

/** Admin: 申請一覧 */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as RedemptionRequestStatus | null;
    const limitRaw = Number(url.searchParams.get("limit") ?? "100");
    const db = getAdminDb();
    const requests = await loadAllRedemptionsAdmin(db, {
      limit: Number.isFinite(limitRaw) ? limitRaw : 100,
      status: status || undefined,
    });
    return NextResponse.json({ ok: true, requests });
  } catch (e: unknown) {
    const status = errStatus(e);
    return NextResponse.json(
      { ok: false, error: status === 403 ? "forbidden" : "unauthorized" },
      { status }
    );
  }
}

/** Admin: ステータス / 追跡番号更新 */
export async function PATCH(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }
    const db = getAdminDb();
    const result = await adminUpdateRedemption(db, id, {
      status:
        typeof body.status === "string"
          ? (body.status as RedemptionRequestStatus)
          : undefined,
      trackingNumber:
        body.trackingNumber === null
          ? null
          : typeof body.trackingNumber === "string"
            ? body.trackingNumber
            : undefined,
      trackingCarrier:
        body.trackingCarrier === null
          ? null
          : typeof body.trackingCarrier === "string"
            ? body.trackingCarrier
            : undefined,
      orderReference:
        body.orderReference === null
          ? null
          : typeof body.orderReference === "string"
            ? body.orderReference
            : undefined,
      adminNote:
        body.adminNote === null
          ? null
          : typeof body.adminNote === "string"
            ? body.adminNote
            : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    const status = errStatus(e);
    console.error("PATCH /api/admin/redemptions:", e);
    return NextResponse.json(
      { ok: false, error: status === 403 ? "forbidden" : "unauthorized" },
      { status }
    );
  }
}
