"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizeLeague } from "@/lib/leagues";
import { isPlayoffStyleGameCard } from "@/lib/games/playoffSeriesUi";
import { isSamePlayoffSeriesMatchup } from "@/lib/games/transform";

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

/**
 * プレーオフ同一シリーズの兄弟試合を Firestore から取得する（暦月外・単体ページ用）。
 * 一覧の `monthRows` と同じ `inferPlayoffSeriesStandingFromPeers` の入力に使う。
 */
export async function fetchPlayoffSeriesPeerGames(
  subject: Record<string, unknown> & { id?: string }
): Promise<Array<Record<string, unknown>>> {
  const sid = String(subject.id ?? "");
  const onlySubject = (): Array<Record<string, unknown>> =>
    sid ? [{ ...subject, id: sid }] : [];

  const league = normalizeLeague(subject.league as any);
  // season が無いドキュメントはシリーズ横断クエリできない
  if (subject.season == null) {
    return onlySubject();
  }
  // Firestore の season 型（string / number）をそのまま等価検索
  const seasonEq = subject.season;

  const h = rawTeamIdFromSide(subject.home);
  const a = rawTeamIdFromSide(subject.away);
  if (!h || !a) return onlySubject();

  const phase = normalizeSeasonPhase(subject.seasonPhase);
  const roundLabel = String(subject.roundLabel ?? "");
  if (!isPlayoffStyleGameCard(phase, roundLabel)) return onlySubject();

  try {
    const col = collection(db, "games");
    const q1 = query(
      col,
      where("league", "==", league),
      where("season", "==", seasonEq),
      where("home.teamId", "==", h),
      where("away.teamId", "==", a)
    );
    const q2 = query(
      col,
      where("league", "==", league),
      where("season", "==", seasonEq),
      where("home.teamId", "==", a),
      where("away.teamId", "==", h)
    );
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
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

/**
 * 日付窓が狭い一覧用。窓内のプレーオフ試合ごとに同一シリーズの全試合を追加取得し、
 * `inferPlayoffSeriesStandingFromPeers` 用の peer プールを暦月一括取得時と同等にする。
 * シリーズ単位でクエリは dedupe（同一カードの重複取得なし）。
 */
export async function mergePlayoffSeriesPeersForWindowGames(
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

    const league = normalizeLeague(row.league as any);
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
    subjects.map((s) => fetchPlayoffSeriesPeerGames(s))
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
