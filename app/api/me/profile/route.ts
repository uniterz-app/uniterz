export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeLanguage } from "@/lib/i18n/language";
import { FALLBACK_TIMEZONE_BY_LANGUAGE } from "@/lib/i18n/countryTimezone";
import {
  assertProfileTextsFreeOfGamblingTerms,
  isProfileGamblingTermsError,
} from "@/lib/profile/profileGamblingTerms";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/**
 * クライアントの Firestore ルールに依存せず、本人の users/{uid} の公開プロフィール欄を更新する。
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const lang = normalizeLanguage(body.language);
    if (!lang) {
      return NextResponse.json({ error: "invalid language" }, { status: 400 });
    }

    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.slice(0, 50)
        : "";
    const bio =
      typeof body.bio === "string" ? body.bio.slice(0, 500) : "";

    try {
      assertProfileTextsFreeOfGamblingTerms(displayName, bio);
    } catch (e: unknown) {
      if (isProfileGamblingTermsError(e)) {
        return NextResponse.json(
          { error: "forbidden_gambling_terms" },
          { status: 400 }
        );
      }
      throw e;
    }
    const photoURL =
      typeof body.photoURL === "string" ? body.photoURL.slice(0, 4096) : "";

    let countryCode: string | null = null;
    if (body.countryCode === null || body.countryCode === "") {
      countryCode = null;
    } else if (typeof body.countryCode === "string") {
      countryCode = body.countryCode.trim().slice(0, 8) || null;
    }

    let photoCropY: number | undefined;
    if (typeof body.photoCropY === "number" && Number.isFinite(body.photoCropY)) {
      photoCropY = Math.max(0, Math.min(100, body.photoCropY));
    }

    const completeOnboarding = body.completeOnboarding === true;

    const patch: Record<string, unknown> = {
      displayName,
      bio,
      photoURL,
      language: lang,
      locale: lang,
      timeZone: FALLBACK_TIMEZONE_BY_LANGUAGE[lang],
      countryCode,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (photoCropY !== undefined) {
      patch.photoCropY = photoCropY;
    }
    if (completeOnboarding) {
      patch.onboardingCompletedAt = FieldValue.serverTimestamp();
    }

    await getAdminDb().doc(`users/${uid}`).set(patch, { merge: true });

    // 累積ランキング API（unstable_cache）が users.countryCode の更新より古い JSON を返さないようにする
    revalidateTag("cumulative-ranking", {});

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("POST /api/me/profile:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
