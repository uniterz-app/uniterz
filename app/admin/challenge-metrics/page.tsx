"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import AdminGuard from "../_components/AdminGuard";
import type { ChallengeMetricsPayload } from "@/lib/campaigns/challengeMetricsTypes";
import type { December2026CostInputs } from "@/lib/campaigns/december2026Campaign";
import { DECEMBER_2026_COST_DEFAULTS } from "@/lib/campaigns/december2026Campaign";

type Payload = ChallengeMetricsPayload & {
  copy?: { youtubeJa: string; xJa: string };
  published?: { id: string; created: boolean };
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
  return data as Payload;
}

function yen(n: number): string {
  return `${Math.round(n).toLocaleString("ja-JP")}円`;
}

function BoardCard({ board }: { board: ChallengeMetricsPayload["boards"]["monthly"] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="font-semibold">{board.labelJa}</h3>
      <p className="mt-1 text-xs text-white/50">{board.status}</p>
      <p className="mt-2 text-sm text-white/80">
        参加 {board.participantCount.toLocaleString("ja-JP")}
        {board.gameCount > 0
          ? ` · 試合 ${board.settledCount}/${board.gameCount}`
          : ""}
      </p>
      <ol className="mt-3 space-y-1 text-sm">
        {board.top.length === 0 ? (
          <li className="text-white/40">まだ順位なし</li>
        ) : (
          board.top.map((r) => (
            <li key={`${board.id}-${r.uid}`} className="flex justify-between gap-3">
              <span>
                {r.rank}. {r.displayName || r.uid.slice(0, 8)}
              </span>
              <span className="tabular-nums text-cyan-200">{r.points}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

export default function AdminChallengeMetricsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [costs, setCosts] = useState<December2026CostInputs>(DECEMBER_2026_COST_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await adminFetch("/api/admin/challenge-metrics");
      setData(next);
      setCosts(next.physical.costs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (action: "saveCosts" | "publishNotice") => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const next = await adminFetch("/api/admin/challenge-metrics", {
        method: "POST",
        body: JSON.stringify(
          action === "saveCosts" ? { action, costs } : { action }
        ),
      });
      setData(next);
      setCosts(next.physical.costs);
      setSaved(
        action === "publishNotice"
          ? next.published?.created
            ? "お知らせを掲載しました。アプリ内にすぐ出ます。"
            : "お知らせを更新しました。"
          : "実費を保存しました。"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSaved(ok);
    } catch {
      setError("コピーできませんでした");
    }
  };

  const setNum =
    (key: keyof December2026CostInputs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      setCosts((s) => ({ ...s, [key]: Number.isFinite(n) && n >= 0 ? n : 0 }));
    };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">12月チャレンジの数字</h2>
          <p className="mt-1 text-sm text-white/55">
            参加人数・上位・広告完了回数・UNIT・現物原価。ユーザー周知はアプリ内・YouTube・X。
          </p>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {saved ? <p className="text-sm text-cyan-200">{saved}</p> : null}

        {loading || !data ? (
          <p className="text-white/50">読み込み中…</p>
        ) : (
          <>
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <h3 className="font-semibold">周知</h3>
              <p className="mt-1 text-sm text-white/65">
                アプリ内はイベントごとに分ける。いまはまだ出さない。カップは 12/4 から、クリスマスは 12/20 から出す想定。
                「掲載」は月間お知らせ。YouTube と X は下の文をコピーして使う。
              </p>
              <p className="mt-2 text-xs text-white/45">
                お知らせ{" "}
                {data.notice.published
                  ? "掲載中"
                  : "まだ Firestore に無い"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void post("publishNotice")}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  アプリ内お知らせに掲載
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(data.copy?.xJa ?? "", "X 用の文をコピーした")
                  }
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm"
                >
                  X 用をコピー
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      data.copy?.youtubeJa ?? "",
                      "YouTube 用の文をコピーした"
                    )
                  }
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm"
                >
                  YouTube 用をコピー
                </button>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm"
                >
                  数字を再読込
                </button>
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-white/70">
                {data.copy?.xJa}
              </pre>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <BoardCard board={data.boards.monthly} />
              <BoardCard board={data.boards.cup} />
              <BoardCard board={data.boards.christmas} />
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-semibold">AdMob（12月・日本時間）</h3>
              <p className="mt-1 text-xs text-white/50">{data.admob.noteJa}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <p>
                  PRO PICK 完了 {data.admob.proPick.completions}
                  <span className="text-white/45">
                    {" "}
                    / 人 {data.admob.proPick.uniqueUids}
                  </span>
                </p>
                <p>
                  Buzz 完了 {data.admob.tradeBuzz.completions}
                  <span className="text-white/45">
                    {" "}
                    / 人 {data.admob.tradeBuzz.uniqueUids}
                  </span>
                </p>
                <p>円（手入力） {yen(data.admob.yenActual)}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-semibold">UNIT（月間ランキング）</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                <p>枠が埋まったときの予定 {data.units.plannedIfFull}</p>
                <p>実際に付与 {data.units.granted}</p>
                <p>円換算 {yen(data.units.yenActual)}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-semibold">現物の予定と実費</h3>
              <p className="mt-1 text-xs text-white/50">
                予定: Mega Box {data.physical.planned.totals.megaBox} ·
                パック {data.physical.planned.totals.megaPacks} · Ballers{" "}
                {data.physical.planned.totals.ballers} · Tシャツ{" "}
                {data.physical.planned.totals.tee}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    ["megaBoxYen", "Mega Box 1個あたり"],
                    ["megaPackYen", "パック 1個あたり"],
                    ["ballersYen", "Ballers 1個あたり"],
                    ["teeYen", "Tシャツ 1枚"],
                    ["shippingYen", "送料合計"],
                    ["otherYen", "その他"],
                    ["admobYenActual", "AdMob 円（コンソール）"],
                    ["unitYenPerUnit", "UNIT 1個あたりの円"],
                  ] as Array<[keyof December2026CostInputs, string]>
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    <span className="text-white/60">{label}</span>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      value={costs[key]}
                      onChange={setNum(key)}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 block text-sm">
                <span className="text-white/60">メモ</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  rows={3}
                  value={costs.notes}
                  onChange={(e) =>
                    setCosts((s) => ({ ...s, notes: e.target.value }))
                  }
                />
              </label>
              <p className="mt-3 text-sm">
                現物合計 {yen(data.physical.yenActual)}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void post("saveCosts")}
                className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm disabled:opacity-50"
              >
                実費を保存
              </button>
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
