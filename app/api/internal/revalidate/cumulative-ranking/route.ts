import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_REVALIDATE_SECRET is not set" },
      { status: 500 }
    );
  }

  const token = req.headers.get("x-revalidate-token");
  if (token !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateTag("cumulative-ranking");
  return NextResponse.json({ ok: true, tag: "cumulative-ranking" }, { status: 200 });
}

