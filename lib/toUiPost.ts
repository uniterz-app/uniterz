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

const normalizeLeague = (v: any): "bj" | "j1" | "nba" | "pl" => {
  const s = String(v ?? "").toLowerCase();
  if (s === "bj" || s === "b1") return "bj";
  if (s === "j" || s === "j1") return "j1";
  if (s === "nba") return "nba";
  if (s === "pl" || s === "premier" || s === "premierleague") return "pl";
  return "bj";
};

export function toUiPost(id: string, x: any): PredictionPostV2 {
  const createdAtMillis =
    x?.createdAt?.toMillis?.() ??
    (typeof x?.createdAt === "number" ? x.createdAt : null);

  const createdAtText = fmtCreatedAt(x?.createdAt);

  const league = normalizeLeague(x?.league ?? "bj");

  const status =
    x?.status === "live"
      ? ("live" as const)
      : x?.status === "final"
      ? ("final" as const)
      : ("scheduled" as const);

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

  const game = {
    league,
    home: home.name,
    away: away.name,
    status,
    finalScore: x?.finalScore ?? x?.game?.finalScore ?? null,
  };

  const winner =
    x?.prediction?.winner === "home" ||
    x?.prediction?.winner === "away" ||
    x?.prediction?.winner === "draw"
      ? x.prediction.winner
      : "home";

  const prediction = {
    winner,
    score: {
      home: Number(x?.prediction?.score?.home ?? 0),
      away: Number(x?.prediction?.score?.away ?? 0),
    },
  };

  const stats = x?.stats
    ? {
        isWin: typeof x.stats.isWin === "boolean" ? x.stats.isWin : null,
        hadUpsetGame: x.stats.hadUpsetGame === true,
        upsetHit: x.stats.upsetHit === true,
        scoreError:
          typeof x.stats.scoreError === "number" ? x.stats.scoreError : null,
        scorePrecision:
          typeof x.stats.scorePrecision === "number"
            ? x.stats.scorePrecision
            : null,
        scorePrecisionDetail: x.stats.scorePrecisionDetail ?? null,
        marketCount:
          typeof x.stats.marketCount === "number" ? x.stats.marketCount : null,
        marketMajority:
          x.stats.marketMajority === "home" ||
          x.stats.marketMajority === "away" ||
          x.stats.marketMajority === "draw"
            ? x.stats.marketMajority
            : null,
        isMajorityPick:
          typeof x.stats.isMajorityPick === "boolean"
            ? x.stats.isMajorityPick
            : undefined,
        marketBias:
          typeof x.stats.marketBias === "number" ? x.stats.marketBias : null,
        upsetPoints:
          typeof x.stats.upsetPoints === "number" ? x.stats.upsetPoints : null,
        pointsV3:
          typeof x.stats.pointsV3 === "number" ? x.stats.pointsV3 : null,
        pointsV3Detail: x.stats.pointsV3Detail ?? null,
        rankingReady:
          typeof x.stats.rankingReady === "boolean"
            ? x.stats.rankingReady
            : undefined,
        rankingFactor:
          x.stats.rankingFactor === 0 || x.stats.rankingFactor === 1
            ? x.stats.rankingFactor
            : undefined,
      }
    : null;

  const author = x?.author
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

    gameId: x?.gameId ?? "",

    game,

    prediction,

    note:
      typeof x?.note === "string"
        ? x.note
        : typeof x?.comment === "string"
        ? x.comment
        : "",

    stats,
  };
}