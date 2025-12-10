// lib/toUiPost.ts
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const pickName = (v: any) => (typeof v === "string" ? v : v?.name ?? "");

function fmtCreatedAt(ts?: any): string {
  let d: Date | null = null;

  if (ts?.toDate) d = ts.toDate();
  else if (typeof ts === "number") d = new Date(ts);

  if (!d) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const normalizeLeague = (v: any): "bj" | "j1" | "nba" => {
  const s = String(v ?? "").toLowerCase();
  if (s === "bj" || s === "b1") return "bj";
  if (s === "j" || s === "j1") return "j1";
  if (s === "nba") return "nba";
  return "bj";
};

export function toUiPost(id: string, x: any): PredictionPostV2 {
  const createdAtMillis =
    x?.createdAt?.toMillis?.() ??
    (typeof x?.createdAt === "number" ? x.createdAt : null);

  const createdAtText = fmtCreatedAt(x?.createdAt);

  /* ----------------------------
     league / status（literal化）
  ---------------------------- */
  const league = normalizeLeague(x?.league ?? "bj");

  const status =
    x?.status === "live"
      ? ("live" as const)
      : x?.status === "final"
      ? ("final" as const)
      : ("scheduled" as const);

  /* ----------------------------
     team objects（絶対オブジェクト化）
  ---------------------------- */
  const rawHome = x?.home ?? x?.game?.home ?? {};
  const rawAway = x?.away ?? x?.game?.away ?? {};

  const home = {
    name: pickName(rawHome),
    teamId: rawHome?.teamId ?? "",
    number: rawHome?.number,
    record: rawHome?.record ?? null,
  };

  const away = {
    name: pickName(rawAway),
    teamId: rawAway?.teamId ?? "",
    number: rawAway?.number,
    record: rawAway?.record ?? null,
  };

  /* ----------------------------
     old game block（UI補助用）
  ---------------------------- */
  const game = {
    league,
    home: home.name,
    away: away.name,
    status: status, // ← literal 型のまま
    finalScore: x?.finalScore ?? x?.game?.finalScore ?? null,
  };

  /* ----------------------------
     prediction（literal化）
  ---------------------------- */
  /* winner は prediction.winner ではなく score.winner を使う */
const winner =
  x?.prediction?.winner === "home" || x?.prediction?.winner === "away"
    ? x.prediction.winner
    : null;

  const prediction = {
  winner,
  confidence: Number(x?.prediction?.confidence ?? 50),

  // ★ 正しくは x.score から取る
  score: {
  home: Number(x?.prediction?.score?.home ?? 0),
  away: Number(x?.prediction?.score?.away ?? 0),
},
};

  /* ----------------------------
     stats
  ---------------------------- */
  const stats =
    x?.stats
      ? {
          isWin:
            typeof x.stats.isWin === "boolean" ? x.stats.isWin : null,
          upsetScore:
            typeof x.stats.upsetScore === "number"
              ? x.stats.upsetScore
              : null,
        }
      : null;

  /* ----------------------------
     author
  ---------------------------- */
  const author =
    x?.author
      ? {
          name: x.author?.name ?? "ユーザー",
          avatarUrl: x.author?.avatarUrl ?? undefined,
        }
      : x?.authorDisplayName
      ? {
          name: x.authorDisplayName,
          avatarUrl: x.authorPhotoURL ?? undefined,
        }
      : null;

  /* ----------------------------
     最終的に PredictionPostV2 を返す
  ---------------------------- */
  return {
    id,

    league,
    status,

    home,
    away,

    authorUid: x?.authorUid ?? null,
    authorHandle: x?.authorHandle ?? null,
    author,

    createdAtText,
    createdAtMillis,

    gameId: x?.gameId ?? null,
    game,

    prediction,
    note:
  typeof x?.note === "string"
    ? x.note
    : typeof x?.comment === "string"
    ? x.comment
    : "",

    likeCount: Number(x?.likeCount ?? 0),
    saveCount: Number(x?.saveCount ?? 0),

    stats,
  };
}
