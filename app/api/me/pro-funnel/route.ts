export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import {
  isProFunnelEvent,
  isProFunnelSource,
  proFunnelDayKey,
} from "@/lib/billing/proFunnelEvents";
import { consumeUidActionRateLimit } from "@/lib/security/consumeUidRateLimit";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/** Pro 導線の計測（表示・タップ・購入）。body: { event, source?, plan?, trial? } */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const event = body?.event;
    if (!isProFunnelEvent(event)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }
    const source = isProFunnelSource(body?.source) ? body.source : null;
    const plan =
      typeof body?.plan === "string" && /^[a-z_]{2,16}$/.test(body.plan)
        ? body.plan
        : null;
    const trial = body?.trial === true;

    const db = getAdminDb();
    const rate = await consumeUidActionRateLimit(db, uid, "pro_funnel_event", 200);
    if (!rate.ok) return NextResponse.json({ ok: true, skipped: true });

    const now = Date.now();
    const userRef = db.doc(`proFunnelUsers/${uid}`);
    const prev = await userRef.get();
    const seen = prev.get(event) as { first?: number } | undefined;

    const entry: Record<string, unknown> = {
      last: now,
      n: FieldValue.increment(1),
    };
    if (!seen?.first) entry.first = now;
    if (source) entry.src = { [source]: FieldValue.increment(1) };
    if (plan) {
      entry.plan = plan;
      entry.trial = trial;
    }

    const daily: Record<string, unknown> = {
      [event]: FieldValue.increment(1),
      updatedAtMs: now,
    };
    if (source) daily[`${event}__${source}`] = FieldValue.increment(1);
    if (plan) daily[`${event}__${plan}${trial ? "_trial" : ""}`] = FieldValue.increment(1);

    const batch = db.batch();
    batch.set(userRef, { [event]: entry, updatedAtMs: now }, { merge: true });
    batch.set(db.doc(`proFunnelDaily/${proFunnelDayKey(now)}`), daily, {
      merge: true,
    });
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("POST /api/me/pro-funnel:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
