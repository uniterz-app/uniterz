"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/app/admin/_components/AdminGuard";
import { auth } from "@/lib/firebase";
import type { WcGameGoalScorer } from "@/lib/wc/goalScorer";
import { getWcSquad, getWcSquadPlayer } from "@/lib/wc/squads";

type GameRow = {
  id: string;
  status: string;
  final: boolean;
  roundLabel: string | null;
  startAtMillis: number | null;
  home: { teamId: string | null; name: string };
  away: { teamId: string | null; name: string };
  homeScore: number | null;
  awayScore: number | null;
  goalScorers: WcGameGoalScorer[];
};

type GameDetail = {
  game: GameRow;
};

type DraftRow = {
  key: string;
  side: "home" | "away" | "";
  playerName: string;
  minute: number | null;
  ownGoal: boolean;
};

function newDraftRow(): DraftRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    side: "",
    playerName: "",
    minute: null,
    ownGoal: false,
  };
}

function sideForTeamId(
  teamId: string,
  homeTeamId: string | null,
  awayTeamId: string | null
): "home" | "away" | "" {
  if (teamId && teamId === homeTeamId) return "home";
  if (teamId && teamId === awayTeamId) return "away";
  return "";
}

export default function AdminWcGoalScorersPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [draft, setDraft] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<"all" | "upcoming" | "final">(
    "all"
  );

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const user = auth.currentUser;
    if (!user) throw new Error("ログインが必要です");
    const token = await user.getIdToken();
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }, []);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/admin/wc-goal-scorers");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "load failed");
      setGames(json.games ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "読み込み失敗");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadDetail = useCallback(
    async (gameId: string) => {
      if (!gameId) {
        setDetail(null);
        setDraft([]);
        return;
      }
      setError(null);
      try {
        const res = await authFetch(
          `/api/admin/wc-goal-scorers?gameId=${encodeURIComponent(gameId)}`
        );
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? "load failed");
        const game = json.game as GameRow;
        setDetail({ game });
        const homeTeamId = game.home.teamId;
        const awayTeamId = game.away.teamId;
        const rows = (game.goalScorers as WcGameGoalScorer[]).map((g, i) => ({
          key: `saved-${i}`,
          side: sideForTeamId(g.teamId, homeTeamId, awayTeamId),
          playerName:
            getWcSquadPlayer(g.teamId, g.playerId)?.name ?? g.playerId,
          minute: g.minute ?? null,
          ownGoal: Boolean(g.ownGoal),
        }));
        setDraft(rows.length > 0 ? rows : [newDraftRow()]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "試合の読み込み失敗");
      }
    },
    [authFetch]
  );

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredGames = useMemo(() => {
    if (gameFilter === "final") return games.filter((g) => g.final);
    if (gameFilter === "upcoming") return games.filter((g) => !g.final);
    return games;
  }, [games, gameFilter]);

  const selectedLabel = useMemo(() => {
    const g = games.find((x) => x.id === selectedId);
    if (!g) return "";
    return `${g.home.name} vs ${g.away.name}`;
  }, [games, selectedId]);

  const squadNamesForSide = (side: "home" | "away" | ""): string[] => {
    if (!detail || !side) return [];
    const teamId =
      side === "home" ? detail.game.home.teamId : detail.game.away.teamId;
    if (!teamId) return [];
    return (getWcSquad(teamId) ?? []).map((p) => p.name);
  };

  const handleSave = async () => {
    if (!selectedId || !detail) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const goalScorers = draft
        .filter((r) => r.playerName.trim() && r.side)
        .map((r) => ({
          name: r.playerName.trim(),
          side: r.side,
          minute: r.minute ?? null,
          ownGoal: Boolean(r.ownGoal),
        }));

      const res = await authFetch("/api/admin/wc-goal-scorers", {
        method: "PUT",
        body: JSON.stringify({ gameId: selectedId, goalScorers }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "save failed");
      const resettled = Number(json.postsResettled ?? 0);
      setMessage(
        resettled > 0
          ? `保存しました（終了済み試合：投稿 ${resettled} 件の得点者ボーナスを再計算）`
          : "保存しました"
      );
      await loadGames();
      await loadDetail(selectedId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">WC 得点者入力</h2>
          <p className="mt-1 text-sm text-white/60">
            チーム・選手名・分数だけ入力すれば OK。保存時に名簿から自動で選手 ID
            に変換されます。オウンゴールは OG にチェック（ボーナス対象外）。
          </p>
          <p className="mt-2 text-xs text-white/45">
            Firestore に直接入れる場合:{" "}
            <code className="text-white/55">
              {`{ "name": "Cristiano Ronaldo", "minute": 23, "side": "home" }`}
            </code>
          </p>
        </div>

        {loading ? (
          <p className="text-white/60">読み込み中…</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "すべて" },
                  { key: "upcoming", label: "未終了" },
                  { key: "final", label: "終了済み" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setGameFilter(item.key)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    gameFilter === item.key
                      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-50"
                      : "border-white/12 bg-white/4 text-white/65 hover:bg-white/8",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl space-y-2">
              <span className="text-sm text-white/70">試合を選択</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— 選択 —</option>
                {filteredGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.roundLabel ?? g.id} · {g.home.name} vs {g.away.name}
                    {g.final ? "（終了）" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {detail ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 space-y-4">
            <div className="text-sm text-white/80">
              <span className="font-semibold text-white">{selectedLabel}</span>
              {detail.game.homeScore != null && detail.game.awayScore != null ? (
                <span className="ml-2 tabular-nums text-cyan-200/90">
                  {detail.game.homeScore} - {detail.game.awayScore}
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              {draft.map((row, index) => {
                const suggestions = squadNamesForSide(row.side);
                const listId = `scorer-names-${row.key}`;
                return (
                  <div
                    key={row.key}
                    className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 md:grid-cols-[120px_1fr_80px_auto_auto]"
                  >
                    <select
                      className="rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-sm"
                      value={row.side}
                      onChange={(e) => {
                        const side = e.target.value as DraftRow["side"];
                        setDraft((prev) =>
                          prev.map((r, i) =>
                            i === index ? { ...r, side } : r
                          )
                        );
                      }}
                    >
                      <option value="">チーム</option>
                      <option value="home">{detail.game.home.name}</option>
                      <option value="away">{detail.game.away.name}</option>
                    </select>

                    <input
                      type="text"
                      list={suggestions.length > 0 ? listId : undefined}
                      placeholder="選手名（例: Ronaldo）"
                      className="rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-sm"
                      value={row.playerName}
                      onChange={(e) => {
                        const playerName = e.target.value;
                        setDraft((prev) =>
                          prev.map((r, i) =>
                            i === index ? { ...r, playerName } : r
                          )
                        );
                      }}
                    />
                    {suggestions.length > 0 ? (
                      <datalist id={listId}>
                        {suggestions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    ) : null}

                    <input
                      type="number"
                      min={0}
                      placeholder="分"
                      className="rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-sm"
                      value={row.minute ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((prev) =>
                          prev.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  minute: v === "" ? null : Number(v),
                                }
                              : r
                          )
                        );
                      }}
                    />

                    <label className="flex items-center gap-2 text-xs text-white/70 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={Boolean(row.ownGoal)}
                        onChange={(e) => {
                          setDraft((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? { ...r, ownGoal: e.target.checked }
                                : r
                            )
                          );
                        }}
                      />
                      OG
                    </label>

                    <button
                      type="button"
                      className="text-xs text-red-300/90 hover:text-red-200"
                      onClick={() =>
                        setDraft((prev) =>
                          prev.length <= 1
                            ? [newDraftRow()]
                            : prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      削除
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                onClick={() => setDraft((prev) => [...prev, newDraftRow()])}
              >
                得点者を追加
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-xl bg-cyan-600/90 px-5 py-2 text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50"
                onClick={() => void handleSave()}
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="text-sm text-emerald-300/90">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-red-300/90">{error}</p> : null}
      </div>
    </AdminGuard>
  );
}
