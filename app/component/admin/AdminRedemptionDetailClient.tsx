"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ADMIN_REDEMPTION_STATUSES, parseRedemptionRequestClient } from "@/lib/redemption/parseRedemptionClient";
import { redemptionStatusLabel } from "@/lib/redemption/redemptionStatus";
import type { RedemptionRequest, RedemptionRequestStatus } from "@/lib/redemption/redemptionTypes";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

async function adminPatch(body: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  const res = await fetch("/api/admin/redemptions", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
}

type Props = {
  redemptionId: string;
};

export default function AdminRedemptionDetailClient({ redemptionId }: Props) {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isJa = language !== "en";
  const [row, setRow] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RedemptionRequestStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db, "unit_redemptions", redemptionId));
    if (!snap.exists()) {
      setRow(null);
      return;
    }
    const parsed = parseRedemptionRequestClient(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    setRow(parsed);
    setStatus(parsed.status);
    setTrackingNumber(parsed.trackingNumber ?? "");
    setTrackingCarrier(parsed.trackingCarrier ?? "");
    setOrderReference(parsed.orderReference ?? "");
    setAdminNote(parsed.adminNote ?? "");
  }, [redemptionId]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  async function save() {
    if (!row) return;
    setBusy(true);
    setError(null);
    try {
      await adminPatch({
        id: row.id,
        status,
        trackingNumber: trackingNumber || null,
        trackingCarrier: trackingCarrier || null,
        orderReference: orderReference || null,
        adminNote: adminNote || null,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/45">読み込み中…</p>;
  }
  if (!row) {
    return (
      <p className="text-sm text-white/45">
        {isJa ? "見つかりませんでした" : "Not found"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">
        <p className="font-semibold text-white">{row.productName}</p>
        <p>
          {row.unitsRequired} Unit · {row.size} / {row.color}
        </p>
        {row.productUrl ? (
          <a
            href={row.productUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-cyan-300"
          >
            {row.productUrl}
          </a>
        ) : null}
        <p className="pt-2 text-white/70">
          {row.shippingName}
          <br />
          {row.shippingPostalCode} {row.shippingAddress}
          <br />
          {row.shippingPhone}
        </p>
      </div>

      <label className="block text-xs text-white/50">
        {isJa ? "ステータス" : "Status"}
        <select
          className="mt-1 w-full rounded border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value as RedemptionRequestStatus)}
        >
          {ADMIN_REDEMPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {redemptionStatusLabel(s, isJa ? "ja" : "en")}
            </option>
          ))}
        </select>
      </label>

      {(
        [
          [isJa ? "注文番号" : "Order ref", orderReference, setOrderReference],
          [isJa ? "配送会社" : "Carrier", trackingCarrier, setTrackingCarrier],
          [isJa ? "追跡番号" : "Tracking", trackingNumber, setTrackingNumber],
          [isJa ? "メモ" : "Note", adminNote, setAdminNote],
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
        {isJa ? "保存" : "Save"}
      </button>
    </div>
  );
}
