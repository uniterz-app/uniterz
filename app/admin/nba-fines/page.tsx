"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaLeagueStatsSeasonKeys,
} from "@/lib/rankings/nbaSeason";
import { TEAM_SHORT } from "@/lib/team-short";
import { formatDisciplineFineUsdFull } from "@/lib/nba/discipline/formatDisciplineFineUsd";
import type {
  NbaDisciplineEventKind,
  NbaDisciplineFineEntry,
  NbaDisciplineFineKind,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";

type Candidate = { playerId: string; playerName: string; teamId: string };

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

const API = "/api/admin/nba-discipline-fines";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminNbaFinesPage() {
  const [season, setSeason] = useState(CURRENT_NBA_SEASON_KEY);
  const [fines, setFines] = useState<NbaDisciplineFineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [seasonType, setSeasonType] =
    useState<NbaDisciplineSeasonType>("regular");
  const [kind, setKind] = useState<NbaDisciplineFineKind>("fine");
  const [games, setGames] = useState("1");
  const [onCourt, setOnCourt] = useState(true);
  const [rescindKind, setRescindKind] =
    useState<NbaDisciplineEventKind>("tech");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch(`${API}?season=${encodeURIComponent(season)}`);
      setFines(data.fines ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || picked) {
      setCandidates([]);
      return;
    }
    const id = setTimeout(() => {
      adminFetch(
        `${API}?season=${encodeURIComponent(season)}&q=${encodeURIComponent(q)}`
      )
        .then((d) => setCandidates(d.candidates ?? []))
        .catch(() => setCandidates([]));
    }, 250);
    return () => clearTimeout(id);
  }, [query, season, picked]);

  const submit = async () => {
    if (!picked) {
      setError("選手を選んでください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminFetch(API, {
        method: "POST",
        body: JSON.stringify({
          seasonKey: season,
          seasonType,
          kind,
          games: Number(games),
          onCourt,
          rescindKind,
          playerId: picked.playerId,
          playerName: picked.playerName,
          teamId: picked.teamId,
          amountUsd: Number(amount.replace(/[^0-9.]/g, "")),
          date,
          reason,
        }),
      });
      setPicked(null);
      setQuery("");
      setAmount("");
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("この罰金を削除しますか？")) return;
    setBusy(true);
    try {
      await adminFetch(`${API}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">NBA 罰金（手入力）</h2>
        <select
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          {nbaLeagueStatsSeasonKeys().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-white/55">
        登録すると選手・チームの FINES（リーグ表 / チーム詳細 / 選手詳細）に反映されます。テクニカル・退場の規定罰金（$2,000〜$5,000）とテクニカル累積（16 回・プレーオフ 7 回）の出場停止は自動計算されるので入れないでください。NBA 公式発表の個別の罰金（審判批判・乱闘など）と、それ以外の出場停止（試合数のみ。失った年俸は CBA の計算式で自動）を入力します。NBA Official がテクニカル等の取り消しを発表したら「取り消し」で試合日と種類を入れると、回数・罰金・累積出場停止から差し引かれます。コーチ・チームへの罰金は入れないでください。
      </p>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="relative">
          <label className="mb-1 block text-xs text-white/60">選手</label>
          {picked ? (
            <div className="flex items-center justify-between rounded-lg border border-cyan-400/50 bg-black/40 px-3 py-2 text-sm">
              <span>
                {picked.playerName}{" "}
                <span className="text-white/50">
                  {TEAM_SHORT[picked.teamId] ?? picked.teamId} · #{picked.playerId}
                </span>
              </span>
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white"
                onClick={() => setPicked(null)}
              >
                変更
              </button>
            </div>
          ) : (
            <input
              className={input}
              placeholder="名前で検索（例: Draymond）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {!picked && candidates.length > 0 ? (
            <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-white/15 bg-[#0B0F17]">
              {candidates.map((c) => (
                <button
                  key={c.playerId}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                  onClick={() => {
                    setPicked(c);
                    setCandidates([]);
                  }}
                >
                  {c.playerName}{" "}
                  <span className="text-white/50">
                    {TEAM_SHORT[c.teamId] ?? c.teamId}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          {(
            [
              ["fine", "罰金"],
              ["suspension", "出場停止"],
              ["rescind", "取り消し"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                kind === k
                  ? "border-cyan-400 bg-cyan-400/15 text-cyan-200"
                  : "border-white/15 text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {kind === "fine" ? (
            <div>
              <label className="mb-1 block text-xs text-white/60">金額（USD）</label>
              <input
                className={input}
                inputMode="numeric"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          ) : kind === "rescind" ? (
            <div>
              <label className="mb-1 block text-xs text-white/60">
                取り消し対象（日付は試合日・米国日付）
              </label>
              <select
                className={input}
                value={rescindKind}
                onChange={(e) =>
                  setRescindKind(e.target.value as NbaDisciplineEventKind)
                }
              >
                <option value="tech">テクニカル</option>
                <option value="flag">フラグラント</option>
                <option value="eject">退場</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-white/60">
                試合数（失った年俸は自動計算）
              </label>
              <input
                className={input}
                inputMode="numeric"
                placeholder="1"
                value={games}
                onChange={(e) => setGames(e.target.value)}
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={onCourt}
                  onChange={(e) => setOnCourt(e.target.checked)}
                />
                コート上の行為（乱闘・フラグラントなど）
              </label>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-white/60">日付</label>
            <input
              className={input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">区分</label>
            <select
              className={input}
              value={seasonType}
              onChange={(e) =>
                setSeasonType(e.target.value as NbaDisciplineSeasonType)
              }
            >
              <option value="regular">レギュラーシーズン</option>
              <option value="playoffs">プレーオフ</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">理由（任意・表示されます）</label>
          <input
            className={input}
            placeholder="Criticizing officials"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-lg bg-cyan-500/90 px-4 py-2 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {busy ? "保存中…" : "登録"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left">日付</th>
              <th className="px-3 py-2 text-left">選手</th>
              <th className="px-3 py-2 text-left">チーム</th>
              <th className="px-3 py-2 text-right">金額</th>
              <th className="px-3 py-2 text-left">理由</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-white/50" colSpan={6}>
                  読み込み中…
                </td>
              </tr>
            ) : fines.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-white/50" colSpan={6}>
                  まだありません
                </td>
              </tr>
            ) : (
              fines.map((f) => (
                <tr key={f.id} className="border-t border-white/10">
                  <td className="px-3 py-2 tabular-nums">
                    {f.date}
                    {f.seasonType === "playoffs" ? (
                      <span className="ml-1 text-xs text-cyan-300">PO</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{f.playerName}</td>
                  <td className="px-3 py-2">{TEAM_SHORT[f.teamId] ?? f.teamId}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatDisciplineFineUsdFull(f.amountUsd)}
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    {f.kind === "suspension" ? (
                      <span className="mr-1 text-xs text-amber-300">
                        出場停止 {f.games ?? 0}試合
                      </span>
                    ) : null}
                    {f.kind === "rescind" ? (
                      <span className="mr-1 text-xs text-emerald-300">
                        取り消し{" "}
                        {f.rescindKind === "flag"
                          ? "フラグラント"
                          : f.rescindKind === "eject"
                            ? "退場"
                            : "テクニカル"}
                      </span>
                    ) : null}
                    {f.reason}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      className="text-xs text-red-300 hover:text-red-200"
                      onClick={() => void remove(f.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
