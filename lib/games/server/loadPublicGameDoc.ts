/**
 * 公開 games 1 件（Admin fieldMask）。クライアント SDK の全項目 get を置き換える。
 * liveStats / predictorUids / Pro Insight は載せない。
 */

import type { Firestore } from "firebase-admin/firestore";
import { serializeGameDoc } from "@/lib/games/gameDocJson";
import { fetchPlayoffSeriesPeerGamesAdmin } from "@/lib/games/server/playoffSeriesPeersAdmin";
import { NBA_GAMES_WINDOW_FIELDS } from "@/lib/games/server/loadGamesWindow";

const OMIT = [
  "proInsightNarrative",
  "proInsightFacts",
  "proBrief",
  "predictorUids",
  "liveStats",
] as const;

const SLIM_EXTRA = [
  "pkScore",
  "pkHomeScore",
  "pkAwayScore",
  "pointsDistribution.n",
  "pointsDistribution.mean",
  "pointsDistribution.median",
  "pointsDistribution.max",
] as const;

const FULL_EXTRA = ["pointsSummary", ...SLIM_EXTRA] as const;

export type PublicGameDocView = "slim" | "full";

export type PublicGameDocPayload = {
  ok: true;
  found: boolean;
  game: Record<string, unknown> | null;
  peers: Record<string, unknown>[];
};

export const PUBLIC_GAME_DOC_ID_RE = /^[a-zA-Z0-9._-]{4,128}$/;
export const PUBLIC_GAME_DOCS_MAX = 30;

export function isPublicGameDocId(id: string): boolean {
  return PUBLIC_GAME_DOC_ID_RE.test(id);
}

function fieldMaskFor(view: PublicGameDocView): string[] {
  if (view === "full") {
    return NBA_GAMES_WINDOW_FIELDS.filter((f) => f !== "pointsSummary.n").concat(
      FULL_EXTRA
    );
  }
  return [...NBA_GAMES_WINDOW_FIELDS, ...SLIM_EXTRA];
}

function slimPublicGame(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of OMIT) delete out[key];
  return out;
}

async function readGameMasked(
  db: Firestore,
  gameId: string,
  view: PublicGameDocView
): Promise<{ exists: boolean; data: Record<string, unknown> | null }> {
  const [snap] = await db.getAll(db.collection("games").doc(gameId), {
    fieldMask: fieldMaskFor(view),
  });
  if (!snap.exists) return { exists: false, data: null };
  return { exists: true, data: slimPublicGame(snap.data() as Record<string, unknown>) };
}

export async function loadPublicGameDoc(
  db: Firestore,
  gameId: string,
  opts?: { view?: PublicGameDocView; includePeers?: boolean }
): Promise<PublicGameDocPayload> {
  const view = opts?.view ?? "slim";
  const includePeers = opts?.includePeers ?? true;
  const { exists, data } = await readGameMasked(db, gameId, view);
  if (!exists || !data) {
    return { ok: true, found: false, game: null, peers: [] };
  }
  const game = serializeGameDoc(gameId, { ...data, id: gameId });
  if (!includePeers) {
    return { ok: true, found: true, game, peers: [] };
  }
  const peerRaw = await fetchPlayoffSeriesPeerGamesAdmin(
    db,
    { ...data, id: gameId },
    NBA_GAMES_WINDOW_FIELDS
  );
  const peers = peerRaw
    .filter((row) => String(row.id ?? "") !== gameId)
    .map((row) => {
      const id = String(row.id ?? "");
      const slim = slimPublicGame({ ...row });
      delete slim.id;
      return serializeGameDoc(id, slim);
    });
  return { ok: true, found: true, game, peers };
}

export async function loadPublicGameDocs(
  db: Firestore,
  gameIds: readonly string[],
  view: PublicGameDocView = "slim"
): Promise<Record<string, Record<string, unknown>>> {
  const unique = [...new Set(gameIds.filter(isPublicGameDocId))].slice(
    0,
    PUBLIC_GAME_DOCS_MAX
  );
  if (unique.length === 0) return {};
  const refs = unique.map((id) => db.collection("games").doc(id));
  const snaps = await db.getAll(...refs, { fieldMask: fieldMaskFor(view) });
  const out: Record<string, Record<string, unknown>> = {};
  snaps.forEach((snap, i) => {
    const id = unique[i]!;
    if (!snap.exists) return;
    out[id] = serializeGameDoc(
      id,
      slimPublicGame({ ...(snap.data() as Record<string, unknown>), id })
    );
  });
  return out;
}
