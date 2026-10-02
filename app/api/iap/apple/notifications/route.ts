import { NextResponse } from "next/server";
import { isAppleIapConfigured } from "@/lib/billing/apple/appleIapEnv";
import { handleAppleServerNotification } from "@/lib/billing/apple/handleAppleServerNotification";

/**
 * App Store Server Notifications V2
 * Connect: App → App Store Server Notifications → Production / Sandbox URL
 */
export async function POST(req: Request) {
  if (!isAppleIapConfigured()) {
    return NextResponse.json(
      { error: "apple_iap_not_configured" },
      { status: 501 }
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      signedPayload?: string;
    } | null;
    const signedPayload = body?.signedPayload?.trim();
    if (!signedPayload) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    await handleAppleServerNotification(signedPayload);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[iap/apple/notifications]", e);
    return NextResponse.json({ error: "invalid notification" }, { status: 400 });
  }
}
