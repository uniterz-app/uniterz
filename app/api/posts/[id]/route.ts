// app/api/posts/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/* ========= 型とバリデーション ========= */
type Outcome = "pending" | "hit" | "miss" | "void";
type LegKind = "main" | "secondary" | "tertiary";
type Status = "scheduled" | "live" | "final";

function isLegKind(v: any): v is LegKind {
  return v === "main" || v === "secondary" || v === "tertiary";
}
function isOutcome(v: any): v is Outcome {
  return v === "pending" || v === "hit" || v === "miss" || v === "void";
}
function isStatus(v: any): v is Status {
  return v === "scheduled" || v === "live" || v === "final";
}

function sanitizePatch(body: any) {
  const out: any = {};

  if ("note" in body) {
    out.note = String(body.note ?? "").slice(0, 2000);
  }

  if ("status" in body && isStatus(body.status)) {
    out.status = body.status as Status;
  }

  if ("legs" in body) {
    if (!Array.isArray(body.legs) || body.legs.length === 0)
      throw new Error("legs must be a non-empty array");

    const legs = body.legs.map((x: any) => {
      if (!isLegKind(x?.kind)) throw new Error("invalid leg.kind");

      const label = String(x?.label ?? "").trim();
      const odds = Number(x?.odds);
      const pct = Number(x?.pct);
      const outcome: Outcome =
        isOutcome(x?.outcome) ? x.outcome : "pending";

      if (!label) throw new Error("empty leg.label");
      if (!isFinite(odds) || odds <= 1) throw new Error("invalid leg.odds");
      if (!isFinite(pct) || pct < 0 || pct > 100) throw new Error("invalid leg.pct");

      return { kind: x.kind as LegKind, label, odds, pct, outcome };
    });

    const sum = legs.reduce((a: number, l: any) => a + Number(l?.pct ?? 0), 0);
    if (sum !== 100) throw new Error("sum of pct must be 100");

    out.legs = legs;
  }

  if (!("note" in out) && !("status" in out) && !("legs" in out))
    throw new Error("no updatable fields");

  return out;
}

/* ========= 認証 ========= */
async function requireUid(req: NextRequest): Promise<string> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/* ========= 投稿編集可能性チェック ========= */
async function assertEditableBy(uid: string, postId: string) {
  const ref = adminDb.collection("posts").doc(postId);
  const snap = await ref.get();

  if (!snap.exists) {
    const err: any = new Error("not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() || {};

  if (!data.authorUid || data.authorUid !== uid) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  const startAtMillis =
    typeof data.startAtMillis === "number" ? data.startAtMillis : null;

  if (startAtMillis && Date.now() >= startAtMillis) {
    const err: any = new Error("locked: game started");
    err.status = 403;
    throw err;
  }

  return { ref, data };
}

/* ========= GET ========= */
export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const uid = await requireUid(req);
    const ref = adminDb.collection("posts").doc(params.id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const data = snap.data() || {};
    const mine = data.authorUid === uid;
    const startAtMillis =
      typeof data.startAtMillis === "number" ? data.startAtMillis : null;
    const editable = mine && (!!startAtMillis ? Date.now() < startAtMillis : false);

    return NextResponse.json({
      ok: true,
      exists: true,
      mine,
      editable,
    });
  } catch (e: any) {
    const status = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status });
  }
}

/* ========= PATCH ========= */
export async function PATCH(
  req: NextRequest,
  { params }: any
) {
  try {
    const uid = await requireUid(req);
    const { ref } = await assertEditableBy(uid, params.id);

    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json(
        { ok: false, error: "invalid json" },
        { status: 400 }
      );

    const update = sanitizePatch(body);

    await ref.update({
      ...update,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status =
      e?.status ??
      (e?.message === "unauthorized"
        ? 401
        : e?.message?.startsWith("invalid") || e?.message?.includes("must")
        ? 400
        : 500);

    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status });
  }
}

/* ========= DELETE ========= */
export async function DELETE(
  req: NextRequest,
  { params }: any
) {
  try {
    const uid = await requireUid(req);
    const { ref } = await assertEditableBy(uid, params.id);

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status =
      e?.status ??
      (e?.message === "unauthorized" ? 401 : 500);

    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status });
  }
}
