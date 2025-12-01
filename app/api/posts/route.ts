// app/api/posts/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

/* ========= 型定義 ========= */
type League = "bj" | "j";
type Status = "scheduled" | "live" | "final";
type Outcome = "pending" | "hit" | "miss" | "void";
type LegKind = "main" | "secondary" | "tertiary";

type ParsedOk = {
  ok: true;
  gameId: string;
  startAtIsoClient?: string | null;
  legs: Array<{
    kind: LegKind;
    label: string;
    odds: number;
    pct: number; // 0..100
    outcome: Outcome;
  }>;
  note: string;
};
type ParsedNg = { ok: false; error: string };

/* ========= バリデーション ========= */
function isLegKind(v: any): v is LegKind {
  return v === "main" || v === "secondary" || v === "tertiary";
}
function isOutcome(v: any): v is Outcome {
  return v === "pending" || v === "hit" || v === "miss" || v === "void";
}

function sanitizeBody(body: any): ParsedOk | ParsedNg {
  try {
    const g = body?.game ?? {};
    const lgs = body?.legs ?? [];

    const gameId =
      typeof g.gameId === "string" && g.gameId.trim() ? g.gameId.trim() : null;
    if (!gameId) return { ok: false, error: "gameId required" };

    const startAtIsoClient =
      typeof g.startAtIso === "string" && g.startAtIso.trim()
        ? g.startAtIso.trim()
        : null;
    if (startAtIsoClient) {
      const ms = Date.parse(startAtIsoClient);
      if (Number.isNaN(ms)) return { ok: false, error: "invalid startAtIso" };
    }

    if (!Array.isArray(lgs) || lgs.length === 0) {
      return { ok: false, error: "legs required" };
    }
   const legs = lgs.map((x: any) => {
  if (!isLegKind(x?.kind)) throw new Error("invalid leg.kind");

  const optionId = String(x?.optionId ?? "").trim();
  if (!optionId) throw new Error("missing leg.optionId");

  const label = String(x?.label ?? "").trim();
  const odds = Number(x?.odds);
  const pct = Number(x?.pct);
  const outcome: Outcome = isOutcome(x?.outcome) ? x.outcome : "pending";

  if (!label) throw new Error("empty leg.label");
  if (!Number.isFinite(odds) || odds <= 1) throw new Error("invalid leg.odds");
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("invalid leg.pct");

  return {
    kind: x.kind as LegKind,
    optionId,         // ← ★ 必須
    label,
    odds,
    pct,
    outcome,
  };
});


    const sumPct = legs.reduce((acc: number, l: any) => acc + Number(l?.pct ?? 0), 0);
    if (sumPct !== 100) return { ok: false, error: "sum of pct must be 100" };

    const note = String(body?.note ?? "").slice(0, 2000);

    return { ok: true, gameId, startAtIsoClient, legs, note };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "bad payload" };
  }
}

/* ========= 補助: league 正規化（J1/J2/B1 なども受ける） ========= */
function normalizeLeague(v: any): League {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("j")) return "j";
  if (s.startsWith("b")) return "bj";
  return "bj";
}

/* ========= 補助: startAt を Timestamp に安全変換 ========= */
function toAdminTimestamp(v: any): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof v.toMillis === "function") {
    try {
      const ms = v.toMillis();
      return Timestamp.fromMillis(ms);
    } catch {}
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Timestamp.fromMillis(v);
  }
  if (typeof v === "string") {
    const ms = Date.parse(v);
    if (!Number.isNaN(ms)) return Timestamp.fromMillis(ms);
  }
  return null;
}

/* ========= 共通：認証して uid を返す（root でも使う） ========= */
async function requireUid(req: Request): Promise<string> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/* ========= GET /api/posts?gameId=xxx ========= */
/* 追記: 自分の「その試合の投稿」があるかを返す（リダイレクトに使用） */
export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json({ ok: false, error: "gameId required" }, { status: 400 });
    }

    const q = await adminDb
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "==", gameId)
      .limit(1)
      .get();

    if (q.empty) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const doc = q.docs[0];
    const data = doc.data() || {};
    const startAtMillis: number | null =
      typeof data.startAtMillis === "number" ? data.startAtMillis : null;
    const editable = !!startAtMillis ? Date.now() < startAtMillis : false;

    return NextResponse.json({
      ok: true,
      exists: true,
      postId: doc.id,
      editable,
    });
  } catch (e: any) {
    const status = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status });
  }
}

/* ========= POST /api/posts ========= */
export async function POST(req: Request) {
  // 1) JSON取得
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // 2) バリデーション
  const parsed = sanitizeBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  // 3) 認証（※ 重複禁止/開始後ロックのため必須に変更）
  let uid: string;
  try {
    uid = await requireUid(req);
  } catch {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 投稿者表示情報（任意）
  let authorDisplayName = "ユーザー";
  let authorPhotoURL: string | null = null;
  let authorHandle: string | null = null;
  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const u = userDoc.data() || {};
      authorDisplayName = u.displayName || authorDisplayName;
      authorPhotoURL = u.photoURL || u.avatarUrl || null;
      authorHandle =
      u.handle ||
      u.username ||
      u.slug ||
      null;
    }
  } catch {}

  // 4) games/{gameId} を参照して“正データ”を確定
  const gameId = parsed.gameId;
  const gameSnap = await adminDb.collection("games").doc(gameId).get();
  if (!gameSnap.exists) {
    return NextResponse.json({ ok: false, error: `game not found: ${gameId}` }, { status: 404 });
  }

  const g = gameSnap.data() as any;

  const league: League = normalizeLeague(g?.league);

  const startAtTs =
    toAdminTimestamp(g?.startAtJst) ??
    toAdminTimestamp(g?.startAt) ??
    null;

  if (!startAtTs) {
    return NextResponse.json(
      { ok: false, error: "game missing/invalid startAt/startAtJst" },
      { status: 500 }
    );
  }

  const startAtMillis = startAtTs.toMillis();
  const startAtIsoFromServer = new Date(startAtMillis).toISOString();

  // 4.5) ここで **開始後ロック** を適用（作成は不可）
  if (Date.now() >= startAtMillis) {
    return NextResponse.json(
      { ok: false, error: "locked: game started" },
      { status: 403 }
    );
  }

  // 4.6) ここで **重複禁止** を適用（同一 uid × gameId は1件のみ）
  const dup = await adminDb
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("gameId", "==", gameId)
    .limit(1)
    .get();

  if (!dup.empty) {
    // 既存IDを返してクライアント側で詳細へリダイレクトできるようにする
    const existingId = dup.docs[0].id;
    return NextResponse.json(
      { ok: false, error: "duplicate", existingId },
      { status: 409 }
    );
  }

  // 5) posts へ保存（サーバー権威データで上書き）
  const { legs, note } = parsed;

  const data = {
    // 投稿者
    authorUid: uid,
    authorDisplayName,
    authorPhotoURL,
    authorHandle,

    // メタ
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

    // ゲーム情報（サーバー側基準）
    gameId,
    league,                          // 正規化済み
    home: g?.home ?? null,
    away: g?.away ?? null,
    status: (g?.status as Status) || "scheduled",

    // キックオフ
    startAt: startAtTs,
    startAtMillis,
    startAtIso: startAtIsoFromServer,

    // 投稿内容
    legs, // pct は 0..100 のまま保存
    note,

    // 初期カウンタ
    likeCount: 0,
    saveCount: 0,
    resultUnits: null as number | null,
  };

  try {
    const ref = await adminDb.collection("posts").add(data);
    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/posts] add error:", e?.message ?? e);
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }
}
