// app/lib/games/transform.ts
import { teamColorsB1 } from "@/lib/teams-b1";
import { teamColorsNBA } from "@/lib/teams-nba";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import type {
  Status,
  TeamSide,
  MatchCardProps,
} from "@/app/component/games/MatchCard";
import {
  parseSeriesStandingFromRaw,
  isPlayoffStyleGameCard,
} from "@/lib/games/playoffSeriesUi";

/** プレーオフ：Firestore に seriesStanding が無いときの既定（0-0） */
const PLAYOFF_SERIES_STANDING_FALLBACK = { homeWins: 0, awayWins: 0 } as const;

// --------------------------------------------------------
// gamePath の参照
// --------------------------------------------------------
let gamePath: {
  predict: (id: string) => string;
  predictions: (id: string) => string;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  gamePath = require("@/lib/game-paths").gamePath ?? null;
} catch {}

/** 不正値を Date|null に丸める */
export const toDateOrNull = (v: any): Date | null => {
  if (v instanceof Date) return v;

  if (v?.toDate && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(+d) ? d : null;
  }

  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(+d) ? null : d;
  }

  return null;
};

/** ステータス文字列のみを正規化（ドキュメント全体は toStatusFromGameDoc） */
export const toStatus = (s: any): Status => {
  const t = String(s ?? "scheduled").toLowerCase();
  if (t === "live" || t === "inprogress") return "live";
  if (t === "final" || t === "ended") return "final";
  return "scheduled";
};

/**
 * Firestore の games ドキュメント用。
 * `final: true` なのに `status` が scheduled のまま等のときも final とみなす。
 */
export function toStatusFromGameDoc(raw: Record<string, unknown> | null | undefined): Status {
  if (!raw) return "scheduled";
  if (raw.final === true || raw.final === 1) return "final";
  return toStatus(raw.status);
}

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

/**
 * Firestore の games 生データからスコアを取得（MatchCard / 絞り込みで共通）。
 * score オブジェクトに無い場合は homeScore / awayScore を参照する。
 */
export function getResolvedGameScore(
  raw: Record<string, unknown> | null | undefined,
): { home: number; away: number } | null {
  if (!raw) return null;
  let score = toScore(raw.score);
  if (!score && raw.score && typeof raw.score === "object") {
    const fin = (raw.score as { final?: { home?: unknown; away?: unknown } })
      .final;
    if (
      fin &&
      typeof fin.home === "number" &&
      typeof fin.away === "number"
    ) {
      score = { home: fin.home, away: fin.away };
    }
  }
  if (!score) {
    const hs = raw.homeScore;
    const as = raw.awayScore;
    if (typeof hs === "number" && typeof as === "number") {
      score = { home: hs, away: as };
    } else if (hs != null && as != null) {
      const h = Number(hs);
      const a = Number(as);
      if (Number.isFinite(h) && Number.isFinite(a)) {
        score = { home: h, away: a };
      }
    }
  }
  if (!score) {
    const fs = raw.finalScore as { home?: unknown; away?: unknown } | undefined;
    if (fs && fs.home != null && fs.away != null) {
      const h = Number(fs.home);
      const a = Number(fs.away);
      if (Number.isFinite(h) && Number.isFinite(a)) score = { home: h, away: a };
    }
  }
  if (!score) {
    const r = raw.result as { home?: unknown; away?: unknown } | undefined;
    if (r && r.home != null && r.away != null) {
      const h = Number(r.home);
      const a = Number(r.away);
      if (Number.isFinite(h) && Number.isFinite(a)) score = { home: h, away: a };
    }
  }
  return score;
}

/** LIVE / FINAL メタは不要なので常に null にする */
export const toLiveMeta = (_m: any) => null;
export const toFinalMeta = (_m: any) => null;

function normalizeSeasonPhase(
  raw: unknown
): MatchCardProps["seasonPhase"] {
  if (raw === "regular" || raw === "play_in" || raw === "playoffs") {
    return raw;
  }
  return null;
}

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
  /** true のとき試合終了（status が未更新でも final 扱いに使う） */
  final?: boolean;
  home?: any;
  away?: any;
  score?: any;
  homeScore?: number;
  awayScore?: number;
  finalScore?: { home?: number; away?: number };
  result?: { home?: number; away?: number };
  /** false = ランキング集計から除外（例: プレーイン）。未設定は true 扱い */
  countsForRanking?: boolean;
  liveMeta?: any;
  finalMeta?: any;

  // market bias 候補
  marketBias?: {
    homePct?: number;
    awayPct?: number;
  };
  market?: {
    homePct?: number;
    awayPct?: number;
    homeRate?: number;
    awayRate?: number;
  };
  homePct?: number;
  awayPct?: number;
  seasonPhase?: unknown;
  seriesHomeWins?: unknown;
  seriesAwayWins?: unknown;
  series?: unknown;
  seriesStanding?: unknown;
  seriesRecord?: unknown;
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
  const status = toStatusFromGameDoc(raw as Record<string, unknown>);
  const home = toTeamSide(league)(raw?.home);
  const away = toTeamSide(league)(raw?.away);

  // --------------------------------------------------------
  // スコア補完
  // --------------------------------------------------------
  const score = getResolvedGameScore(raw as Record<string, unknown>);
  const seasonPhase = normalizeSeasonPhase(raw?.seasonPhase);
  const roundLabelStr = raw?.roundLabel ?? "";
  const parsedSeries = parseSeriesStandingFromRaw(
    raw as Record<string, unknown>
  );
  /** プレーオフのみ。未連携時は 0-0 フォールバック */
  const seriesStanding = isPlayoffStyleGameCard(seasonPhase, roundLabelStr)
    ? (parsedSeries ?? PLAYOFF_SERIES_STANDING_FALLBACK)
    : null;

  const liveMeta = toLiveMeta(raw?.liveMeta);
  const finalMeta = toFinalMeta(raw?.finalMeta);

  // href ビルダー（互換維持）
  const buildView =
    opts?.hrefs?.view ??
    (gamePath
      ? gamePath.predictions
      : (gid: string) => `/web/games/${gid}/predictions`);

  const buildMake =
    opts?.hrefs?.make ??
    (gamePath
      ? gamePath.predict
      : (gid: string) => `/web/games/${gid}/predict`);

  // --------------------------------------------------------
  // marketBias 抽出
  // --------------------------------------------------------
  const homePct = Math.max(
    0,
    Math.min(
      100,
      Number(
        raw?.marketBias?.homePct ??
          raw?.market?.homePct ??
          raw?.market?.homeRate ??
          raw?.homePct ??
          50
      )
    )
  );

  const awayPct = Math.max(
    0,
    Math.min(
      100,
      Number(
        raw?.marketBias?.awayPct ??
          raw?.market?.awayPct ??
          raw?.market?.awayRate ??
          raw?.awayPct ??
          50
      )
    )
  );

  return {
    id,
    league,
    seasonPhase,
    venue: raw?.venue ?? "",
    roundLabel: roundLabelStr,
    startAtJst,
    status,
    home,
    away,
    score,
    seriesStanding,
    liveMeta,
    finalMeta,

    marketBias: {
      homePct,
      awayPct,
    },

    // V2では MatchCard が自前でリンク生成するため不要
    viewPredictionHref: buildView(id),
    makePredictionHref: buildMake(id),

    dense: Boolean(opts?.dense),
  };
}