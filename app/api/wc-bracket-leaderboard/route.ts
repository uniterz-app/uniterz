import { NextResponse } from "next/server";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import {
  normalizeWcSurvivalFields,
  wcSurvivalRankKey,
} from "@/lib/wc/wc-bracket-survival-rank";
import { teamIdToWcCountry } from "@/lib/wc/wcCountry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT_DEFAULT = 30;
const LIMIT_MAX = 50;

export type WcBracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan: "free" | "pro";
  rank: number;
  alive: boolean;
  survivedRounds: number;
  firstMissMatchId: WcBracketPredictMatchId | null;
  championPick?: string | null;
  championTeamId?: string | null;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  totalCount?: number;
  rows?: WcBracketLeaderboardRow[];
  myRow?: WcBracketLeaderboardRow | null;
  hasMore?: boolean;
  nextCursor?: string | null;
  error?: string;
};

function encodeCursor(docId: string): string {
  return Buffer.from(JSON.stringify({ i: docId }), "utf8").toString("base64url");
}

function decodeCursor(raw: string): { i: string } | null {
  try {
    const j = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as unknown;
    if (
      j &&
      typeof j === "object" &&
      "i" in j &&
      typeof (j as { i: unknown }).i === "string"
    ) {
      return { i: (j as { i: string }).i };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function championDisplayCode(teamId: string | null): string | null {
  if (!teamId?.trim()) return null;
  const c = teamIdToWcCountry(teamId);
  if (c?.iso2) return c.iso2.toUpperCase().replace("GB-", "");
  return teamId.replace(/^wc-/, "").toUpperCase().slice(0, 3);
}

function parseBracketDoc(data: FirebaseFirestore.DocumentData) {
  const uid = typeof data.uid === "string" ? data.uid.trim() : "";
  if (!uid) return null;

  const survival = normalizeWcSurvivalFields({
    alive: Boolean(data.alive),
    survivedRounds: Number(data.survivedRounds ?? 0),
    firstMissMatchId:
      typeof data.firstMissMatchId === "string" && data.firstMissMatchId.trim()
        ? (data.firstMissMatchId.trim() as WcBracketPredictMatchId)
        : null,
  });

  const rawChampion =
    typeof data.championPick === "string" && data.championPick.trim()
      ? data.championPick.trim()
      : typeof data.bracket?.M104?.winner === "string" &&
          data.bracket.M104.winner.trim()
        ? data.bracket.M104.winner.trim()
        : null;

  return {
    uid,
    survival,
    rankKey:
      typeof data.survivalRankKey === "number" && Number.isFinite(data.survivalRankKey)
        ? data.survivalRankKey
        : wcSurvivalRankKey(survival),
    championTeamId: rawChampion,
    championPick: championDisplayCode(rawChampion),
  };
}

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const season = (searchParams.get("season") ?? WC_KNOCKOUT_SEASON).trim();
    const uid = (searchParams.get("uid") ?? "").trim();

    if (!season) {
      return NextResponse.json(
        { ok: false, error: "season is required" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    let limit = LIMIT_DEFAULT;
    const limitRaw = searchParams.get("limit");
    if (limitRaw) {
      const n = parseInt(limitRaw, 10);
      if (Number.isFinite(n)) {
        limit = Math.min(LIMIT_MAX, Math.max(1, n));
      }
    }

    let startRank = 1;
    const startRankRaw = searchParams.get("startRank");
    if (startRankRaw) {
      const r = parseInt(startRankRaw, 10);
      if (Number.isFinite(r) && r >= 1) startRank = r;
    }

    const cursorRaw = searchParams.get("cursor")?.trim() ?? "";
    let cursorSnap: DocumentSnapshot | null = null;
    if (cursorRaw) {
      const cursorDecoded = decodeCursor(cursorRaw);
      if (!cursorDecoded?.i) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      const cur = await adminDb.collection("wcBrackets").doc(cursorDecoded.i).get();
      if (!cur.exists) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      if (String(cur.data()?.season ?? "") !== season) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      cursorSnap = cur;
    }

    const fetchCap = Math.min(limit + 1, LIMIT_MAX + 1);

    const baseQuery = adminDb
      .collection("wcBrackets")
      .where("season", "==", season)
      .orderBy("alive", "desc")
      .orderBy("survivedRounds", "desc");

    const totalCountSnap = await baseQuery.count().get();
    const totalCount = totalCountSnap.data().count;

    let query = baseQuery.limit(fetchCap);
    if (cursorSnap) {
      query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    type Entry = NonNullable<ReturnType<typeof parseBracketDoc>>;

    const entries: Entry[] = pageDocs
      .map((doc) => {
        const data = doc.data();
        if (data.isSubmitted === false) return null;
        return parseBracketDoc(data);
      })
      .filter((b): b is Entry => b !== null)
      .sort((a, b) => b.rankKey - a.rankKey);

    const uids = [...new Set(entries.map((b) => b.uid))];
    const userMap = new Map<
      string,
      {
        displayName: string;
        handle: string | null;
        photoURL: string | null;
        plan: "free" | "pro";
      }
    >();

    const BATCH_SIZE = 100;
    for (let i = 0; i < uids.length; i += BATCH_SIZE) {
      const batch = uids.slice(i, i + BATCH_SIZE);
      const refs = batch.map((id) => adminDb.collection("users").doc(id));
      const snaps = await adminDb.getAll(...refs);
      snaps.forEach((userSnap, idx) => {
        const id = batch[idx];
        if (!id) return;
        const u = userSnap.data() as
          | {
              displayName?: string;
              handle?: string;
              photoURL?: string;
              avatarUrl?: string;
              plan?: string;
            }
          | undefined;
        userMap.set(id, {
          displayName: u?.displayName?.trim() ?? "User",
          handle: u?.handle?.trim() ?? null,
          photoURL: u?.photoURL ?? u?.avatarUrl ?? null,
          plan: u?.plan === "pro" ? "pro" : "free",
        });
      });
    }

    const rows: WcBracketLeaderboardRow[] = entries.map((b, index) => {
      const user = userMap.get(b.uid);
      return {
        uid: b.uid,
        displayName: user?.displayName ?? "User",
        handle: user?.handle ?? null,
        photoURL: user?.photoURL ?? null,
        plan: user?.plan ?? "free",
        rank: startRank + index,
        alive: b.survival.alive,
        survivedRounds: b.survival.survivedRounds,
        firstMissMatchId: b.survival.firstMissMatchId,
        championPick: b.championPick,
        championTeamId: b.championTeamId,
      };
    });

    const lastDoc = pageDocs[pageDocs.length - 1];
    const nextCursor = hasMore && lastDoc ? encodeCursor(lastDoc.id) : null;

    let myRow: WcBracketLeaderboardRow | null = null;
    if (uid) {
      const myDocId = `${season}_${uid}`;
      const mySnap = await adminDb.collection("wcBrackets").doc(myDocId).get();
      if (mySnap.exists) {
        const parsed = parseBracketDoc(mySnap.data() ?? {});
        if (parsed) {
          const myKey = parsed.rankKey;
          const allSnap = await adminDb
            .collection("wcBrackets")
            .where("season", "==", season)
            .get();
          let higher = 0;
          for (const d of allSnap.docs) {
            if (d.data().isSubmitted === false) continue;
            const p = parseBracketDoc(d.data());
            if (p && p.rankKey > myKey) higher += 1;
          }
          const higherCountSnap = { data: () => ({ count: higher }) };

          const myRank = Number(higherCountSnap.data().count ?? 0) + 1;
          const myUserSnap = await adminDb.collection("users").doc(uid).get();
          const myUser = myUserSnap.data() as
            | {
                displayName?: string;
                handle?: string;
                photoURL?: string;
                avatarUrl?: string;
                plan?: string;
              }
            | undefined;

          myRow = {
            uid,
            displayName: myUser?.displayName?.trim() ?? "You",
            handle: myUser?.handle?.trim() ?? null,
            photoURL: myUser?.photoURL ?? myUser?.avatarUrl ?? null,
            plan: myUser?.plan === "pro" ? "pro" : "free",
            rank: myRank,
            alive: parsed.survival.alive,
            survivedRounds: parsed.survival.survivedRounds,
            firstMissMatchId: parsed.survival.firstMissMatchId,
            championPick: parsed.championPick,
            championTeamId: parsed.championTeamId,
          };
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        season,
        count: rows.length,
        totalCount,
        rows,
        myRow,
        hasMore,
        nextCursor,
      } satisfies ApiResponse,
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
