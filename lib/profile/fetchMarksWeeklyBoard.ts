/** MARK LIST の週次順位ボード（Web / Native 共用） */

export type MarksWeeklyBoardEntry = {
  rank: number | null;
  points: number | null;
  isPro: boolean;
};

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; entry: MarksWeeklyBoardEntry }>();
const inflight = new Map<string, Promise<Record<string, MarksWeeklyBoardEntry>>>();

function uniqueUids(uids: string[]): string[] {
  return [...new Set(uids.map((u) => u.trim()).filter(Boolean))];
}

export function peekMarksWeeklyBoard(uids: string[]): {
  board: Record<string, MarksWeeklyBoardEntry>;
  missing: string[];
} {
  const board: Record<string, MarksWeeklyBoardEntry> = {};
  const missing: string[] = [];
  const now = Date.now();
  for (const uid of uniqueUids(uids)) {
    const hit = cache.get(uid);
    if (!hit || now - hit.at >= TTL_MS) {
      missing.push(uid);
      continue;
    }
    board[uid] = hit.entry;
  }
  return { board, missing };
}

function writeBoard(board: Record<string, MarksWeeklyBoardEntry>): void {
  const at = Date.now();
  for (const [uid, entry] of Object.entries(board)) {
    cache.set(uid, { at, entry });
  }
}

async function fetchMarksWeeklyBoardNetwork(
  uids: string[],
  apiBase?: string
): Promise<Record<string, MarksWeeklyBoardEntry>> {
  const unique = uniqueUids(uids);
  if (unique.length === 0) return {};
  const qs = new URLSearchParams({ uids: unique.join(",") });
  const base = (apiBase ?? "").replace(/\/$/, "");
  const url = `${base}/api/profile/marks-weekly?${qs.toString()}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const json = (await res.json()) as {
      ok?: boolean;
      board?: Record<string, MarksWeeklyBoardEntry>;
    };
    if (!res.ok || !json?.ok || !json.board) return {};
    writeBoard(json.board);
    return json.board;
  } catch {
    return {};
  }
}

export async function loadMarksWeeklyBoard(
  uids: string[],
  apiBase?: string
): Promise<Record<string, MarksWeeklyBoardEntry>> {
  const { board, missing } = peekMarksWeeklyBoard(uids);
  if (missing.length === 0) return board;
  const key = missing.slice().sort().join(",");
  const existing = inflight.get(key);
  const fetched = existing
    ? await existing
    : await (async () => {
        const promise = fetchMarksWeeklyBoardNetwork(missing, apiBase);
        inflight.set(key, promise);
        try {
          return await promise;
        } finally {
          inflight.delete(key);
        }
      })();
  return { ...board, ...fetched };
}

export function prefetchMarksWeeklyBoard(
  uids: string[],
  apiBase?: string
): void {
  const { missing } = peekMarksWeeklyBoard(uids);
  if (missing.length === 0) return;
  void loadMarksWeeklyBoard(missing, apiBase);
}

/** @deprecated loadMarksWeeklyBoard を使う */
export async function fetchMarksWeeklyBoard(
  uids: string[],
  apiBase?: string
): Promise<Record<string, MarksWeeklyBoardEntry>> {
  return loadMarksWeeklyBoard(uids, apiBase);
}
