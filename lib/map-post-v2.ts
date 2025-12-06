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
   ★ V2 投稿データへ安全にマッピングする
============================================ */
export function mapRawToPredictionPostV2(raw: any): PredictionPostV2 {
  const id = isSnap(raw) ? raw.id : raw.id;
  const d: any = isSnap(raw) ? raw.data() : raw;

  return {
    id,

    authorUid: d?.authorUid ?? "",
    authorHandle: d?.authorHandle ?? null,

    author: {
      name: d?.authorName ?? d?.authorDisplayName ?? "ユーザー",
      avatarUrl: d?.authorAvatar ?? d?.authorPhotoURL ?? undefined,
    },

    gameId: d?.gameId ?? null,

    /* ← ★ 追加：game を正しく生成 */
    game: d?.game
      ? {
          league: d?.game?.league ?? "bj", // bj / nba のみ
          home: d?.game?.home ?? "",
          away: d?.game?.away ?? "",
          status: d?.game?.status ?? "scheduled",
          finalScore: d?.game?.finalScore ?? undefined,
        }
      : undefined,

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
