/**
 * アプリの画面表示計測を GA4（Measurement Protocol）へ中継する。
 *
 * API シークレットはサーバーの環境変数（GA4_MEASUREMENT_ID / GA4_API_SECRET）だけに置き、
 * アプリのバンドル・eas.json には入れない。未設定なら何もせず 204 を返す。
 * 本人確認はしない（未ログインの計測もあるため）。乱用対策はサイズ・形式の検査と、
 * インスタンスごとの簡易レート制限（best effort）。
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_EVENTS = 25;
const MAX_PARAMS = 25;
const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const CLIENT_ID_RE = /^[\w.\-]{1,64}$/;

/** インスタンスごとの簡易制限（Firestore を使わない・分散環境では厳密ではない） */
const WINDOW_MS = 60_000;
const WINDOW_LIMIT = 120;
const hits = new Map<string, { count: number; windowStart: number }>();

function allowIp(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const cur = hits.get(ip);
  if (!cur || now - cur.windowStart >= WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  cur.count += 1;
  return cur.count <= WINDOW_LIMIT;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
}

type Params = Record<string, string | number>;

function sanitizeParams(raw: unknown): Params | null {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Params = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_PARAMS) break;
    if (!NAME_RE.test(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "string") {
      out[k] = v.slice(0, 100);
    } else {
      continue;
    }
    n += 1;
  }
  return out;
}

function sanitizeDevice(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && k.length <= 40) out[k] = v.slice(0, 100);
  }
  return out;
}

export async function POST(req: Request) {
  const measurementId = process.env.GA4_MEASUREMENT_ID?.trim() ?? "";
  const apiSecret = process.env.GA4_API_SECRET?.trim() ?? "";
  if (!measurementId || !apiSecret) return new NextResponse(null, { status: 204 });
  if (!allowIp(clientIp(req))) return new NextResponse(null, { status: 429 });

  const text = await req.text().catch(() => "");
  if (!text || text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new NextResponse(null, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const clientId = typeof body.client_id === "string" ? body.client_id : "";
  if (!CLIENT_ID_RE.test(clientId)) return new NextResponse(null, { status: 400 });

  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return new NextResponse(null, { status: 400 });
  }
  const events: { name: string; params: Params }[] = [];
  for (const ev of body.events) {
    if (!ev || typeof ev !== "object") return new NextResponse(null, { status: 400 });
    const name = (ev as { name?: unknown }).name;
    if (typeof name !== "string" || !NAME_RE.test(name)) return new NextResponse(null, { status: 400 });
    const params = sanitizeParams((ev as { params?: unknown }).params);
    if (!params) return new NextResponse(null, { status: 400 });
    events.push({ name, params });
  }

  const payload: Record<string, unknown> = {
    client_id: clientId,
    // 広告のパーソナライズは送らない（アプリ側と同じ）
    consent: { ad_user_data: "DENIED", ad_personalization: "DENIED" },
    events,
  };
  if (typeof body.user_id === "string" && body.user_id.length > 0 && body.user_id.length <= 256) {
    payload.user_id = body.user_id;
  }
  const up = body.user_properties as { plan?: { value?: unknown } } | undefined;
  const plan = up?.plan?.value;
  if (plan === "free" || plan === "pro") payload.user_properties = { plan: { value: plan } };
  const device = sanitizeDevice(body.device);
  if (device) payload.device = device;

  const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // 計測の失敗はアプリに影響させない
    console.warn("[analytics/collect] ga4 forward failed", e);
  }
  return new NextResponse(null, { status: 204 });
}
