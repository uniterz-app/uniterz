"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import AdminGuard from "../_components/AdminGuard";

async function adminFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return data;
}

const API = "/api/admin/nba-trade-buzz";

function pretty(value: unknown): string {
  return JSON.stringify(value ?? [], null, 2);
}

export default function AdminNbaTradeBuzzPage() {
  const [asOfJst, setAsOfJst] = useState("");
  const [itemsJson, setItemsJson] = useState("[]");
  const [confirmedJson, setConfirmedJson] = useState("[]");
  const [updatedAtMs, setUpdatedAtMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch(`${API}?season=${encodeURIComponent(CURRENT_NBA_SEASON_KEY)}`);
      setAsOfJst(typeof data.asOfJst === "string" ? data.asOfJst : "");
      setItemsJson(pretty(data.items));
      setConfirmedJson(pretty(data.confirmed));
      setUpdatedAtMs(typeof data.updatedAtMs === "number" ? data.updatedAtMs : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (seed: boolean) => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      let items: unknown;
      let confirmed: unknown;
      if (!seed) {
        try {
          items = JSON.parse(itemsJson);
          confirmed = JSON.parse(confirmedJson);
        } catch {
          throw new Error("JSON が壊れています");
        }
      }
      const data = await adminFetch(API, {
        method: "POST",
        body: JSON.stringify(
          seed
            ? { seed: true, seasonKey: CURRENT_NBA_SEASON_KEY }
            : {
                seasonKey: CURRENT_NBA_SEASON_KEY,
                asOfJst: asOfJst.trim() || undefined,
                items,
                confirmed,
              }
        ),
      });
      setSaved(
        `保存しました（Buzz ${data.itemCount} / 確定 ${data.confirmedCount}）`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-white">
        <div>
          <h1 className="text-2xl font-semibold">トレード Buzz</h1>
          <p className="mt-1 text-sm text-white/55">
            アプリの再ビルドなしで、Buzz と確定トレードを出せます。保存すると公開 API
            がすぐ入れ替わります。
          </p>
          <p className="mt-1 text-xs text-white/40">
            シーズン {CURRENT_NBA_SEASON_KEY}
            {updatedAtMs
              ? ` · 更新 ${new Date(updatedAtMs).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
              : " · まだ Firestore に無い"}
          </p>
        </div>

        {loading ? (
          <p className="text-white/50">読み込み中…</p>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-white/45">
                取材時点（JST）
              </span>
              <input
                value={asOfJst}
                onChange={(e) => setAsOfJst(e.target.value)}
                placeholder="2026-11-21 13:07"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-white/45">
                Buzz（JSON）
              </span>
              <textarea
                value={itemsJson}
                onChange={(e) => setItemsJson(e.target.value)}
                spellCheck={false}
                className="h-[360px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs leading-5"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-white/45">
                確定トレード（JSON）
              </span>
              <textarea
                value={confirmedJson}
                onChange={(e) => setConfirmedJson(e.target.value)}
                spellCheck={false}
                className="h-[220px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs leading-5"
              />
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {saved ? <p className="text-sm text-cyan-300">{saved}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(false)}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {busy ? "保存中…" : "保存する"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(true)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 disabled:opacity-50"
              >
                コードの初期データを入れる
              </button>
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
