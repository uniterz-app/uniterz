import { NextResponse } from "next/server";
import { buildAppleAppSiteAssociation } from "@/lib/share/appLinkAssociation";

export function GET() {
  const body = buildAppleAppSiteAssociation();
  if (!body) return new NextResponse(null, { status: 404 });
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
