/**
 * プレーオフ同一シリーズ peer 取得（Admin SDK）。
 * クライアント版 `fetchPlayoffSeriesPeerGames` と同ロジック。
 */

import type { Firestore } from "firebase-admin/firestore";
import { normalizeLeague } from "@/lib/leagues";
import { isPlayoffStyleGameCard } from "@/lib/games/playoffSeriesUi";

function rawTeamIdFromSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  if (typeof id === "string" && id.trim() !== "") return id.trim();
  return null;
}

function normalizeSeasonPhase(
  raw: unknown
): "regular" | "play_in" | "playoffs" | null {
  if (raw === "regular" || raw === "play_in" || raw === "playoffs") {
    return raw;
  }
  return null;
}

function seasonKeyFromRaw(raw: Record<string, unknown>): string {
  const s = raw.season;
  return s == null ? "" : String(s);
}

function isSamePlayoffSeriesMatchup(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (normalizeLeague(a.league) !== normalizeLeague(b.league)) return false;
  if (seasonKeyFromRaw(a) !== seasonKeyFromRaw(b)) return false;

  const phaseA = normalizeSeasonPhase(a.seasonPhase);
  const phaseB = normalizeSeasonPhase(b.seasonPhase);
  const roundA = String(a.roundLabel ?? "");
  const roundB = String(b.roundLabel ?? "");
  if (!isPlayoffStyleGameCard(phaseA, roundA)) return false;
  if (!isPlayoffStyleGameCard(phaseB, roundB)) return false;

  const ha = rawTeamIdFromSide(a.home);
  const aa = rawTeamIdFromSide(a.away);
  const hb = rawTeamIdFromSide(b.home);
  const ab = rawTeamIdFromSide(b.away);
  if (!ha || !aa || !hb || !ab) return false;

  const setA = new Set([ha, aa]);
  return setA.has(hb) && setA.has(ab);
}

async function fetchPlayoffSeriesPeerGamesAdmin(
  db: Firestore,
  subject: Record<string, unknown> & { id?: string }
): Promise<Array<Record<string, unknown>>> {
  const sid = String(subject.id ?? "");
  const onlySubject = (): Array<Record<string, unknown>> =>
    sid ? [{ ...subject, id: sid }] : [];

  const league = normalizeLeague(subject.league as string);
  if (subject.season == null) return onlySubject();
  const seasonEq = subject.season;

  const h = rawTeamIdFromSide(subject.home);
  const a = rawTeamIdFromSide(subject.away);
  if (!h || !a) return onlySubject();

  const phase = normalizeSeasonPhase(subject.seasonPhase);
  const roundLabel = String(subject.roundLabel ?? "");
  if (!isPlayoffStyleGameCard(phase, roundLabel)) return onlySubject();

  try {
    const col = db.collection("games");
    const q1 = col
      .where("league", "==", league)
      .where("season", "==", seasonEq)
      .where("home.teamId", "==", h)
      .where("away.teamId", "==", a);
    const q2 = col
      .where("league", "==", league)
      .where("season", "==", seasonEq)
      .where("home.teamId", "==", a)
      .where("away.teamId", "==", h);
    const [s1, s2] = await Promise.all([q1.get(), q2.get()]);
    const byId = new Map<string, Record<string, unknown>>();
    for (const d of s1.docs) {
      byId.set(d.id, { id: d.id, ...d.data() } as Record<string, unknown>);
    }
    for (const d of s2.docs) {
      byId.set(d.id, { id: d.id, ...d.data() } as Record<string, unknown>);
    }
    if (sid) {
      byId.set(sid, { ...(byId.get(sid) ?? {}), ...subject, id: sid });
    }
    const merged = Array.from(byId.values()).filter((row) =>
      isSamePlayoffSeriesMatchup(subject as Record<string, unknown>, row)
    );
    return merged.length ? merged : onlySubject();
  } catch {
    return onlySubject();
  }
}

/** 日付窓一覧用: プレーオフ試合のシリーズ peer をまとめて付与 */
export async function mergePlayoffSeriesPeersForWindowGamesAdmin(
  db: Firestore,
  windowRows: ReadonlyArray<Record<string, unknown> & { id?: string }>
): Promise<Record<string, unknown>[]> {
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of windowRows) {
    const id = String(row.id ?? "");
    if (id) byId.set(id, { ...row, id });
  }

  const seriesKeySeen = new Set<string>();
  const subjects: Array<Record<string, unknown> & { id?: string }> = [];

  for (const row of windowRows) {
    if (row.season == null) continue;
    const h = rawTeamIdFromSide(row.home);
    const a = rawTeamIdFromSide(row.away);
    if (!h || !a) continue;
    const phase = normalizeSeasonPhase(row.seasonPhase);
    const roundLabel = String(row.roundLabel ?? "");
    if (!isPlayoffStyleGameCard(phase, roundLabel)) continue;

    const league = normalizeLeague(row.league as string);
    const [t1, t2] = [h, a].sort();
    const key = `${league}\0${String(row.season)}\0${t1}\0${t2}\0${roundLabel}`;
    if (seriesKeySeen.has(key)) continue;
    seriesKeySeen.add(key);
    subjects.push(row);
  }

  if (subjects.length === 0) {
    return Array.from(byId.values());
  }

  const peerLists = await Promise.all(
    subjects.map((s) => fetchPlayoffSeriesPeerGamesAdmin(db, s))
  );

  for (const peers of peerLists) {
    for (const p of peers) {
      const id = String(p.id ?? "");
      if (!id) continue;
      const prev = byId.get(id);
      byId.set(id, prev ? { ...p, ...prev } : { ...p });
    }
  }

  return Array.from(byId.values());
}
