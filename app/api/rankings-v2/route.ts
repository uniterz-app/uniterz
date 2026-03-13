// app/api/rankings-v2/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") ?? "winRate";

  const rows = [
    {
      uid: "u1",
      handle: "alpha",
      displayName: "Alpha",
      winRate: 0.72,
      avgPrecision: 8.1,
    },
    {
      uid: "u2",
      handle: "bravo",
      displayName: "Bravo",
      winRate: 0.68,
      avgPrecision: 7.6,
    },
    {
      uid: "u3",
      handle: "charlie",
      displayName: "Charlie",
      winRate: 0.64,
      avgPrecision: 7.2,
    },
  ];

  return NextResponse.json(
    {
      rows,
      period: {
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2026-01-07T23:59:59.999Z",
      },
    },
    { status: 200 }
  );
}
