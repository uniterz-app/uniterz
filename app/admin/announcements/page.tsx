"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ADMIN_UID } from "@/lib/constants";

type Row = {
  id: string;
  title: string;
  visible?: boolean;
  pinned?: boolean;
  priority?: number;
  postedAt?: any;
  type?: string;
  heroImageURL?: string | null;
};

export default function AdminAnnouncementsListPage() {
  const { fUser, status } = useFirebaseUser();
  const isAdmin = status === "ready" && fUser?.uid === ADMIN_UID;
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const q = query(
        collection(db, "announcements"),
        orderBy("pinned", "desc"),
        orderBy("priority", "desc"),
        orderBy("postedAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    })();
  }, [isAdmin]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  if (status !== "ready") return <div className="p-6 text-white">読み込み中…</div>;
  if (!isAdmin) return <div className="p-6 text-white">権限がありません</div>;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      <div className="mx-auto max-w-[1000px] px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">お知らせ（運営一覧）</h1>
          <Link
            href="/admin/announcements/new"
            className="rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold px-4 py-2 shadow-[0_0_20px_rgba(0,229,255,0.35)]"
          >
            新規作成
          </Link>
        </div>

        {loading && <p className="text-white/70">読み込み中…</p>}
        {empty && <p className="text-white/60">まだありません。</p>}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left">タイトル</th>
                  <th className="px-3 py-2">type</th>
                  <th className="px-3 py-2">公開</th>
                  <th className="px-3 py-2">固定</th>
                  <th className="px-3 py-2">優先度</th>
                  <th className="px-3 py-2">画像</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-white/50">{r.id}</div>
                    </td>
                    <td className="px-3 py-2 text-center">{r.type ?? "info"}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, "announcements", r.id), { visible: !r.visible });
                          setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, visible: !x.visible } : x));
                        }}
                        className={`px-2 py-1 rounded ${r.visible ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/70"}`}
                      >
                        {r.visible ? "公開" : "非公開"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, "announcements", r.id), { pinned: !r.pinned });
                          setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, pinned: !x.pinned } : x));
                        }}
                        className={`px-2 py-1 rounded ${r.pinned ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/70"}`}
                      >
                        {r.pinned ? "固定中" : "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">{r.priority ?? 0}</td>
                    <td className="px-3 py-2 text-center">
                      {r.heroImageURL ? <span className="text-white/70">あり</span> : <span className="text-white/40">なし</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/announcements/${r.id}/edit`}
                          className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                        >
                          編集
                        </Link>
                        <button
                          onClick={async () => {
                            if (!confirm("削除しますか？")) return;
                            await deleteDoc(doc(db, "announcements", r.id));
                            setRows((prev) => prev.filter((x) => x.id !== r.id));
                          }}
                          className="px-3 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
