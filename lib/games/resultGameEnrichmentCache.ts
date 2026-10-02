/**
 * Result list enrichment: games をまとめて取り、market / pk / detail 用にキャッシュする。
 */
import {
  collection,
  documentId,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { resolvePkScore, type PkScore } from "@/lib/games/pkScore";
import { primeGameDocCacheForResult } from "@/lib/result/resultDetailFirestoreCache";

const CHUNK = 30;
const ENRICH_TTL_MS = 2 * 60 * 1000;

export type GameMarketRates = {
  homeRate: number;
  awayRate: number;
};

type CacheEntry<T> = { at: number; value: T };

const marketCache = new Map<string, CacheEntry<GameMarketRates | null>>();
const pkCache = new Map<string, CacheEntry<PkScore | null>>();
const roundMetaCache = new Map<string, CacheEntry<GameRoundMeta | null>>();

export type GameRoundMeta = {
  roundLabel?: string | null;
  playoffRound?: string | null;
  seasonRound?: string | number | null;
  seasonPhase?: string | null;
};

function roundMetaFromGameDoc(
  raw: Record<string, unknown>
): GameRoundMeta | null {
  const roundLabel =
    typeof raw.roundLabel === "string" && raw.roundLabel.trim()
      ? raw.roundLabel.trim()
      : null;
  const playoffRound =
    typeof raw.playoffRound === "string" && raw.playoffRound.trim()
      ? raw.playoffRound.trim()
      : null;
  const seasonRoundRaw = raw.seasonRound;
  const seasonRound =
    typeof seasonRoundRaw === "string" || typeof seasonRoundRaw === "number"
      ? seasonRoundRaw
      : null;
  const seasonPhase =
    typeof raw.seasonPhase === "string" && raw.seasonPhase.trim()
      ? raw.seasonPhase.trim()
      : null;
  if (
    roundLabel == null &&
    playoffRound == null &&
    seasonRound == null &&
    seasonPhase == null
  ) {
    return null;
  }
  return { roundLabel, playoffRound, seasonRound, seasonPhase };
}

function cacheRoundMetaFromDoc(
  id: string,
  raw: Record<string, unknown> | undefined
): void {
  if (!raw) {
    cacheSet(roundMetaCache, id, null);
    return;
  }
  cacheSet(roundMetaCache, id, roundMetaFromGameDoc(raw));
}

/** 同一 ID セットの並行呼び出しを1本にまとめる */
const docsInflight = new Map<
  string,
  Promise<Record<string, Record<string, unknown>>>
>();

function pctField(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  if (v >= 0 && v <= 1) return v * 100;
  return v;
}

function marketPctsFromGameDoc(
  raw: Record<string, unknown>
): { homePct: number; awayPct: number } | null {
  const bias =
    raw.marketBias !== null && typeof raw.marketBias === "object"
      ? (raw.marketBias as Record<string, unknown>)
      : null;
  const mkt =
    raw.market !== null && typeof raw.market === "object"
      ? (raw.market as Record<string, unknown>)
      : null;
  const home =
    pctField(bias?.homePct) ??
    pctField(mkt?.homePct) ??
    pctField(mkt?.homeRate) ??
    pctField(raw.homePct);
  const away =
    pctField(bias?.awayPct) ??
    pctField(mkt?.awayPct) ??
    pctField(mkt?.awayRate) ??
    pctField(raw.awayPct);
  if (home == null && away == null) return null;
  if ((home ?? 0) === 0 && (away ?? 0) === 0) return null;
  return {
    homePct: Math.max(0, Math.min(100, home ?? 50)),
    awayPct: Math.max(0, Math.min(100, away ?? 50)),
  };
}

function cacheGet<T>(
  map: Map<string, CacheEntry<T>>,
  id: string,
  now: number
): T | undefined {
  const hit = map.get(id);
  if (!hit) return undefined;
  if (now - hit.at >= ENRICH_TTL_MS) return undefined;
  return hit.value;
}

function cacheSet<T>(
  map: Map<string, CacheEntry<T>>,
  id: string,
  value: T
): void {
  map.set(id, { at: Date.now(), value });
}

async function fetchMissingGameDocs(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, Record<string, unknown>>> {
  const ids = [...new Set(gameIds.filter(Boolean))].sort();
  if (ids.length === 0) return {};

  const key = ids.join("|");
  const pending = docsInflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const out: Record<string, Record<string, unknown>> = {};
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      chunks.push(ids.slice(i, i + CHUNK));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const snap = await getDocs(
            query(collection(db, "games"), where(documentId(), "in", chunk))
          );
          const found = new Set<string>();
          for (const docSnap of snap.docs) {
            found.add(docSnap.id);
            const data = docSnap.data() as Record<string, unknown>;
            out[docSnap.id] = data;
            primeGameDocCacheForResult(docSnap.id, data, true);
          }
          for (const id of chunk) {
            if (!found.has(id)) {
              primeGameDocCacheForResult(id, null, false);
            }
          }
        } catch {
          /* 呼び出し側フォールバック */
        }
      })
    );
    return out;
  })().finally(() => {
    docsInflight.delete(key);
  });

  docsInflight.set(key, promise);
  return promise;
}

/** games.marketBias / market から勝敗偏りをまとめて取得（TTL キャッシュ付き） */
export async function fetchGameMarkets(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, GameMarketRates>> {
  const ids = [...new Set(gameIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const now = Date.now();
  const out: Record<string, GameMarketRates> = {};
  const need: string[] = [];

  for (const id of ids) {
    const cached = cacheGet(marketCache, id, now);
    if (cached !== undefined) {
      if (cached) out[id] = cached;
      continue;
    }
    need.push(id);
  }

  if (need.length > 0) {
    const docs = await fetchMissingGameDocs(db, need);
    for (const id of need) {
      const raw = docs[id];
      if (!raw) {
        cacheSet(marketCache, id, null);
        continue;
      }
      const pcts = marketPctsFromGameDoc(raw);
      cacheRoundMetaFromDoc(id, raw);
      if (!pcts) {
        cacheSet(marketCache, id, null);
        continue;
      }
      const rates = {
        homeRate: pcts.homePct / 100,
        awayRate: pcts.awayPct / 100,
      };
      cacheSet(marketCache, id, rates);
      out[id] = rates;
    }
  }

  return out;
}

/** games.roundLabel / playoffRound をまとめて取得（market 取得と同一 docs キャッシュ） */
export async function fetchGameRoundMeta(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, GameRoundMeta>> {
  const ids = [...new Set(gameIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const now = Date.now();
  const out: Record<string, GameRoundMeta> = {};
  const need: string[] = [];

  for (const id of ids) {
    const cached = cacheGet(roundMetaCache, id, now);
    if (cached !== undefined) {
      if (cached) out[id] = cached;
      continue;
    }
    need.push(id);
  }

  if (need.length > 0) {
    const docs = await fetchMissingGameDocs(db, need);
    for (const id of need) {
      const raw = docs[id];
      if (!raw) {
        cacheSet(roundMetaCache, id, null);
        continue;
      }
      const meta = roundMetaFromGameDoc(raw);
      cacheSet(roundMetaCache, id, meta);
      if (meta) out[id] = meta;
    }
  }

  return out;
}

/** games から pkScore をまとめて取得（TTL キャッシュ付き） */
export async function fetchGamePkScores(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, PkScore>> {
  const ids = [...new Set(gameIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const now = Date.now();
  const out: Record<string, PkScore> = {};
  const need: string[] = [];

  for (const id of ids) {
    const cached = cacheGet(pkCache, id, now);
    if (cached !== undefined) {
      if (cached) out[id] = cached;
      continue;
    }
    need.push(id);
  }

  if (need.length > 0) {
    const docs = await fetchMissingGameDocs(db, need);
    for (const id of need) {
      const raw = docs[id];
      if (!raw) {
        cacheSet(pkCache, id, null);
        continue;
      }
      cacheRoundMetaFromDoc(id, raw);
      const pk = resolvePkScore(raw);
      cacheSet(pkCache, id, pk);
      if (pk) out[id] = pk;
    }
  }

  return out;
}
