export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import {
  loadChallengeMetrics,
  publishDecember2026Notice,
  saveChallengeCosts,
} from "@/lib/campaigns/loadChallengeMetrics";
import {
  DECEMBER_2026_X_COPY_JA,
  DECEMBER_2026_YOUTUBE_COPY_JA,
} from "@/lib/campaigns/december2026Campaign";

function errorResponse(e: unknown, tag: string) {
  const msg = e instanceof Error ? e.message : String(e);
  const status = Number((e as { status?: unknown } | null)?.status);
  if (msg === "unauthorized" || msg === "forbidden") {
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
  console.error(`[challenge-metrics] ${tag}`, e);
  return NextResponse.json({ ok: false, error: msg }, { status: 500 });
}

/** GET /api/admin/challenge-metrics */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const data = await loadChallengeMetrics(getAdminDb());
    return NextResponse.json({
      ...data,
      copy: {
        youtubeJa: DECEMBER_2026_YOUTUBE_COPY_JA,
        xJa: DECEMBER_2026_X_COPY_JA,
      },
    });
  } catch (e) {
    return errorResponse(e, "GET");
  }
}

/** POST { action: "saveCosts" | "publishNotice", costs? } */
export async function POST(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      costs?: Record<string, unknown>;
    };
    const db = getAdminDb();
    if (body.action === "publishNotice") {
      const published = await publishDecember2026Notice(db);
      const data = await loadChallengeMetrics(db);
      return NextResponse.json({
        ...data,
        published,
        copy: {
          youtubeJa: DECEMBER_2026_YOUTUBE_COPY_JA,
          xJa: DECEMBER_2026_X_COPY_JA,
        },
      });
    }
    if (body.action === "saveCosts") {
      await saveChallengeCosts(db, body.costs ?? {});
      const data = await loadChallengeMetrics(db);
      return NextResponse.json({
        ...data,
        copy: {
          youtubeJa: DECEMBER_2026_YOUTUBE_COPY_JA,
          xJa: DECEMBER_2026_X_COPY_JA,
        },
      });
    }
    return NextResponse.json(
      { ok: false, error: "unknown_action" },
      { status: 400 }
    );
  } catch (e) {
    return errorResponse(e, "POST");
  }
}
