"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminGuard from "../_components/AdminGuard";
import { auth } from "@/lib/firebase";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { deriveBattleSchedule } from "@/lib/groupBattles/schedule";

type BattleRow = {
  id: string;
  name: string;
  phase: string;
  seasonKey: string;
  weeklyLabels: string[];
  monthlyRange: { startKey: string; endKey: string; label: string };
  recruitStartAtMs: number;
  recruitEndAtMs: number;
  battleStartAtMs: number;
  battleEndAtMs: number;
};

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

function toLocalInputValue(ms: number): string {
  const jst = new Date(ms + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function defaultForm() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    name: "",
    seasonKey: CURRENT_NBA_SEASON_KEY,
    recruitStartAt: toLocalInputValue(now),
    recruitEndAt: toLocalInputValue(now + 10 * day),
    battleStartAt: toLocalInputValue(now + 10 * day + 60_000),
    battleEndAt: toLocalInputValue(now + 10 * day + 28 * day),
    startRecruiting: true,
  };
}

function fmtMs(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const PHASE_ACTIONS: Array<{ phase: string; label: string }> = [
  { phase: "recruiting", label: "募集開始" },
  { phase: "battle", label: "締切ロック → BATTLE" },
  { phase: "settling", label: "集計へ" },
  { phase: "final", label: "確定へ" },
  { phase: "closed", label: "クローズ" },
];

export default function AdminGroupBattlesPage() {
  const [battles, setBattles] = useState<BattleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [busy, setBusy] = useState(false);
  const [phaseBusyId, setPhaseBusyId] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      deriveBattleSchedule({
        recruitStartAt: form.recruitStartAt,
        recruitEndAt: form.recruitEndAt,
        battleStartAt: form.battleStartAt,
        battleEndAt: form.battleEndAt,
      }),
    [form]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/group-battles");
      setBattles((data.battles ?? []) as BattleRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedId(null);
    try {
      const data = await adminFetch("/api/admin/group-battles", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreatedId(String(data.battleId));
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onPhase(battleId: string, phase: string) {
    setPhaseBusyId(battleId);
    setError(null);
    try {
      await adminFetch(`/api/admin/group-battles/${encodeURIComponent(battleId)}/phase`, {
        method: "POST",
        body: JSON.stringify({ phase }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhaseBusyId(null);
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-white/45">
              <Link href="/admin" className="hover:text-cyan-300">
                管理画面
              </Link>
              {" / "}
              Squad Battle
            </p>
            <h2 className="mt-1 text-xl font-bold">グループバトル開催</h2>
            <p className="mt-1 text-sm text-white/55">
              募集期間と対戦期間を入れるだけで、週ラベル・Unit 表・シーズンキーを自動設定します。
            </p>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
        {createdId ? (
          <p className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            作成しました · battleId = {createdId}
          </p>
        ) : null}

        <form
          onSubmit={onCreate}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <h3 className="text-sm font-semibold text-cyan-200/90">新規大会</h3>
          <label className="block text-sm">
            <span className="text-white/55">大会名</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2"
              placeholder="例: 2026-11 Squad Battle"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/55">NBA seasonKey</span>
            <input
              required
              value={form.seasonKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, seasonKey: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/55">募集開始（JST）</span>
              <input
                type="datetime-local"
                required
                value={form.recruitStartAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recruitStartAt: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/55">募集終了（JST）</span>
              <input
                type="datetime-local"
                required
                value={form.recruitEndAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recruitEndAt: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/55">対戦開始（JST）</span>
              <input
                type="datetime-local"
                required
                value={form.battleStartAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, battleStartAt: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/55">対戦終了（JST）</span>
              <input
                type="datetime-local"
                required
                value={form.battleEndAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, battleEndAt: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.startRecruiting}
              onChange={(e) =>
                setForm((f) => ({ ...f, startRecruiting: e.target.checked }))
              }
            />
            作成と同時に募集開始（recruiting）
          </label>

          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white/60">
            {preview.ok ? (
              <>
                <p>
                  週間ラベル（{preview.schedule.weeklyLabels.length}）:{" "}
                  <span className="font-mono text-cyan-100/80">
                    {preview.schedule.weeklyLabels.join(", ")}
                  </span>
                </p>
                <p className="mt-1">
                  月間: {preview.schedule.monthlyRange.startKey} 〜{" "}
                  {preview.schedule.monthlyRange.endKey}（
                  {preview.schedule.monthlyRange.label}）
                </p>
                <p className="mt-1 text-white/45">
                  Unit 表は設計デフォルト（週1位30 / 月1位100・上位20）を自動セット
                </p>
              </>
            ) : (
              <p className="text-rose-200/90">プレビュー不可: {preview.error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !preview.ok}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-40"
          >
            {busy ? "作成中…" : "大会を作成"}
          </button>
        </form>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">既存大会</h3>
          {loading ? (
            <p className="text-sm text-white/45">読み込み中…</p>
          ) : battles.length === 0 ? (
            <p className="text-sm text-white/45">まだ大会がありません。</p>
          ) : (
            <ul className="space-y-3">
              {battles.map((b) => (
                <li
                  key={b.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{b.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">
                        {b.id}
                      </p>
                      <p className="mt-2 text-xs text-white/55">
                        phase=<span className="text-amber-200">{b.phase}</span> ·
                        season={b.seasonKey} · weeks=
                        {b.weeklyLabels?.length ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        募集 {fmtMs(b.recruitStartAtMs)} → {fmtMs(b.recruitEndAtMs)}
                      </p>
                      <p className="text-xs text-white/40">
                        対戦 {fmtMs(b.battleStartAtMs)} → {fmtMs(b.battleEndAtMs)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PHASE_ACTIONS.map((a) => (
                        <button
                          key={a.phase}
                          type="button"
                          disabled={phaseBusyId === b.id}
                          onClick={() => void onPhase(b.id, a.phase)}
                          className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-white/75 hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-40"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
