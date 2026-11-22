export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";

const MEASUREMENT_ID =
  process.env.GA4_MEASUREMENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID?.trim() ||
  "G-Y0KLCCS94C";
const API_SECRET =
  process.env.GA4_API_SECRET?.trim() ||
  process.env.EXPO_PUBLIC_GA4_API_SECRET?.trim() ||
  "";
const ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MAX_BATCH = 25;
const ALLOWED_EVENTS = new Set(["page_view"]);

type QueuedEvent = { name?: unknown; params?: unknown };

function asParamMap(raw: unknown): Record<string, string | number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string" || k.length > 40) continue;
    if (typeof v === "string") {
      out[k] = v.slice(0, 100);
      continue;
    }
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/**
 * POST /api/analytics/ga4
 * Native が GA4 Measurement Protocol の API secret をバンドルしないための中継。
 */
export async function POST(req: Request) {
  try {
    if (!API_SECRET) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const body = (await req.json().catch(() => null)) as {
      client_id?: unknown;
      user_id?: unknown;
      user_properties?: unknown;
      device?: unknown;
      consent?: unknown;
      events?: unknown;
    } | null;
    const clientId =
      typeof body?.client_id === "string" ? body.client_id.trim().slice(0, 80) : "";
    if (!clientId || !Array.isArray(body?.events)) {
      return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
    }
    const events: Array<{ name: string; params: Record<string, string | number> }> =
      [];
    for (const row of body.events.slice(0, MAX_BATCH) as QueuedEvent[]) {
      const name = typeof row?.name === "string" ? row.name.trim() : "";
      if (!ALLOWED_EVENTS.has(name)) continue;
      const params = asParamMap(row.params);
      if (!params) continue;
      events.push({ name, params });
    }
    if (events.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const payload: Record<string, unknown> = {
      client_id: clientId,
      events,
    };
    if (typeof body.user_id === "string" && body.user_id.trim()) {
      payload.user_id = body.user_id.trim().slice(0, 80);
    }
    if (body.device && typeof body.device === "object") payload.device = body.device;
    if (body.consent && typeof body.consent === "object") payload.consent = body.consent;
    if (body.user_properties && typeof body.user_properties === "object") {
      payload.user_properties = body.user_properties;
    }

    const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sent: events.length });
  } catch (e: unknown) {
    return clientErrorResponse(e, "POST /api/analytics/ga4");
  }
}
