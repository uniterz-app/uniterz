import { NextResponse } from "next/server";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  createPartnerCodeAdmin,
  listPartnerCodesAdmin,
  setPartnerCodeActiveAdmin,
} from "@/lib/referral/referralPartnerAdmin";

export const runtime = "nodejs";

function errStatus(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status: number }).status;
  }
  return 500;
}

function errResponse(e: unknown) {
  const status = errStatus(e);
  if (status === 500) console.error("/api/admin/referral-partners:", e);
  return NextResponse.json(
    {
      ok: false,
      error: status === 403 ? "forbidden" : status === 401 ? "unauthorized" : "server error",
    },
    { status }
  );
}

/** Admin: パートナーコード一覧 + コード別の登録数 */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const partners = await listPartnerCodesAdmin(getAdminDb());
    return NextResponse.json({ ok: true, partners });
  } catch (e: unknown) {
    return errResponse(e);
  }
}

/** Admin: パートナーコード発行 */
export async function POST(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await createPartnerCodeAdmin(getAdminDb(), {
      code: typeof body.code === "string" ? body.code : "",
      label: typeof body.label === "string" ? body.label : "",
      inviteeUnits: typeof body.inviteeUnits === "number" ? body.inviteeUnits : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "code_taken" ? 409 : 400 });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    return errResponse(e);
  }
}

/** Admin: 有効 / 無効の切り替え（無効にすると以後そのコードでは登録できない） */
export async function PATCH(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code : "";
    if (!code || typeof body.active !== "boolean") {
      return NextResponse.json({ ok: false, error: "code and active required" }, { status: 400 });
    }
    const updated = await setPartnerCodeActiveAdmin(getAdminDb(), code, body.active);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return errResponse(e);
  }
}
