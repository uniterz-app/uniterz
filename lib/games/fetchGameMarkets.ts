import {
  collection,
  documentId,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

export type GameMarketRates = {
  homeRate: number;
  awayRate: number;
};

const CHUNK = 30;

function asRate(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** games.market から homeRate / awayRate（0–1）をまとめて取得 */
export async function fetchGameMarkets(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, GameMarketRates>> {
  const ids = [...new Set(gameIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const out: Record<string, GameMarketRates> = {};
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
        for (const docSnap of snap.docs) {
          const raw = docSnap.data() as Record<string, unknown>;
          const mkt =
            raw.market !== null && typeof raw.market === "object"
              ? (raw.market as Record<string, unknown>)
              : null;
          if (!mkt) continue;
          out[docSnap.id] = {
            homeRate: asRate(mkt.homeRate),
            awayRate: asRate(mkt.awayRate),
          };
        }
      } catch {
        // 補完失敗時は post.marketMeta / 50-50 のみ
      }
    })
  );

  return out;
}
