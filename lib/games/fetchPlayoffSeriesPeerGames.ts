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

  try {
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
