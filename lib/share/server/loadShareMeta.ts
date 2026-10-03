/**
 * 共有ページ用メタ（サーバー専用・Admin SDK）。
 * 試合開始前の予想は Firestore ルール（postReadable）と同じ条件で伏せる。
 */
import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type {
  CommunityShareMeta,
  ProfileShareMeta,
  ResultShareMeta,
} from "@/lib/share/shareMetaTypes";

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function millisOf(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object") {
    const o = v as { toMillis?: () => number };
    if (typeof o.toMillis === "function") return o.toMillis();
  }
  return null;
}

function teamName(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return str(o.name) ?? str(o.abbr) ?? str(o.teamId) ?? "";
  }
  return "";
}

function scorePair(v: unknown): { home: number; away: number } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const home = num(o.home);
  const away = num(o.away);
  return home === null || away === null ? null : { home, away };
}

export const loadResultShareMeta = cache(
  async (postId: string): Promise<ResultShareMeta | null> => {
    const id = postId.trim();
    if (!id) return { kind: "missing" };
    try {
      const snap = await getAdminDb().collection("posts").doc(id).get();
      if (!snap.exists) return { kind: "missing" };
      const d = snap.data() as Record<string, unknown>;

      const startAtMs = millisOf(d.startAt) ?? num(d.startAtMillis);
      const settled = d.settledAt != null;
      const visible =
        settled || (startAtMs !== null && startAtMs <= Date.now());

      const author = (d.author ?? {}) as Record<string, unknown>;
      const prediction = (d.prediction ?? {}) as Record<string, unknown>;
      const stats = (d.stats ?? {}) as Record<string, unknown>;
      const game = (d.game ?? {}) as Record<string, unknown>;

      return {
        kind: "result",
        visible,
        startAtMs,
        homeName: teamName(d.home) || teamName(game.home),
        awayName: teamName(d.away) || teamName(game.away),
        author: {
          name:
            str(d.authorDisplayName) ??
            str(author.name) ??
            str(d.authorHandle) ??
            "UNITERZ",
          handle: str(d.authorHandle) ?? str(author.handle),
          photoURL: str(d.authorPhotoURL) ?? str(author.avatarUrl),
        },
        pick: visible ? scorePair(prediction.score) : null,
        final: visible
          ? scorePair(d.result) ?? scorePair(game.finalScore)
          : null,
        totalPoints: visible ? num(stats.pointsV3) : null,
      };
    } catch (e) {
      console.error("[share] loadResultShareMeta failed", e);
      return null;
    }
  }
);

export const loadProfileShareMeta = cache(
  async (handle: string): Promise<ProfileShareMeta | null> => {
    const key = handle.trim().replace(/^@+/u, "");
    if (!key) return { kind: "missing" };
    try {
      const db = getAdminDb();
      let uid: string | null = null;
      for (const slug of Array.from(new Set([key, key.toLowerCase()]))) {
        const s = await db.collection("slugs").doc(slug).get();
        const v = str(s.data()?.uid);
        if (v) {
          uid = v;
          break;
        }
      }
      const userSnap = await db.collection("users").doc(uid ?? key).get();
      if (!userSnap.exists) return { kind: "missing" };
      const u = userSnap.data() as Record<string, unknown>;
      const handle = str(u.handle) ?? key;
      return {
        kind: "profile",
        displayName: str(u.displayName) ?? handle,
        handle,
        photoURL: str(u.photoURL) ?? str(u.avatarUrl),
        bio: str(u.bio),
      };
    } catch (e) {
      console.error("[share] loadProfileShareMeta failed", e);
      return null;
    }
  }
);

export const loadCommunityShareMeta = cache(
  async (groupId: string): Promise<CommunityShareMeta | null> => {
    const id = groupId.trim();
    if (!id) return { kind: "missing" };
    try {
      const snap = await getAdminDb().collection("groups").doc(id).get();
      if (!snap.exists) return { kind: "missing" };
      const g = snap.data() as Record<string, unknown>;
      if (g.archivedAt) return { kind: "missing" };
      return {
        kind: "community",
        name: str(g.name) ?? "UNITERZ",
        memberCount: num(g.memberCount) ?? 0,
      };
    } catch (e) {
      console.error("[share] loadCommunityShareMeta failed", e);
      return null;
    }
  }
);
