// lib/toUiPost.ts
import type { PredictionPost, PredictionLeg } from "@/app/component/post/PredictionPostCard";

/* ---- 内部 util ---- */
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

/* ---- メイン：Firestore → PredictionPost に変換 ---- */
export function toUiPost(id: string, x: any): PredictionPost {
  const g = x?.game ?? {};

  const league = g.league ?? x.league ?? "bj";
  const home = pickName(g.home ?? x.home);
  const away = pickName(g.away ?? x.away);
  const status = String(g.status ?? x.status ?? "scheduled").toLowerCase();
  const finalScore = g.finalScore ?? x.finalScore ?? undefined;

  const legs: PredictionLeg[] = Array.isArray(x?.legs)
    ? x.legs
        .map((l: any) => ({
          kind:
            l?.kind === "secondary"
              ? "secondary"
              : l?.kind === "tertiary"
              ? "tertiary"
              : "main",
          label: String(l?.label ?? ""),
          odds: Number(l?.odds ?? 0),
          pct: Number(l?.pct ?? 0),
          outcome:
            l?.outcome === "hit" ||
            l?.outcome === "miss" ||
            l?.outcome === "void"
              ? l.outcome
              : "pending",
        }))
        .filter((l: PredictionLeg) => l.label && Number.isFinite(l.odds))
    : [];

  return {
    id,
    author: x?.authorDisplayName
      ? {
          name: x.authorDisplayName,
          avatarUrl: x.authorPhotoURL ?? undefined,
        }
      : undefined,

    createdAtText: fmtCreatedAt(x?.createdAt),

    game:
      league && (home || away)
        ? ({ league, home, away, status, finalScore } as any)
        : undefined,
        gameId: x?.game?.gameId ?? x?.gameId ?? null,
        legs,

    resultUnits: typeof x?.resultUnits === "number" ? x.resultUnits : null,
    note: typeof x?.note === "string" ? x.note : "",

    authorUid: x?.authorUid ?? null,
    authorHandle: x?.authorHandle ?? null,
    startAtMillis: typeof x?.startAtMillis === "number" ? x.startAtMillis : null,

    likeCount: Number.isFinite(x?.likeCount) ? Number(x.likeCount) : 0,
    saveCount: Number.isFinite(x?.saveCount) ? Number(x.saveCount) : 0,
  };
}
