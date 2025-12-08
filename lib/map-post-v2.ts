// lib/map-post-v2.ts
import type { DocumentData, DocumentSnapshot } from "firebase/firestore";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

/* ============================================
   日付フォーマット
============================================ */
function formatPostDateShort(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const DD = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${MM}/${DD} ${hh}:${mm}`;
  } catch {
    return "";
  }
}

function getCreatedAtMillis(v: any): number {
  try {
    if (v?.toMillis) return v.toMillis();
    if (typeof v === "number") return v;
    if (v?._seconds) return v._seconds * 1000;
  } catch {}
  return 0;
}

function isSnap(x: any): x is DocumentSnapshot<DocumentData> {
  return x && typeof x.data === "function";
}

/* ============================================
   ★ 修正版: PredictionPostV2 の必須フィールドを返す
============================================ */
export function mapRawToPredictionPostV2(raw: any): PredictionPostV2 {
  const id = isSnap(raw) ? raw.id : raw.id;
  const d: any = isSnap(raw) ? raw.data() : raw;

  /* league の安全処理 */
  let leagueRaw = d?.league ?? d?.game?.league ?? "bj";
  if (leagueRaw === "j") leagueRaw = "j1";

  /* ------------------------------
     home / away を常にオブジェクト化（V2仕様）
  ------------------------------ */
  const home = {
    name: d?.home?.name ?? d?.home ?? d?.game?.home ?? "",
    teamId: d?.home?.teamId ?? "",
    number: d?.home?.number,
    record: d?.home?.record ?? null,
  };

  const away = {
    name: d?.away?.name ?? d?.away ?? d?.game?.away ?? "",
    teamId: d?.away?.teamId ?? "",
    number: d?.away?.number,
    record: d?.away?.record ?? null,
  };

  /* ------------------------------
     status の決定
  ------------------------------ */
  const status = d?.status ?? d?.game?.status ?? "scheduled";

  /* ------------------------------
     旧 game ブロック（互換用）
  ------------------------------ */
  const game = {
    league: leagueRaw,
    home: home.name,
    away: away.name,
    status,
    finalScore: d?.finalScore ?? d?.game?.finalScore ?? undefined,
  };

  /* ------------------------------
     PredictionPostV2 を返す（★必須をすべて含む）
  ------------------------------ */
  return {
    id,

    league: leagueRaw,
    status,

    home,
    away,

    authorUid: d?.authorUid ?? "",
    authorHandle: d?.authorHandle ?? null,

    author: {
      name: d?.authorName ?? d?.authorDisplayName ?? "ユーザー",
      avatarUrl: d?.authorAvatar ?? d?.authorPhotoURL ?? undefined,
    },

    gameId: d?.gameId ?? null,

    game, // optional 旧互換ブロック

    prediction: {
      winner: d?.prediction?.winner ?? "home",
      confidence: d?.prediction?.confidence ?? 50,
      score: {
        home: d?.prediction?.score?.home ?? 0,
        away: d?.prediction?.score?.away ?? 0,
      },
    },

    stats: {
      isWin: d?.stats?.isWin ?? null,
      upsetScore: d?.stats?.upsetScore ?? null,
    },

    note: d?.note ?? d?.comment ?? "",

    createdAtText: formatPostDateShort(d?.createdAt),
    createdAtMillis: getCreatedAtMillis(d?.createdAt),
  };
}
