"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  adminContactTypeLabel,
  formatAdminInboxDate,
  parseAdminContactRow,
  type AdminContactRow,
} from "@/lib/admin/adminInbox";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Props = {
  contactId: string;
};

export default function AdminInboxDetailClient({ contactId }: Props) {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isJa = language !== "en";
  const [row, setRow] = useState<AdminContactRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ref = doc(db, "contacts", contactId);
      const snap = await getDoc(ref);
      if (!alive) return;
      if (!snap.exists()) {
        setRow(null);
        setLoading(false);
        return;
      }
      const parsed = parseAdminContactRow(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      setRow(parsed);
      setLoading(false);
      if (parsed.status === "unread") {
        await updateDoc(ref, { status: "read" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [contactId]);

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
      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-white">
          {isJa ? "種別" : "Type"}：
          {adminContactTypeLabel(row.type, isJa ? "ja" : "en")}
        </p>
        <p className="text-sm text-white">
          {isJa ? "ユーザー" : "User"}：
          {row.userDisplayName || (isJa ? "不明" : "Unknown")}
        </p>
        {row.email ? (
          <p className="text-sm text-white">
            {isJa ? "メール" : "Email"}：{row.email}
          </p>
        ) : null}
        <p className="text-xs text-white/45">
          {formatAdminInboxDate(row.createdAtMs, isJa ? "ja" : "en")}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
          {row.message}
        </p>
      </div>

      {row.screenshotUrl ? (
        <div className="space-y-2">
          <p className="text-sm text-white/70">
            {isJa ? "添付画像" : "Attachment"}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.screenshotUrl}
            alt=""
            className="max-w-[300px] rounded-xl border border-white/10 object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
