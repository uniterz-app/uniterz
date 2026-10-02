"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { parseRedemptionRequestClient } from "@/lib/redemption/parseRedemptionClient";
import { redemptionStatusLabel } from "@/lib/redemption/redemptionStatus";
import type { RedemptionRequest } from "@/lib/redemption/redemptionTypes";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { formatAdminInboxDate } from "@/lib/admin/adminInbox";

type Props = {
  itemHref: (id: string) => string;
};

export default function AdminRedemptionsListClient({ itemHref }: Props) {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isJa = language !== "en";
  const [items, setItems] = useState<RedemptionRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "unit_redemptions"), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) =>
          parseRedemptionRequestClient(d.id, d.data() as Record<string, unknown>)
        );
        rows.sort((a, b) => (b.updatedAtMs || b.createdAtMs) - (a.updatedAtMs || a.createdAtMs));
        setItems(rows);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, []);

  if (!ready) {
    return <p className="text-sm text-white/45">読み込み中…</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-white/45">
        {isJa ? "商品交換申請はまだありません" : "No redemption requests yet"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row) => {
        const pending = row.status === "pending";
        return (
          <Link
            key={row.id}
            href={itemHref(row.id)}
            className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                {row.productName || row.productKind}
              </h2>
              {pending ? (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              ) : null}
            </div>
            <p className="mt-1 text-xs text-white/60">
              {redemptionStatusLabel(row.status, isJa ? "ja" : "en")} ·{" "}
              {row.unitsRequired} Unit
            </p>
            <p className="mt-1 text-[11px] text-white/35">
              {formatAdminInboxDate(
                row.updatedAtMs || row.createdAtMs,
                isJa ? "ja" : "en"
              )}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
