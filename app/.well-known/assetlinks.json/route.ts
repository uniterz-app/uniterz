import { NextResponse } from "next/server";
import { buildAndroidAssetLinks } from "@/lib/share/appLinkAssociation";

export function GET() {
  const body = buildAndroidAssetLinks();
  if (!body) return new NextResponse(null, { status: 404 });
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
