import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqualString } from "@/lib/security/timingSafeEqualString";

export const runtime = "nodejs";

/** onGameFinalV2 が試合の posts を確定させた直後に叩く（TODAY UNITERZ の再集計） */
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

  revalidateTag("uniterz-daily-score-leaders", {});
  /** 週間・月間の「表示期間」は初試合日の settle で切り替わる */
  revalidateTag("period-ranking", {});
  revalidateTag("games-window:nba", {});
  return NextResponse.json(
    {
      ok: true,
      tags: [
        "uniterz-daily-score-leaders",
        "period-ranking",
        "games-window:nba",
      ],
    },
    { status: 200 }
  );
}
