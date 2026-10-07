import { NextResponse } from "next/server";
import {
  googlePlayRtdnSecret,
  isGooglePlayIapConfigured,
} from "@/lib/billing/google/googlePlayEnv";
import {
  handleGooglePlayRtdn,
  type GooglePlayRtdnPayload,
} from "@/lib/billing/google/handleGooglePlayRtdn";
import { timingSafeEqualString } from "@/lib/security/timingSafeEqualString";

/**
 * Google Play Real-time developer notifications（Cloud Pub/Sub push）
 * Push endpoint: https://www.uniterz.app/api/iap/google/notifications?secret=<GOOGLE_PLAY_RTDN_SECRET>
 */
export async function POST(req: Request) {
  if (!isGooglePlayIapConfigured()) {
    return NextResponse.json({ error: "google_play_not_configured" }, { status: 501 });
  }

  const expected = googlePlayRtdnSecret();
  const provided = new URL(req.url).searchParams.get("secret");
  if (!expected || !provided || !timingSafeEqualString(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    message?: { data?: string };
  } | null;
  const data = body?.message?.data;
  if (!data) {
    // Pub/Sub は 2xx 以外を再送し続けるので、壊れたメッセージは受理して捨てる
    return NextResponse.json({ ok: true, ignored: true });
  }

  let payload: GooglePlayRtdnPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await handleGooglePlayRtdn(payload);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[iap/google/notifications]", e);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
}
