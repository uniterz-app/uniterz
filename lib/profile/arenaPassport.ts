/**
 * ARENA PASSPORT — 訪れた NBA アリーナ（公開プロフィール）。
 * users/{uid}.visitedArenaIds（Admin API のみ書き込み）
 */

export type ArenaPassportId =
  | "bos" | "bkn" | "nyk" | "phi" | "tor"
  | "chi" | "cle" | "det" | "ind" | "mil"
  | "atl" | "cha" | "mia" | "orl" | "was"
  | "den" | "min" | "okc" | "por" | "uta"
  | "gsw" | "lac" | "lal" | "phx" | "sac"
  | "dal" | "hou" | "mem" | "nop" | "sas";

export type ArenaPassportArena = {
  id: ArenaPassportId;
  /** 読み上げ用。バッジ自体には名前を出さない */
  city: string;
};

/** 1 行 = 1 ディビジョン（5 アリーナ × 6 行） */
export const ARENA_PASSPORT_ROWS: readonly (readonly ArenaPassportArena[])[] = [
  [
    { id: "bos", city: "Boston" },
    { id: "bkn", city: "Brooklyn" },
    { id: "nyk", city: "New York" },
    { id: "phi", city: "Philadelphia" },
    { id: "tor", city: "Toronto" },
  ],
  [
    { id: "chi", city: "Chicago" },
    { id: "cle", city: "Cleveland" },
    { id: "det", city: "Detroit" },
    { id: "ind", city: "Indianapolis" },
    { id: "mil", city: "Milwaukee" },
  ],
  [
    { id: "atl", city: "Atlanta" },
    { id: "cha", city: "Charlotte" },
    { id: "mia", city: "Miami" },
    { id: "orl", city: "Orlando" },
    { id: "was", city: "Washington, D.C." },
  ],
  [
    { id: "den", city: "Denver" },
    { id: "min", city: "Minneapolis" },
    { id: "okc", city: "Oklahoma City" },
    { id: "por", city: "Portland" },
    { id: "uta", city: "Salt Lake City" },
  ],
  [
    { id: "gsw", city: "San Francisco" },
    { id: "lac", city: "Inglewood" },
    { id: "lal", city: "Los Angeles" },
    { id: "phx", city: "Phoenix" },
    { id: "sac", city: "Sacramento" },
  ],
  [
    { id: "dal", city: "Dallas" },
    { id: "hou", city: "Houston" },
    { id: "mem", city: "Memphis" },
    { id: "nop", city: "New Orleans" },
    { id: "sas", city: "San Antonio" },
  ],
];

export const ARENA_PASSPORT_ARENAS: readonly ArenaPassportArena[] =
  ARENA_PASSPORT_ROWS.flat();

export const ARENA_PASSPORT_TOTAL = ARENA_PASSPORT_ARENAS.length;

const ARENA_ID_SET = new Set<string>(ARENA_PASSPORT_ARENAS.map((a) => a.id));

export function isArenaPassportId(value: unknown): value is ArenaPassportId {
  return typeof value === "string" && ARENA_ID_SET.has(value);
}

/** 不正値・重複を落とし、表示順に並べる */
export function normalizeVisitedArenaIds(raw: unknown): ArenaPassportId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>(raw.filter(isArenaPassportId));
  return ARENA_PASSPORT_ARENAS.filter((a) => seen.has(a.id)).map((a) => a.id);
}

export function parseVisitedArenaIds(
  data: Record<string, unknown> | null | undefined
): ArenaPassportId[] {
  return normalizeVisitedArenaIds(data?.visitedArenaIds);
}

export function toggleVisitedArenaId(
  current: readonly ArenaPassportId[],
  id: ArenaPassportId
): ArenaPassportId[] {
  const next = current.includes(id)
    ? current.filter((v) => v !== id)
    : [...current, id];
  return normalizeVisitedArenaIds(next);
}

export function arenaPassportBadgeWebSrc(
  id: ArenaPassportId,
  visited: boolean
): string {
  return visited ? `/arena-passport/${id}.png` : `/arena-passport/gray/${id}.png`;
}

/** バッジ画像のアスペクト（幅 / 高さ） */
export const ARENA_PASSPORT_BADGE_ASPECT = 240 / 270;
