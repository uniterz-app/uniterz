"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  adminContactTypeLabel,
  isAdminContactUnread,
  matchesAdminInboxKind,
  parseAdminContactRow,
  formatAdminInboxDate,
  type AdminContactRow,
  type AdminInboxKind,
} from "@/lib/admin/adminInbox";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

type Props = {
  kind: AdminInboxKind;
  itemHref: (id: string) => string;
};

export default function AdminInboxListClient({ kind, itemHref }: Props) {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isJa = language !== "en";
  const [items, setItems] = useState<AdminContactRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "contacts"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: AdminContactRow[] = [];
        snap.forEach((docSnap) => {
          rows.push(
            parseAdminContactRow(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          );
        });
        setItems(rows);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, []);

  const visible = useMemo(
    () => items.filter((c) => matchesAdminInboxKind(c.type, kind)),
    [items, kind]
  );

  const empty =
    kind === "feature"
      ? isJa
        ? "機能リクエストはまだありません"
        : "No feature requests yet"
      : isJa
        ? "問い合わせはまだありません"
        : "No inquiries yet";

  if (!ready) {
    return <p className="text-sm text-white/45">読み込み中…</p>;
  }

  if (visible.length === 0) {
    return <p className="text-sm text-white/45">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {visible.map((c) => {
        const unread = isAdminContactUnread(c.status);
        return (
          <Link
            key={c.id}
            href={itemHref(c.id)}
            className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    {adminContactTypeLabel(c.type, isJa ? "ja" : "en")}
                  </h2>
                  {unread ? (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      aria-label={isJa ? "未読" : "Unread"}
                    />
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/70">
                  {c.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/45">
                  {c.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} /> {c.email}
                    </span>
                  ) : null}
                  {c.userDisplayName ? <span>@{c.userDisplayName}</span> : null}
                </div>
                <p className="mt-1 text-[11px] text-white/35">
                  {formatAdminInboxDate(c.createdAtMs, isJa ? "ja" : "en")}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
