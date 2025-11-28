export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type UserHit = {
  id: string;
  displayName: string;
  handle: string;
  photoURL?: string;
  bio?: string;
};

function sanitizeQ(q: string | null): string {
  return (q ?? "").trim().slice(0, 50);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = sanitizeQ(searchParams.get("q"));

    if (!raw) {
      return NextResponse.json({
        users: [] as UserHit[],
      });
    }

    const q = raw.normalize("NFKC");
    const end = q + "\uf8ff";

    // displayName / handle の前方一致
    const [byNameSnap, byHandleSnap] = await Promise.all([
      adminDb
        .collection("users")
        .orderBy("displayName")
        .startAt(q)
        .endAt(end)
        .limit(12)
        .get(),

      adminDb
        .collection("users")
        .orderBy("handle")
        .startAt(q)
        .endAt(end)
        .limit(12)
        .get(),
    ]);

    const userMap = new Map<string, UserHit>();

    for (const doc of [...byNameSnap.docs, ...byHandleSnap.docs]) {
      const d = doc.data() || {};
      if (!d.displayName && !d.handle) continue;

      userMap.set(doc.id, {
        id: doc.id,
        displayName: d.displayName ?? "",
        handle: d.handle ?? "",
        photoURL: d.photoURL ?? "",
        bio: d.bio ?? "",
      });
    }

    const users = Array.from(userMap.values()).slice(0, 12);

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "search failed" },
      { status: 500 }
    );
  }
}
