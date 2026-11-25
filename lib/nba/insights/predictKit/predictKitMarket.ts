/**
 * Pro Pick に市場（マネーライン・合計・得点プロップ）を混ぜる純関数。
 * 画面には出さない。ブック名・アメリカンオッズ・ディープリンクは持たない。
 *
 * 市場はホーム・欠場・休養をすでに織り込んでいるので、既存の要因の上には足さない。
 * 当たる数字優先: オッズがある試合は勝率・合計・得点平均を市場へ強く縮小する。
 * 残りの UNITERZ はガベージ抜きの実力差と、ラインが動く前の欠場分。
 */
import { MATCHUP_DIFFICULTY_COEFFICIENTS as C } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import { normInv } from "@/lib/nba/matchupDifficulty/model";
import {
  withPredictKitOutlook,
  type PredictKit,
} from "@/lib/nba/insights/predictKit/predictKit";

type OddsRow = {
  moneyline_home_odds?: number | null;
  moneyline_away_odds?: number | null;
  total_value?: string | number | null;
};

type PropRow = {
  player_id?: number;
  prop_type?: string | null;
  line_value?: string | number | null;
  market?: { type?: string | null } | null;
};

/** 勝率を市場へ寄せる割合。当たる数字優先（ホーム・休養は市場に任せる） */
export const PREDICT_KIT_MARKET_WIN_W = 0.8;
/** 予想合計を O/U へ寄せる割合 */
export const PREDICT_KIT_MARKET_TOTAL_W = 0.8;
/** 得点王の平均を points O/U へ寄せる割合 */
export const PREDICT_KIT_MARKET_PROP_W = 0.8;

const FAIR_P_LO = 0.05;
const FAIR_P_HI = 0.95;
const TOTAL_LO = 180;
const TOTAL_HI = 280;
const PROP_LO = 4;
const PROP_HI = 50;

export type PredictKitMarketSnap = {
  v: 1;
  /** 控除を除いたホームの勝率。無ければ null */
  pHome: number | null;
  /** コンセンサス合計。無ければ null */
  total: number | null;
  /** マネーラインに使ったブック数 */
  books: number;
  /** 選手 ID（BDL）→ points O/U の中央値 */
  pointsLines: Record<string, number>;
  atMs: number;
};

export function americanToImplied(odds: number): number | null {
  if (!Number.isFinite(odds) || odds === 0) return null;
  if (odds < 0) {
    const a = -odds;
    return a / (a + 100);
  }
  return 100 / (odds + 100);
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function numLine(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** 1 試合ぶんのブック行 → コンセンサス（ベンダー名は捨てる） */
export function consensusMarketFromOdds(rows: readonly OddsRow[]): {
  pHome: number | null;
  total: number | null;
  books: number;
} {
  const fairs: number[] = [];
  const totals: number[] = [];
  for (const row of rows) {
    const pH = americanToImplied(Number(row.moneyline_home_odds));
    const pA = americanToImplied(Number(row.moneyline_away_odds));
    if (pH != null && pA != null && pH + pA > 0) {
      const fair = pH / (pH + pA);
      if (fair > 0 && fair < 1) fairs.push(fair);
    }
    const tot = numLine(row.total_value);
    if (tot != null && tot >= TOTAL_LO && tot <= TOTAL_HI) totals.push(tot);
  }
  const pHome = median(fairs);
  return {
    pHome: pHome == null ? null : Math.min(FAIR_P_HI, Math.max(FAIR_P_LO, pHome)),
    total: median(totals),
    books: fairs.length,
  };
}

/** points の over/under だけ。マイルストーンは平均の推定に使わない */
export function consensusPointsLines(rows: readonly PropRow[]): Record<string, number> {
  const byPlayer = new Map<string, number[]>();
  for (const row of rows) {
    if (row.prop_type !== "points") continue;
    if (String(row.market?.type ?? "") !== "over_under") continue;
    const pid = row.player_id;
    if (typeof pid !== "number" || !Number.isFinite(pid)) continue;
    const line = numLine(row.line_value);
    if (line == null || line < PROP_LO || line > PROP_HI) continue;
    const key = String(pid);
    const list = byPlayer.get(key) ?? [];
    list.push(line);
    byPlayer.set(key, list);
  }
  const out: Record<string, number> = {};
  for (const [id, lines] of byPlayer) {
    const m = median(lines);
    if (m != null) out[id] = Math.round(m * 10) / 10;
  }
  return out;
}

export function marketHomeMargin(pHome: number): number {
  const p = Math.min(FAIR_P_HI, Math.max(FAIR_P_LO, pHome));
  return C.sigma * normInv(p);
}

export function blendPredictKitWithMarket(
  kit: PredictKit,
  market: Pick<PredictKitMarketSnap, "pHome" | "total">,
  ids: { homeTeamId: string; awayTeamId: string }
): PredictKit {
  const homeMargin =
    market.pHome != null
      ? (1 - PREDICT_KIT_MARKET_WIN_W) * kit.homeMargin +
        PREDICT_KIT_MARKET_WIN_W * marketHomeMargin(market.pHome)
      : kit.homeMargin;
  const total =
    market.total != null
      ? (1 - PREDICT_KIT_MARKET_TOTAL_W) * kit.score.total + PREDICT_KIT_MARKET_TOTAL_W * market.total
      : kit.score.total;
  if (homeMargin === kit.homeMargin && total === kit.score.total) return kit;
  return withPredictKitOutlook(kit, { homeMargin, total, ...ids });
}

export function blendScorerMu(mu: number, propLine: number | undefined): number {
  if (propLine == null || !(propLine >= PROP_LO && propLine <= PROP_HI)) return mu;
  return (1 - PREDICT_KIT_MARKET_PROP_W) * mu + PREDICT_KIT_MARKET_PROP_W * propLine;
}

export function emptyPredictKitMarketSnap(atMs: number): PredictKitMarketSnap {
  return { v: 1, pHome: null, total: null, books: 0, pointsLines: {}, atMs };
}

/** 毎時の取り直し。これ未満の揺れはキットを触らない（通知の 10pt より小さい） */
export const PREDICT_KIT_MARKET_SHIFT = {
  winP: 0.02,
  total: 1,
  prop: 1,
} as const;

function pointsLinesOf(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[id] = v;
  }
  return out;
}

export function parsePredictKitMarketSnap(raw: unknown): PredictKitMarketSnap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const pHome = typeof o.pHome === "number" && Number.isFinite(o.pHome) ? o.pHome : null;
  const total = typeof o.total === "number" && Number.isFinite(o.total) ? o.total : null;
  const books = typeof o.books === "number" && Number.isFinite(o.books) ? o.books : 0;
  const atMs = typeof o.atMs === "number" && Number.isFinite(o.atMs) ? o.atMs : 0;
  return { v: 1, pHome, total, books, pointsLines: pointsLinesOf(o.pointsLines), atMs };
}

function marketHasSignal(m: PredictKitMarketSnap): boolean {
  return m.pHome != null || m.total != null || Object.keys(m.pointsLines).length > 0;
}

/** 新しいスナップに数字があり、前回から勝率・合計・得点ラインが閾値以上動いた */
export function predictKitMarketShifted(
  prevRaw: unknown,
  next: PredictKitMarketSnap | null | undefined
): boolean {
  if (!next || !marketHasSignal(next)) return false;
  const prev = parsePredictKitMarketSnap(prevRaw);
  if (!prev || !marketHasSignal(prev)) return true;
  const { winP, total: totDelta, prop } = PREDICT_KIT_MARKET_SHIFT;
  if (prev.pHome != null && next.pHome != null && Math.abs(next.pHome - prev.pHome) >= winP) {
    return true;
  }
  if (prev.total != null && next.total != null && Math.abs(next.total - prev.total) >= totDelta) {
    return true;
  }
  const ids = new Set([...Object.keys(prev.pointsLines), ...Object.keys(next.pointsLines)]);
  for (const id of ids) {
    const a = prev.pointsLines[id];
    const b = next.pointsLines[id];
    if (a == null && b == null) continue;
    if (a == null || b == null) return true;
    if (Math.abs(b - a) >= prop) return true;
  }
  return false;
}
