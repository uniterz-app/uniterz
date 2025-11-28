"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/* ==========================================
 * 型
 * ========================================== */
type RankingRow = {
  uid: string;
  displayName: string;
  photoURL?: string;
  units: number;
};

type MasterBadge = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

/* ==========================================
 * メインページ
 * ========================================== */
export default function AdminBadgesPage() {
  const [league, setLeague] = useState<"all" | "b1" | "j1">("all");

  /* ランキング */
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 選択ユーザー */
  const [selected, setSelected] = useState<string[]>([]);

  /* バッジマスター */
  const [badges, setBadges] = useState<MasterBadge[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const selectedBadge = badges.find((b) => b.id === selectedBadgeId) || null;

  /* 付与処理 */
  const [assigning, setAssigning] = useState(false);
  const [assignDone, setAssignDone] = useState<string | null>(null);

  /* ==========================================
   * ランキング読み込み
   * ========================================== */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const q = `period=30d&league=${league}&metric=units&limit=20`;
        const res = await fetch(`/api/rankings?${q}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "failed");

        if (!cancelled) setRows(json.rows ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [league]);

  /* ==========================================
   * バッジマスター読み込み
   * ========================================== */
  useEffect(() => {
    async function loadBadges() {
      const colRef = collection(db, "master_badges");
      const snap = await getDocs(colRef);

      const list: MasterBadge[] = [];
      snap.forEach((d) => {
        const data = d.data() as MasterBadge;
        list.push({
          id: data.id,
          title: data.title,
          description: data.description,
          icon: data.icon || "",
        });
      });

      setBadges(list);
    }

    loadBadges();
  }, []);

  /* ==========================================
   * 選択ユーザー切替
   * ========================================== */
  function toggleSelect(uid: string) {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  /* ==========================================
   * バッジ付与処理
   * ========================================== */
  async function assignBadges() {
    if (!selectedBadge) {
      alert("バッジを選択してください");
      return;
    }
    if (selected.length === 0) {
      alert("ユーザーを選択してください");
      return;
    }

    if (
      !window.confirm(
        `選択中の ${selected.length} 人に「${selectedBadge.title}」を付与しますか？`
      )
    ) {
      return;
    }

    setAssigning(true);
    setAssignDone(null);

    try {
      for (const uid of selected) {
        const ref = doc(db, `users/${uid}/badges/${selectedBadge.id}`);

        await setDoc(ref, {
          id: selectedBadge.id,
          title: selectedBadge.title,
          description: selectedBadge.description,
          icon: selectedBadge.icon || "",
          awardedAt: serverTimestamp(),
        });
      }

      setAssignDone(
        `付与完了：${selected.length}人に「${selectedBadge.title}」を付与しました`
      );
      setSelected([]);
      setSelectedBadgeId(null);
    } catch (e: any) {
      setAssignDone(`エラー: ${e.message}`);
    } finally {
      setAssigning(false);
    }
  }

  /* ==========================================
   * UI
   * ========================================== */
  return (
    <div className="p-6 text-white space-y-8">
      <h1 className="text-2xl font-bold">バッジ付与（管理）</h1>

      {/* タブ */}
      <div className="flex gap-3">
        <Tab label="ALL" active={league === "all"} onClick={() => setLeague("all")} />
        <Tab label="B1" active={league === "b1"} onClick={() => setLeague("b1")} />
        <Tab label="J1" active={league === "j1"} onClick={() => setLeague("j1")} />
      </div>

      {/* ===== ランキング ===== */}
      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h2 className="font-semibold mb-3">ランキング（{league}）</h2>

        {loading && <p className="text-white/60">読み込み中…</p>}
        {error && <p className="text-red-400 text-sm">エラー: {error}</p>}

        {!loading && rows.length === 0 && (
          <p className="text-white/60 text-sm">ランキングデータなし</p>
        )}

        <ul className="space-y-3">
          {rows.map((r, i) => {
            const checked = selected.includes(r.uid);

            return (
              <li
                key={r.uid}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelect(r.uid)}
                  className="w-4 h-4 accent-emerald-400"
                />

                <span className="w-7 text-center text-lg font-bold text-amber-300">
                  {i + 1}
                </span>

                <img
                  src={r.photoURL || "/avatar/default.png"}
                  className="w-10 h-10 rounded-full border border-white/10"
                />

                <span className="font-semibold">{r.displayName}</span>

                <span className="ml-auto text-sm font-bold text-indigo-300">
                  {r.units.toFixed(1)} u
                </span>
              </li>
            );
          })}
        </ul>

        {selected.length > 0 && (
          <p className="mt-3 text-sm text-emerald-400">
            選択中のユーザー: {selected.length}人
          </p>
        )}
      </section>

      {/* ===== バッジマスター ===== */}
      <section className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
        <h2 className="font-semibold">バッジ一覧（master_badges）</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((b) => {
            const active = b.id === selectedBadgeId;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedBadgeId(b.id)}
                className={[
                  "p-3 rounded-xl border bg-white/5 text-left transition",
                  active
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={b.icon || "/badges/default.png"}
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <p className="font-bold text-sm">{b.title}</p>
                    <p className="text-xs text-white/60">{b.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* プレビュー */}
        {selectedBadge && (
          <div className="mt-4 p-4 border border-white/20 rounded-xl bg-white/5">
            <h3 className="font-semibold mb-2">選択中のバッジ</h3>
            <div className="flex items-center gap-3">
              <img
                src={selectedBadge.icon || "/badges/default.png"}
                className="w-12 h-12 object-contain"
              />
              <div>
                <p className="font-bold">{selectedBadge.title}</p>
                <p className="text-sm text-white/60">{selectedBadge.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== 付与ボタン ===== */}
        <button
          disabled={!selectedBadge || selected.length === 0 || assigning}
          onClick={assignBadges}
          className={[
            "mt-4 w-full py-3 rounded-xl text-sm font-semibold transition",
            !selectedBadge || selected.length === 0 || assigning
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 text-black",
          ].join(" ")}
        >
          {assigning ? "付与中…" : "選択したユーザーに付与する"}
        </button>

        {assignDone && (
          <p className="mt-3 text-sm text-emerald-300">{assignDone}</p>
        )}
      </section>
    </div>
  );
}

/* ==========================================
 * Tabコンポーネント
 * ========================================== */
function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-lg border text-sm transition",
        active
          ? "bg-white/20 border-white font-bold"
          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

