import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqualString } from "@/lib/security/timingSafeEqualString";
import { clearRankingSnapshotGenerationMemCache } from "@/lib/rankings/server/loadRankingSnapshotGeneration";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_REVALIDATE_SECRET is not set" },
      { status: 500 }
    );
  }

  const token = req.headers.get("x-revalidate-token")?.trim();
  if (!timingSafeEqualString(token, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  clearRankingSnapshotGenerationMemCache();
  revalidateTag("cumulative-ranking", {});
  revalidateTag("period-ranking", {});
  revalidateTag("ranking-ui", {});
  return NextResponse.json(
    {
      ok: true,
      tags: ["cumulative-ranking", "period-ranking", "ranking-ui"],
    },
    { status: 200 }
  );
}
