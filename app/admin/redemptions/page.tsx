"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "../_components/AdminGuard";
import { auth } from "@/lib/firebase";
import type { RedemptionRequest } from "@/lib/redemption/redemptionTypes";
import { redemptionStatusLabel } from "@/lib/redemption/redemptionStatus";

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

export default function AdminRedemptionsPage() {
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/redemptions");
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status);
    setTrackingNumber(selected.trackingNumber ?? "");
    setTrackingCarrier(selected.trackingCarrier ?? "");
    setOrderReference(selected.orderReference ?? "");
    setAdminNote(selected.adminNote ?? "");
  }, [selected]);

  async function save() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/redemptions", {
        method: "PATCH",
        body: JSON.stringify({
          id: selected.id,
          status,
          trackingNumber: trackingNumber || null,
          trackingCarrier: trackingCarrier || null,
          orderReference: orderReference || null,
          adminNote: adminNote || null,
        }),
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
          <h1 className="text-xl font-semibold">商品交換申請</h1>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded border border-white/20 px-3 py-1 text-sm text-white/70"
          >
            更新
          </button>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {loading ? (
          <p className="text-white/50">読み込み中…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ul className="max-h-[70vh] space-y-2 overflow-auto rounded-xl border border-white/10 p-2">
              {requests.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={[
                      "w-full rounded-lg border px-3 py-2 text-left text-sm",
                      selectedId === row.id
                        ? "border-cyan-300/40 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div className="font-medium">{row.productName}</div>
                    <div className="text-xs text-white/50">
                      {redemptionStatusLabel(row.status, "ja")} · {row.unitsRequired}{" "}
                      Unit · {row.uid.slice(0, 8)}…
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              {!selected ? (
                <p className="text-sm text-white/50">左から申請を選択</p>
              ) : (
                <>
                  <p className="text-sm text-white/60">
                    {selected.productUrl}
                    <br />
                    {selected.shippingName} / {selected.shippingAddress}
                    <br />
                    {selected.shippingPhone}
                  </p>
                  <label className="block text-xs text-white/50">
                    ステータス
                    <select
                      className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-2 text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {[
                        "pending",
                        "needs_revision",
                        "approved",
                        "ordered",
                        "shipped",
                        "completed",
                        "cancelled",
                        "rejected",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {redemptionStatusLabel(s as RedemptionRequest["status"], "ja")}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      ["注文番号", orderReference, setOrderReference],
                      ["配送会社", trackingCarrier, setTrackingCarrier],
                      ["追跡番号", trackingNumber, setTrackingNumber],
                      ["メモ", adminNote, setAdminNote],
                    ] as const
                  ).map(([label, value, set]) => (
                    <label key={label} className="block text-xs text-white/50">
                      {label}
                      <input
                        className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save()}
                    className="rounded border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-50"
                  >
                    保存
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
