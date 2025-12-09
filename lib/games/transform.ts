// app/lib/games/transform.ts
import { teamColorsB1 } from "@/lib/teams-b1";
import { teamColorsNBA } from "@/lib/teams-nba";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import type { Status, TeamSide, MatchCardProps } from "@/app/component/games/MatchCard";

// --------------------------------------------------------
// gamePath の参照
// --------------------------------------------------------
let gamePath: { predict: (id: string) => string; predictions: (id: string) => string } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  gamePath = require("@/lib/game-paths").gamePath ?? null;
} catch {}

/** 不正値を Date|null に丸める */
export const toDateOrNull = (v: any): Date | null => {
  if (v instanceof Date) return v;
  if (v?.toDate && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(+d) ? d : null;
  }
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
};

/** ステータス正規化 */
export const toStatus = (s: any): Status => {
  const t = String(s ?? "scheduled").toLowerCase();
  if (t === "live" || t === "inprogress") return "live";
  if (t === "final" || t === "ended") return "final";
  return "scheduled";
};

/** リーグ別カラー辞書からカラーを引く */
export const pickTeamColor = (league: League, name?: string) => {
  if (!name) return undefined;

  if (league === "bj") {
    return teamColorsB1[name]?.primary;
  }
  if (league === "nba") {
    return teamColorsNBA[name]?.primary;
  }

  return undefined;
};

/** TeamSide 正規化（record / number を削除） */
export const toTeamSide =
  (league: League) =>
  (v: any): TeamSide =>
    typeof v === "string"
      ? {
          name: v,
          teamId: undefined,
          colorHex: pickTeamColor(league, v),
        }
      : {
          name: v?.name ?? "",
          teamId: v?.teamId,
          colorHex: pickTeamColor(league, v?.name),
        };

/** スコア正規化 */
export const toScore = (s: any): { home: number; away: number } | null =>
  s
    ? "home" in s || "away" in s
      ? { home: Number(s.home ?? 0), away: Number(s.away ?? 0) }
      : "h" in s || "a" in s
      ? { home: Number(s.h ?? 0), away: Number(s.a ?? 0) }
      : null
    : null;

/** LIVE / FINAL メタは不要なので常に null にする */
export const toLiveMeta = (_m: any) => null;
export const toFinalMeta = (_m: any) => null;

/** startAt を JST Date に寄せる */
export const normalizeStartAtJst = (g: any): Date | null => {
  return (
    toDateOrNull(g?.startAtJst) ??
    toDateOrNull(g?.startAt) ??
    toDateOrNull(g?.kickoffJst) ??
    null
  );
};

/** 生 Firestore ドキュメント型 */
export type GameDoc = {
  id: string;
  league?: any;
  venue?: string;
  roundLabel?: string;
  startAtJst?: any;
  startAt?: any;
  status?: any;
  home?: any;
  away?: any;
  score?: any;
  homeScore?: number;
  awayScore?: number;
  liveMeta?: any;
  finalMeta?: any;
};

/** MatchCardProps へ整形 */
export function toMatchCardProps(
  raw: GameDoc,
  opts?: {
    dense?: boolean;
    hrefs?: {
      view?: (id: string) => string;
      make?: (id: string) => string;
    };
  }
): Omit<MatchCardProps, "hideLine" | "hideActions"> {
  const id = String(raw?.id ?? "");
  const league = normalizeLeague(raw?.league);
  const startAtJst = normalizeStartAtJst(raw);
  const status = toStatus(raw?.status);
  const home = toTeamSide(league)(raw?.home);
  const away = toTeamSide(league)(raw?.away);

  // --------------------------------------------------------
  // ★ スコア補完（そのまま維持）
  // --------------------------------------------------------
  let score = toScore(raw?.score);

  if (!score) {
    const hs = raw?.homeScore;
    const as = raw?.awayScore;

    if (typeof hs === "number" && typeof as === "number") {
      score = { home: hs, away: as };
    }
  }

  const liveMeta = toLiveMeta(raw?.liveMeta);
  const finalMeta = toFinalMeta(raw?.finalMeta);

  // href ビルダー（そのまま維持）
  const buildView =
    opts?.hrefs?.view ??
    (gamePath ? gamePath.predictions : (gid: string) => `/web/games/${gid}/predictions`);
  const buildMake =
    opts?.hrefs?.make ??
    (gamePath ? gamePath.predict : (gid: string) => `/web/games/${gid}/predict`);

  return {
    id,
    league,
    venue: raw?.venue ?? "",
    roundLabel: raw?.roundLabel ?? "",
    startAtJst,
    status,
    home,
    away,
    score,
    liveMeta,
    finalMeta,

    // V2では MatchCard が自前でリンク生成するため不要
    viewPredictionHref: "",
    makePredictionHref: "",

    dense: Boolean(opts?.dense),
  };
}
