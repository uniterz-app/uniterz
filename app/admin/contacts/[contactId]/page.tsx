"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

/* ===============================
 * 型
 * =============================== */
type Contact = {
  id: string;
  type: string;
  message: string;
  email?: string;
  screenshotUrl?: string;
  createdAt?: { seconds: number; nanoseconds?: number };
  status?: string;
  userUid?: string | null;
  userDisplayName?: string | null;
};

/* ===============================
 * ページ本体
 * =============================== */
export default function ContactDetailPage(props: {
  params: Promise<{ contactId: string }>;
}) {
  /* Next.js 15 の新仕様：params は Promise → use() で unwrap */
  const { contactId } = use(props.params);

  const { fUser: user } = useFirebaseUser();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
   * Firestore 読み込み & 既読へ更新
   * =============================== */
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "contacts", contactId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const raw = snap.data() as any;

        const formatted: Contact = {
          id: snap.id,
          type: raw.type ?? "",
          message: raw.message ?? "",
          email: raw.email ?? "",
          screenshotUrl: raw.screenshotUrl ?? "",
          createdAt: raw.createdAt ?? undefined,
          status: raw.status ?? "unread",
          userUid: raw.userUid ?? null,
          userDisplayName: raw.userDisplayName ?? null,
        };

        setContact(formatted);

        // 未読 → 既読
        if (formatted.status !== "read") {
          await updateDoc(ref, { status: "read" });
        }
      }

      setLoading(false);
    };

    load();
  }, [contactId]);

  /* ===============================
   * 非管理者ブロック
   * =============================== */
  if (!user) {
    return <div className="p-6 text-slate-200">管理者ログインが必要です</div>;
  }

  /* ===============================
   * Loading
   * =============================== */
  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-100">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /* ===============================
   * 画面
   * =============================== */
  return (
    <div className="p-6 space-y-6">

      {/* 戻る */}
      <Link
        href="/admin/contacts"
        className="inline-flex items-center gap-2 text-sky-400 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        一覧に戻る
      </Link>

      <h1 className="text-xl font-bold text-slate-100">お問い合わせ詳細</h1>

      {/* メタ情報 */}
      <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/10">
        <p className="text-sm text-slate-100">種別：{contact.type}</p>
        <p className="text-sm text-slate-100">
          ユーザー：{contact.userDisplayName || "不明"}
        </p>

        {contact.email && (
          <p className="text-sm text-slate-100">メール：{contact.email}</p>
        )}

        <p className="text-xs text-slate-400">
          {contact.createdAt
            ? new Date(contact.createdAt.seconds * 1000).toLocaleString()
            : ""}
        </p>
      </div>

      {/* 本文 */}
      <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-white/10">
        <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
          {contact.message}
        </p>
      </div>

      {/* スクショ（小さく） */}
      {contact.screenshotUrl && (
        <div className="space-y-2">
          <p className="text-slate-300 text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            添付画像
          </p>

          <img
            src={contact.screenshotUrl}
            className="rounded-xl border border-white/10 max-w-[300px] object-contain"
          />
        </div>
      )}
    </div>
  );
}
