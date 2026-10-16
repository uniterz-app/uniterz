"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "../_components/AdminGuard";
import { auth } from "@/lib/firebase";
import {
  PARTNER_INVITEE_UNITS,
  isValidPartnerCodeFormat,
  type ReferralPartnerRow,
} from "@/lib/referral/referralPartner";
import { normalizeReferralInviteCode } from "@/lib/referral/referralInviteCode";

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

const ERROR_LABELS: Record<string, string> = {
  invalid_code: "コードは英数字 4〜20 文字（ハイフン可・UNIT- で始まらない）",
  code_taken: "そのコードは既に使われています",
};

export default function AdminReferralPartnersPage() {
  const [partners, setPartners] = useState<ReferralPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/referral-partners");
      setPartners(Array.isArray(data.partners) ? data.partners : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const normalized = normalizeReferralInviteCode(code);
  const canCreate = isValidPartnerCodeFormat(normalized) && label.trim() !== "" && !busy;

  async function create() {
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/referral-partners", {
        method: "POST",
        body: JSON.stringify({ code: normalized, label: label.trim() }),
      });
      setCode("");
      setLabel("");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setError(ERROR_LABELS[msg] ?? msg);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: ReferralPartnerRow) {
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/referral-partners", {
        method: "PATCH",
        body: JSON.stringify({ code: row.code, active: !row.active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-4 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">パートナー招待コード</h1>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded border border-white/20 px-3 py-1 text-sm text-white/70"
          >
            更新
          </button>
        </div>
        <p className="text-sm text-white/60">
          YouTuber などに渡す専用コード。登録時にこのコードを入れた人に、その場で +
          {PARTNER_INVITEE_UNITS} Unit。人数制限なし。紹介者への Unit はなし。開幕前ボーナスは対象外。
          「予想中」「7日達成」は効果測定用。
        </p>

        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-xs text-white/50">
            コード
            <input
              className="mt-1 w-48 rounded border border-white/15 bg-black/40 px-2 py-2 text-sm uppercase text-white"
              placeholder="HOOPCULTURE"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label className="block text-xs text-white/50">
            名前（管理用）
            <input
              className="mt-1 w-56 rounded border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
              placeholder="Hoop Culture（FR）"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => void create()}
            className="rounded border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-40"
          >
            発行
          </button>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {loading ? (
          <p className="text-white/50">読み込み中…</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-white/50">まだコードはありません</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-2">コード</th>
                <th>名前</th>
                <th className="text-right">登録</th>
                <th className="text-right">予想中</th>
                <th className="text-right">7日達成</th>
                <th className="text-right">Unit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {partners.map((row) => (
                <tr key={row.code} className="border-t border-white/10">
                  <td className="py-2 font-mono">{row.code}</td>
                  <td className="text-white/80">{row.label}</td>
                  <td className="text-right">{row.stats.registered}</td>
                  <td className="text-right">{row.stats.inProgress}</td>
                  <td className="text-right">{row.stats.completed}</td>
                  <td className="text-right">+{row.inviteeUnits}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggle(row)}
                      className={[
                        "rounded border px-2 py-1 text-xs disabled:opacity-40",
                        row.active
                          ? "border-white/20 text-white/70"
                          : "border-amber-300/40 text-amber-200",
                      ].join(" ")}
                    >
                      {row.active ? "停止する" : "停止中 · 再開"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminGuard>
  );
}
