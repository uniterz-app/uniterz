"use client";

/**
 * Free 向け PRO PICK の「この試合だけ」解除（`POST /api/nba/pro-pick-unlock`）。
 * 判定は必ずサーバー。ここは送って応答を返すだけ。
 */
import { auth } from "@/lib/firebase";

export type ProPickUnlockResult = {
  unlocked: boolean;
  needsAd: boolean;
  via: string | null;
};

export async function requestProPickUnlock(opts: {
  apiBase?: string | null;
  gameId: string;
  adWatched: boolean;
}): Promise<ProPickUnlockResult | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const apiBase = (opts.apiBase ?? "").replace(/\/$/, "");
  const token = await user.getIdToken();
  const path = "/api/nba/pro-pick-unlock";
  try {
    const res = await fetch(apiBase ? `${apiBase}${path}` : path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId: opts.gameId, adWatched: opts.adWatched }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      unlocked?: unknown;
      needsAd?: unknown;
      via?: unknown;
    };
    return {
      unlocked: json.unlocked === true,
      needsAd: json.needsAd === true,
      via: typeof json.via === "string" ? json.via : null,
    };
  } catch {
    return null;
  }
}
