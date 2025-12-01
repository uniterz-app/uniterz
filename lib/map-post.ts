// lib/map-post.ts
import type { DocumentData, DocumentSnapshot } from "firebase/firestore";
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";
import type { League } from "@/app/component/games/MatchCard";

type Raw = DocumentSnapshot<DocumentData> | (DocumentData & { id?: string });

/* ============================================
   表示用短縮フォーマット "11/20 18:05"
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

export function mapRawToPredictionPost(raw: Raw): PredictionPost {
  const id = (isSnap(raw) ? raw.id : raw.id) as string;
  const d: any = isSnap(raw) ? raw.data() : raw;

  // Firestore旧スキーマ対策
  const league: League = d?.league ?? d?.game?.league ?? "bj";
  const home = d?.game?.home ?? d?.homeTeam ?? d?.home ?? "";
  const away = d?.game?.away ?? d?.awayTeam ?? d?.away ?? "";

  const game = {
    league,
    home,
    away,
    status: d?.game?.status ?? "scheduled",
  };

  const legs = Array.isArray(d?.legs)
    ? d.legs
    : Array.isArray(d?.picks)
    ? d.picks.map((p: any, i: number) => ({
        kind: i === 0 ? "main" : i === 1 ? "secondary" : "tertiary",
        label: p?.label ?? p?.text ?? "",
        odds: p?.odds ?? 0,
        pct: p?.pct ?? 0,
        outcome: p?.outcome ?? "pending",
      }))
    : [];

  return {
    id,
    author: {
      name: d?.authorDisplayName ?? "ユーザー",
      avatarUrl: d?.authorPhotoURL,
    },

    // ★ createdAt → テキストへ (ここだけ追加)
    createdAtText: formatPostDateShort(d?.createdAt),

    createdAtMillis:
  d?.createdAt && typeof d.createdAt.toMillis === "function"
    ? d.createdAt.toMillis()
    : d?.createdAt?._seconds
    ? d.createdAt._seconds * 1000
    : 0,

     gameId: d?.game?.gameId ?? d?.gameId ?? null,

    game,
    legs,
    resultUnits: d?.resultUnits ?? null,
    note: d?.note ?? "",
    authorUid: d?.authorUid ?? null,
    authorHandle: d?.authorHandle ?? null,
    startAtMillis: d?.startAtMillis ?? null,
    likeCount: d?.likeCount ?? 0,
    saveCount: d?.saveCount ?? 0,
  };
}

function isSnap(x: any): x is DocumentSnapshot<DocumentData> {
  return x && typeof x.data === "function";
}

