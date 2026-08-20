"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AdminGuard from "../../_components/AdminGuard";
import AdminInboxDetailClient from "@/app/component/admin/AdminInboxDetailClient";
import { isFeatureContactType } from "@/lib/admin/adminInbox";

function ContactDetailInner(props: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = use(props.params);
  const [backHref, setBackHref] = useState("/admin/contacts?kind=inbox");

  useEffect(() => {
    void getDoc(doc(db, "contacts", contactId)).then((snap) => {
      const type = String(snap.data()?.type ?? "");
      setBackHref(
        isFeatureContactType(type)
          ? "/admin/contacts?kind=feature"
          : "/admin/contacts?kind=inbox"
      );
    });
  }, [contactId]);

  return (
    <div className="space-y-6 p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-sky-400"
      >
        <ArrowLeft className="h-4 w-4" />
        一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-slate-100">お問い合わせ詳細</h1>
      <AdminInboxDetailClient contactId={contactId} />
    </div>
  );
}

export default function ContactDetailPage(props: {
  params: Promise<{ contactId: string }>;
}) {
  return (
    <AdminGuard>
      <ContactDetailInner {...props} />
    </AdminGuard>
  );
}
