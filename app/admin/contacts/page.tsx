"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import Link from "next/link";
import {
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Contact = {
  id: string;
  type: string;
  message: string;
  email?: string | null;
  screenshotUrl?: string | null;
  userDisplayName?: string | null;
  userUid?: string | null;
  status: "unread" | "processing" | "done";
  createdAt?: any;
};

export default function AdminContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "contacts"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr: Contact[] = [];
      snap.forEach((doc) =>
        arr.push({
          id: doc.id,
          ...(doc.data() as any),
        })
      );
      setItems(arr);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-5 md:p-8">
      <h1 className="text-xl font-bold mb-4 text-white">お問い合わせ一覧</h1>

      <div className="space-y-4">
        {items.map((c) => {
          const unread = c.status === "unread";

          return (
            <Link
              key={c.id}
              href={`/admin/contacts/${c.id}`}
              className="block rounded-2xl bg-[#050509] p-4 
                         border border-white/10 hover:bg-white/5 
                         transition cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* 左アイコン */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  <MessageSquare className="h-5 w-5 text-sky-300" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">
                      {c.type}
                    </h2>

                    {unread && (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 
                                       shadow-[0_0_8px_rgba(255,0,0,0.8)]"></span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {c.message}
                  </p>

                  {/* メール & ユーザー */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {c.email}
                      </span>
                    )}
                    {c.userDisplayName && (
                      <span>@{c.userDisplayName}</span>
                    )}
                  </div>

                  {/* 日時 */}
                  <p className="text-[11px] text-gray-500 mt-1">
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleString()
                      : ""}
                  </p>
                </div>

                {/* ステータスアイコン */}
                {c.status === "processing" && (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                {c.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
